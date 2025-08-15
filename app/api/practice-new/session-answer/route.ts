// app/api/practice-new/session-answer/route.ts - Handle question attempts in practice sessions
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import {
  shouldUseClientValidation,
  getValidationMethodInfo,
  validateQuestionAnswer,
  type UnifiedValidationInput,
} from "@/lib/practiceEngine/clientValidation";
import ConceptPracticeSession, {
  IQuestionResponse,
} from "@/datamodels/conceptPracticeSession.model";
import QuestionBank from "@/datamodels/questionBank.model";
import Course from "@/datamodels/course.model";
import { PracticeMode } from "@/lib/enum";
import { z } from "zod";

const sessionAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  userAnswer: z.union([z.string().min(1), z.array(z.string())]),
  responseTime: z.number().min(0),
  userId: z.string().optional().default("default"),
  attemptNumber: z.number().min(1).max(3),
});

// POST /api/practice-new/session-answer - Submit answer for a question in a session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      sessionId,
      questionId,
      userAnswer,
      responseTime,
      userId,
      attemptNumber,
    } = sessionAnswerSchema.parse(body);

    console.log(
      `🎯 Session ${sessionId}: Question ${questionId} - Attempt ${attemptNumber}`
    );

    // Get or create the practice session
    let session = await ConceptPracticeSession.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    // If session doesn't exist, create it
    if (!session) {
      console.log(`🆕 Creating new practice session: ${sessionId}`);
      session = new ConceptPracticeSession({
        sessionId,
        userId,
        mode: PracticeMode.NORMAL, // Default mode
        selectedConcepts: [], // Will be populated later if needed
        questionsUsed: [],
        questionResponses: [],
        startedAt: new Date(),
        completionReason: 'abandoned', // Default, will be updated on completion
        sessionMetrics: {
          totalQuestions: 0,
          correctAnswers: 0,
          newQuestionsGenerated: 0,
        },
        isActive: true,
      });
      await session.save();
    }

    // Get the question from the question bank
    const question = await QuestionBank.findOne({
      id: questionId,
      isActive: true,
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found or inactive",
        },
        { status: 404 }
      );
    }

    // Use unified validation that ensures correctAnswer immutability
    const validationMethod = getValidationMethodInfo(question.questionType);
    
    console.log(
      `🔍 Using ${validationMethod.method} validation for ${question.questionType}: ${validationMethod.reason}`
    );

    const validationInput: UnifiedValidationInput = {
      questionType: question.questionType,
      userAnswer,
      correctAnswer: question.correctAnswer, // IMMUTABLE stored answer
      question: question.question,
      attemptNumber,
    };

    // Get course context for LLM validation if needed
    const courseContext = !shouldUseClientValidation(question.questionType) 
      ? await Course.findOne({ courseId: 1 }) || {
          courseId: 1,
          courseName: "Default Polish Course",
          courseDescription: "Polish language learning course",
          courseType: "new",
          coursePeriod: "semester",
          isActive: true,
        }
      : undefined;

    const validationResult = await validateQuestionAnswer(validationInput, courseContext);
    
    console.log(`✅ ${validationMethod.method} validation completed`);

    // Legacy tracking for backward compatibility
    let llmResult = null;
    if (!shouldUseClientValidation(question.questionType)) {
      llmResult = {
        analysisDetails: {
          confidence: validationResult.confidence,
          mistakeType: null,
          questionLevel: question.difficulty,
        },
        keywords: [],
      };
    }

    const isCorrect = validationResult.isCorrect;
    const feedback = validationResult.feedback;
    const correctAnswer = validationResult.correctAnswer;

    // Check if this is the final attempt or question is correct
    const isQuestionCompleted = isCorrect || attemptNumber >= 3;

    // Find existing response for this question in the session
    let questionResponse = session.questionResponses.find(
      (resp: IQuestionResponse) => resp.questionId === questionId
    );

    if (questionResponse) {
      // Update existing response
      questionResponse.attempts = attemptNumber;
      questionResponse.isCorrect = isCorrect;
      questionResponse.responseTime += responseTime; // Accumulate response time
      questionResponse.userAnswer = Array.isArray(userAnswer)
        ? userAnswer.join(", ")
        : userAnswer;
      questionResponse.timestamp = new Date();
    } else {
      // Create new response
      questionResponse = {
        questionId,
        attempts: attemptNumber,
        isCorrect,
        responseTime,
        userAnswer: Array.isArray(userAnswer)
          ? userAnswer.join(", ")
          : userAnswer,
        timestamp: new Date(),
      };
      session.questionResponses.push(questionResponse);
    }

    // If question is completed, update metrics and progress
    if (isQuestionCompleted) {
      // Update session metrics
      session.sessionMetrics.totalQuestions = session.questionResponses.filter(
        (resp: IQuestionResponse) => resp.isCorrect || resp.attempts >= 3
      ).length;
      session.sessionMetrics.correctAnswers = session.questionResponses.filter(
        (resp: IQuestionResponse) => resp.isCorrect
      ).length;

      // Update question bank performance
      const practiceEngine = new ConceptPracticeEngine();
      await practiceEngine.updateQuestionPerformance(questionId, isCorrect);

      // Update concept progress for all target concepts
      for (const conceptId of question.targetConcepts) {
        await SRSCalculator.updateConceptProgress(
          conceptId,
          isCorrect,
          questionResponse.responseTime,
          userId
        );
      }

      console.log(
        `✅ Question ${questionId} completed: ${isCorrect ? "Correct" : "Incorrect"} after ${attemptNumber} attempts`
      );
    }

    // Get real-time due concept count for unlimited sessions
    let dueConcepts = 0;
    let totalDueConcepts = 0;
    let isDueQueueCleared = false;
    
    try {
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);
      
      dueConcepts = dueProgress.length;
      const overdueConcepts = overdueProgress.length;
      totalDueConcepts = dueConcepts + overdueConcepts;
      isDueQueueCleared = totalDueConcepts === 0;
      
      console.log(`📊 Due concepts after answer: ${totalDueConcepts} total (${dueConcepts} due, ${overdueConcepts} overdue)`);
    } catch (error) {
      console.error("❌ Error fetching due concept count:", error);
    }

    // Save session updates
    await session.save();

    const response = {
      success: true,
      data: {
        sessionId,
        questionId,
        attemptNumber,
        isCorrect,
        feedback,
        correctAnswer: attemptNumber >= 3 ? correctAnswer : undefined, // Only show correct answer after 3rd attempt
        isQuestionCompleted,
        attemptsRemaining: isQuestionCompleted ? 0 : 3 - attemptNumber,
        sessionProgress: {
          totalQuestions: session.sessionMetrics.totalQuestions,
          correctAnswers: session.sessionMetrics.correctAnswers,
          questionsCompleted: session.questionResponses.filter(
            (resp: IQuestionResponse) => resp.isCorrect || resp.attempts >= 3
          ).length,
        },
        // Real-time due concept tracking for unlimited sessions
        dueConceptsStatus: {
          totalDue: totalDueConcepts,
          dueConcepts,
          overdueConcepts: totalDueConcepts - dueConcepts,
          isDueQueueCleared,
          timestamp: new Date().toISOString(),
        },
        validationDetails: {
          method: validationMethod.method,
          reason: validationMethod.reason,
          confidenceLevel: validationResult.confidence || 0,
          mistakeType: shouldUseClientValidation(question.questionType)
            ? null
            : llmResult?.analysisDetails?.mistakeType || null,
          questionLevel: shouldUseClientValidation(question.questionType)
            ? question.difficulty
            : llmResult?.analysisDetails?.questionLevel || "A2",
          keywords: shouldUseClientValidation(question.questionType)
            ? []
            : llmResult?.keywords || [],
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error processing session answer:", error);

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
        error: "Failed to process answer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}