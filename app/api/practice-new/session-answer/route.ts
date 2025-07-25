// app/api/practice-new/session-answer/route.ts - Handle question attempts in practice sessions
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { validateAnswer } from "@/lib/LLMPracticeValidation/validateAnswer";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import ConceptPracticeSession, {
  IQuestionResponse,
} from "@/datamodels/conceptPracticeSession.model";
import QuestionBank from "@/datamodels/questionBank.model";
import Course from "@/datamodels/course.model";
import { z } from "zod";

const sessionAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  userAnswer: z.string().min(1),
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

    // Get the practice session
    const session = await ConceptPracticeSession.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Practice session not found or inactive",
        },
        { status: 404 }
      );
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

    // Get course information for validation context
    const course = await Course.findOne({ courseId: 1 }); // Default course for now

    // Validate the answer using LLM
    const validationResult = await validateAnswer(
      question.question,
      userAnswer,
      course || {
        courseId: 1,
        courseName: "Default Polish Course",
        courseDescription: "Polish language learning course",
        courseType: "new",
        coursePeriod: "semester",
        isActive: true,
      },
      attemptNumber
    );

    const isCorrect = validationResult.isCorrect ?? false;
    const feedback = validationResult.feedback ?? "No feedback available";
    const correctAnswer =
      validationResult.correctAnswer ?? question.correctAnswer;

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
      questionResponse.userAnswer = userAnswer;
      questionResponse.timestamp = new Date();
    } else {
      // Create new response
      questionResponse = {
        questionId,
        attempts: attemptNumber,
        isCorrect,
        responseTime,
        userAnswer,
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
        validationDetails: {
          confidenceLevel: validationResult.analysisDetails?.confidence || 0,
          mistakeType: validationResult.analysisDetails?.mistakeType || null,
          questionLevel:
            validationResult.analysisDetails?.questionLevel || "A2",
          keywords: validationResult.keywords || [],
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
