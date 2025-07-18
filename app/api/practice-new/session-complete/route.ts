// app/api/practice-new/session-complete/route.ts - Complete practice sessions with metrics
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import ConceptPracticeSession, { IConceptPracticeSession, IQuestionResponse } from "@/datamodels/conceptPracticeSession.model";
import ConceptProgress from "@/datamodels/conceptProgress.model";
import { z } from "zod";

const sessionCompleteSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().optional().default("default"),
  completionReason: z.enum(['completed', 'abandoned']),
  totalTimeSpent: z.number().min(0).optional(),
});

// POST /api/practice-new/session-complete - Complete a practice session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      sessionId,
      userId,
      completionReason,
      totalTimeSpent,
    } = sessionCompleteSchema.parse(body);

    console.log(`🏁 Completing session ${sessionId}: ${completionReason}`);

    // Find the active session
    const session = await ConceptPracticeSession.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Practice session not found or already completed",
        },
        { status: 404 }
      );
    }

    // Calculate session metrics based on actual responses
    const completedQuestions = session.questionResponses.filter(
      (resp: IQuestionResponse) => resp.isCorrect || resp.attempts >= 3
    );

    const correctAnswers = session.questionResponses.filter(
      (resp: IQuestionResponse) => resp.isCorrect
    ).length;

    const totalQuestions = completedQuestions.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Calculate average response time
    const averageResponseTime = completedQuestions.length > 0
      ? completedQuestions.reduce((sum: number, resp: IQuestionResponse) => sum + resp.responseTime, 0) / completedQuestions.length
      : 0;

    // Update session with completion data
    session.completedAt = new Date();
    session.completionReason = completionReason;
    session.isActive = false;
    session.sessionMetrics = {
      totalQuestions,
      correctAnswers,
      newQuestionsGenerated: session.sessionMetrics.newQuestionsGenerated,
    };

    await session.save();

    // Generate session analysis
    const sessionAnalysis = {
      sessionId,
      completionReason,
      duration: totalTimeSpent || 0,
      questionsAttempted: totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      averageResponseTime: Math.round(averageResponseTime),
      conceptsReviewed: [...new Set(session.questionResponses.flatMap(
        (resp: IQuestionResponse) => session.questionsUsed.includes(resp.questionId) ? session.selectedConcepts : []
      ))].length,
      attemptsBreakdown: {
        firstAttempt: session.questionResponses.filter((resp: IQuestionResponse) => resp.isCorrect && resp.attempts === 1).length,
        secondAttempt: session.questionResponses.filter((resp: IQuestionResponse) => resp.isCorrect && resp.attempts === 2).length,
        thirdAttempt: session.questionResponses.filter((resp: IQuestionResponse) => resp.isCorrect && resp.attempts === 3).length,
        failed: session.questionResponses.filter((resp: IQuestionResponse) => !resp.isCorrect && resp.attempts >= 3).length,
      },
      strongConcepts: [], // Could be calculated based on performance
      weakConcepts: [],   // Could be calculated based on performance
    };

    // Generate recommendations based on performance
    const recommendations = generateRecommendations(sessionAnalysis, completionReason);

    // Update concept progress summary (for concepts that were actually practiced)
    const conceptsWithProgress = await updateConceptProgressSummary(
      session.selectedConcepts,
      userId,
      completionReason
    );

    console.log(
      `✅ Session ${sessionId} completed: ${totalQuestions} questions, ${correctAnswers} correct (${Math.round(accuracy)}%)`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          completionReason,
          analysis: sessionAnalysis,
          recommendations,
          conceptsWithProgress,
          nextSteps: generateNextSteps(sessionAnalysis, completionReason),
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error completing session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate recommendations
function generateRecommendations(analysis: any, completionReason: string): string[] {
  const recommendations: string[] = [];

  if (completionReason === 'abandoned') {
    recommendations.push("Consider shorter practice sessions to build consistency");
    recommendations.push("Focus on concepts you find most engaging");
  }

  if (analysis.accuracy < 50) {
    recommendations.push("Review the concepts that appeared in this session");
    recommendations.push("Consider drilling weak concepts with targeted practice");
  } else if (analysis.accuracy > 80) {
    recommendations.push("Great job! You're ready for more challenging concepts");
    recommendations.push("Consider adding new concepts to your practice rotation");
  }

  if (analysis.attemptsBreakdown.failed > 0) {
    recommendations.push("Review the concepts from questions you couldn't answer");
    recommendations.push("Consider creating flashcards for difficult concepts");
  }

  if (analysis.questionsAttempted < 5) {
    recommendations.push("Try to complete more questions in each session for better progress");
  }

  return recommendations;
}

// Helper function to generate next steps
function generateNextSteps(analysis: any, completionReason: string): string[] {
  const nextSteps: string[] = [];

  if (completionReason === 'completed') {
    nextSteps.push("Continue with your next practice session");
    nextSteps.push("Review any concepts you struggled with");
  } else {
    nextSteps.push("Try a shorter practice session next time");
    nextSteps.push("Focus on concepts that interest you most");
  }

  if (analysis.accuracy > 70) {
    nextSteps.push("Consider adding new concepts to your practice");
    nextSteps.push("Try a different question type for variety");
  }

  return nextSteps;
}

// Helper function to update concept progress summary
async function updateConceptProgressSummary(
  conceptIds: string[],
  userId: string,
  completionReason: string
): Promise<any[]> {
  try {
    const progressRecords = await ConceptProgress.find({
      userId,
      conceptId: { $in: conceptIds },
      isActive: true,
    });

    return progressRecords.map(progress => ({
      conceptId: progress.conceptId,
      masteryLevel: progress.masteryLevel,
      successRate: progress.successRate,
      nextReview: progress.nextReview,
      lastPracticed: progress.lastPracticed,
      consecutiveCorrect: progress.consecutiveCorrect,
      intervalDays: progress.intervalDays,
    }));
  } catch (error) {
    console.error("Error updating concept progress summary:", error);
    return [];
  }
}

// GET /api/practice-new/session-complete - Get session completion data
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId") || "default";

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        { status: 400 }
      );
    }

    const session = await ConceptPracticeSession.findOne({
      sessionId,
      userId,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: session.sessionId,
          mode: session.mode,
          completionReason: session.completionReason,
          completedAt: session.completedAt,
          metrics: session.sessionMetrics,
          questionResponses: session.questionResponses,
          isActive: session.isActive,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching session completion data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch session data",
      },
      { status: 500 }
    );
  }
}