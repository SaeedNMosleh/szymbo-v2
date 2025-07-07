// app/api/practice-new/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { z } from "zod";

const progressUpdateSchema = z.object({
  conceptId: z.string(),
  questionId: z.string().optional(),
  isCorrect: z.boolean(),
  responseTime: z.number().min(0),
  userId: z.string().optional().default("default"),
  difficultyRating: z.number().min(1).max(5).optional(),
  userAnswer: z.string().optional(),
  sessionId: z.string().optional(),
});

// POST /api/practice-new/progress - Update concept progress
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      conceptId,
      questionId,
      isCorrect,
      responseTime,
      userId,
      difficultyRating,
      // userAnswer, - removed unused variable
      sessionId,
    } = progressUpdateSchema.parse(body);

    // Update concept progress using SRS
    const updatedProgress = await SRSCalculator.updateConceptProgress(
      conceptId,
      isCorrect,
      responseTime,
      userId,
      difficultyRating
    );

    // Update question performance if questionId provided
    if (questionId) {
      const practiceEngine = new ConceptPracticeEngine();
      await practiceEngine.updateQuestionPerformance(questionId, isCorrect);
    }

    // Log practice activity (optional - for analytics)
    if (sessionId) {
      // Could save to practice session log here
      console.log(
        `Session ${sessionId}: Concept ${conceptId} - ${isCorrect ? "Correct" : "Incorrect"}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          conceptId,
          nextReview: updatedProgress.nextReview,
          masteryLevel: updatedProgress.masteryLevel,
          successRate: updatedProgress.successRate,
          consecutiveCorrect: updatedProgress.consecutiveCorrect,
          intervalDays: updatedProgress.intervalDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid progress data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error updating progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/practice-new/progress - Get user progress summary
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const conceptId = searchParams.get("conceptId");

    if (conceptId) {
      // Get specific concept progress
      const progress = await SRSCalculator.initializeConceptProgress(
        conceptId,
        userId
      );

      return NextResponse.json(
        {
          success: true,
          data: progress,
        },
        { status: 200 }
      );
    } else {
      // Get due concepts summary
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            dueConcepts: dueProgress.length,
            overdueConcepts: overdueProgress.length,
            dueConceptIds: dueProgress.map((p) => p.conceptId),
            overdueConceptIds: overdueProgress.map((p) => p.conceptId),
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch progress data",
      },
      { status: 500 }
    );
  }
}
