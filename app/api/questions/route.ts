// app/api/questions/route.ts - ENHANCED VERSION WITH FIXED QUESTION BANK PERSISTENCE
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { PracticeMode, QuestionType, QuestionLevel } from "@/lib/enum";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Enhanced Question Bank Service for robust database operations
class QuestionBankService {
  /**
   * Save question to bank with retry logic and validation
   */
  static async saveQuestion(
    questionData: Partial<IQuestionBank>
  ): Promise<IQuestionBank | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `💾 Saving question attempt ${attempt}:`,
          questionData.question?.substring(0, 50)
        );

        // Ensure all required fields are present
        const completeQuestionData: IQuestionBank = {
          id: questionData.id || uuidv4(),
          question: questionData.question || "",
          correctAnswer: questionData.correctAnswer || "",
          questionType: questionData.questionType || QuestionType.Q_A,
          targetConcepts: questionData.targetConcepts || [],
          difficulty: questionData.difficulty || QuestionLevel.A1,
          timesUsed: questionData.timesUsed || 0,
          successRate: questionData.successRate || 0,
          lastUsed: questionData.lastUsed || new Date(),
          createdDate: questionData.createdDate || new Date(),
          isActive:
            questionData.isActive !== undefined ? questionData.isActive : true,
          source: questionData.source || "generated",
        };

        // Validate required fields
        if (!completeQuestionData.question.trim()) {
          throw new Error("Question text is required");
        }
        if (!completeQuestionData.targetConcepts.length) {
          throw new Error("At least one target concept is required");
        }

        const savedQuestion = await QuestionBank.create(completeQuestionData);
        console.log(`✅ Question saved successfully: ${savedQuestion.id}`);
        return savedQuestion.toObject();
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Save attempt ${attempt} failed:`, error);

        // Handle duplicate key errors
        if (error instanceof Error && error.message.includes("duplicate key")) {
          console.log(
            `Question ${questionData.id} already exists, fetching existing...`
          );
          try {
            const existing = await QuestionBank.findOne({
              id: questionData.id,
            });
            return existing ? existing.toObject() : null;
          } catch (fetchError) {
            console.error("Failed to fetch existing question:", fetchError);
          }
        }

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(
      `❌ Failed to save question after ${maxRetries} attempts:`,
      lastError?.message
    );
    return null;
  }

  /**
   * Update question with correct answer
   */
  static async updateQuestionAnswer(
    questionId: string,
    correctAnswer: string
  ): Promise<boolean> {
    try {
      if (!correctAnswer.trim()) {
        console.warn(
          `Empty correct answer provided for question ${questionId}`
        );
        return false;
      }

      const result = await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            correctAnswer: correctAnswer.trim(),
            lastUsed: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Question ${questionId} updated with correct answer`);
        return true;
      } else {
        console.warn(`⚠️ Question ${questionId} not found for answer update`);
        return false;
      }
    } catch (error) {
      console.error(
        `❌ Failed to update question ${questionId} answer:`,
        error
      );
      return false;
    }
  }

  /**
   * Update question performance metrics
   */
  static async updateQuestionPerformance(
    questionId: string,
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(
          `⚠️ Question ${questionId} not found for performance update`
        );
        return false;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newTimesUsed > 0 ? newCorrect / newTimesUsed : 0;

      const result = await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ Question ${questionId} performance updated: ${(newSuccessRate * 100).toFixed(1)}% success rate (${newTimesUsed} uses)`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `❌ Failed to update question performance ${questionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if question exists in bank
   */
  static async questionExists(questionId: string): Promise<boolean> {
    try {
      const count = await QuestionBank.countDocuments({
        id: questionId,
        isActive: true,
      });
      return count > 0;
    } catch (error) {
      console.error(
        `❌ Error checking question existence ${questionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get question statistics
   */
  static async getQuestionStats(): Promise<{
    totalQuestions: number;
    questionsWithAnswers: number;
    averageSuccessRate: number;
    answerPercentage: number;
  }> {
    try {
      const stats = await QuestionBank.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: 1 },
            questionsWithAnswers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$correctAnswer", ""] },
                      {
                        $ne: [
                          "$correctAnswer",
                          "To be determined during practice",
                        ],
                      },
                      { $ne: ["$correctAnswer", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            questionsUsed: {
              $sum: { $cond: [{ $gt: ["$timesUsed", 0] }, 1, 0] },
            },
            avgSuccessRate: { $avg: "$successRate" },
            generatedQuestions: {
              $sum: { $cond: [{ $eq: ["$source", "generated"] }, 1, 0] },
            },
            manualQuestions: {
              $sum: { $cond: [{ $eq: ["$source", "manual"] }, 1, 0] },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          totalQuestions: 0,
          questionsWithAnswers: 0,
          questionsUsed: 0,
          avgSuccessRate: 0,
          generatedQuestions: 0,
          manualQuestions: 0,
        }
      );
    } catch (error) {
      console.error("Error getting question stats:", error);
      return {
        totalQuestions: 0,
        questionsWithAnswers: 0,
        averageSuccessRate: 0,
        answerPercentage: 0,
      };
    }
  }
}

// Validation schemas
const questionQuerySchema = z.object({
  conceptIds: z.string().optional(),
  mode: z
    .enum([PracticeMode.NORMAL, PracticeMode.PREVIOUS, PracticeMode.DRILL])
    .optional(),
  limit: z.string().optional(),
  difficulty: z.string().optional(),
  questionType: z.string().optional(),
  questionId: z.string().optional(), // For single question lookup
  stats: z.string().optional(), // For getting statistics
});

const createQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  questionType: z.enum(
    Object.values(QuestionType) as [QuestionType, ...QuestionType[]]
  ),
  targetConcepts: z
    .array(z.string())
    .min(1, "At least one target concept is required"),
  difficulty: z.enum(
    Object.values(QuestionLevel) as [QuestionLevel, ...QuestionLevel[]]
  ),
  source: z.enum(["generated", "manual"]).default("manual"),
});

const updateQuestionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  correctAnswer: z.string().optional(),
  timesUsed: z.number().min(0).optional(),
  successRate: z.number().min(0).max(1).optional(),
  lastUsed: z.string().optional(),
  isCorrect: z.boolean().optional(),
  performanceOnly: z.boolean().optional(), // Flag to only update performance
});

// GET /api/questions - Fetch questions by various criteria
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const {
      conceptIds,
      mode,
      limit,
      difficulty,
      questionType,
      questionId,
      stats,
    } = questionQuerySchema.parse(queryParams);

    // Handle statistics request
    if (stats === "true") {
      const statistics = await QuestionBankService.getQuestionStats();
      return NextResponse.json(
        {
          success: true,
          data: statistics,
        },
        { status: 200 }
      );
    }

    // Handle single question lookup
    if (questionId) {
      const question = await QuestionBank.findOne({
        id: questionId,
        isActive: true,
      });
      if (!question) {
        return NextResponse.json(
          {
            success: false,
            error: "Question not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id: question.id,
            question: question.question,
            correctAnswer: question.correctAnswer,
            questionType: question.questionType,
            targetConcepts: question.targetConcepts,
            difficulty: question.difficulty,
            timesUsed: question.timesUsed,
            successRate: question.successRate,
            lastUsed: question.lastUsed,
            source: question.source,
          },
        },
        { status: 200 }
      );
    }

    // Build query for multiple questions
    interface QuestionQuery {
      isActive: boolean;
      targetConcepts?: { $in: string[] };
      questionType?: string;
      difficulty?: string;
      timesUsed?: { $gt: number };
      successRate?: { $lt: number };
    }

    const query: QuestionQuery = { isActive: true };

    if (conceptIds) {
      const conceptIdArray = conceptIds.split(",").filter((id) => id.trim());
      if (conceptIdArray.length > 0) {
        query.targetConcepts = { $in: conceptIdArray };
      }
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (questionType) {
      query.questionType = questionType;
    }

    // Mode-specific filters
    if (mode === PracticeMode.PREVIOUS) {
      query.timesUsed = { $gt: 0 }; // Only previously used questions
    } else if (mode === PracticeMode.DRILL) {
      query.successRate = { $lt: 0.6 }; // Low success rate questions
      query.timesUsed = { $gt: 2 }; // Must have been tried multiple times
    }

    // Build sort criteria
    let sortCriteria = {};
    if (mode === PracticeMode.PREVIOUS) {
      sortCriteria = { lastUsed: -1 }; // Most recently used first
    } else if (mode === PracticeMode.DRILL) {
      sortCriteria = { successRate: 1, timesUsed: -1 }; // Worst performing first
    } else {
      sortCriteria = { timesUsed: 1, successRate: -1, createdDate: -1 }; // Prefer less used, higher success, newer
    }

    // Execute query
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 20;
    const questions = await QuestionBank.find(query)
      .sort(sortCriteria)
      .limit(limitNum);

    // Format response
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      questionType: q.questionType,
      targetConcepts: q.targetConcepts,
      difficulty: q.difficulty,
      timesUsed: q.timesUsed,
      successRate: q.successRate,
      lastUsed: q.lastUsed,
      source: q.source,
      createdDate: q.createdDate,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          questions: formattedQuestions,
          total: formattedQuestions.length,
          query: {
            conceptIds: conceptIds || null,
            mode: mode || null,
            filters: { difficulty, questionType },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/questions - Save new question (manual or generated)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    console.log("📝 Creating new question:", body.question?.substring(0, 50));
    const validatedData = createQuestionSchema.parse(body);

    // Use the enhanced service to save
    const savedQuestion = await QuestionBankService.saveQuestion({
      ...validatedData,
      id: uuidv4(), // Generate new ID for manual questions
    });

    if (!savedQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save question to database after multiple attempts",
        },
        { status: 500 }
      );
    }

    console.log("✅ Question created successfully:", savedQuestion.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedQuestion.id,
          question: savedQuestion.question,
          questionType: savedQuestion.questionType,
          targetConcepts: savedQuestion.targetConcepts,
          difficulty: savedQuestion.difficulty,
          source: savedQuestion.source,
          createdDate: savedQuestion.createdDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid question data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error creating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/questions - Update question (answer, performance, or both)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    console.log("🔄 Updating question:", body.id);
    const {
      id,
      correctAnswer,
      timesUsed,
      successRate,
      lastUsed,
      isCorrect,
      performanceOnly,
    } = updateQuestionSchema.parse(body);

    // Check if question exists
    const questionExists = await QuestionBankService.questionExists(id);
    if (!questionExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    let updateSuccess = false;
    const operations: string[] = [];

    // Update correct answer if provided and not performance-only update
    if (correctAnswer !== undefined && !performanceOnly) {
      const answerUpdateSuccess =
        await QuestionBankService.updateQuestionAnswer(id, correctAnswer);
      if (answerUpdateSuccess) {
        updateSuccess = true;
        operations.push("answer");
      }
    }

    // Handle performance updates
    if (isCorrect !== undefined) {
      // New way: update performance using isCorrect flag
      const perfUpdateSuccess =
        await QuestionBankService.updateQuestionPerformance(id, isCorrect);
      if (perfUpdateSuccess) {
        updateSuccess = true;
        operations.push("performance");
      }
    } else if (
      timesUsed !== undefined ||
      successRate !== undefined ||
      lastUsed !== undefined
    ) {
      // Legacy way: direct field updates
      try {
        interface UpdateFields {
          timesUsed?: number;
          successRate?: number;
          lastUsed?: Date;
        }

        const updateFields: UpdateFields = {};
        if (timesUsed !== undefined) updateFields.timesUsed = timesUsed;
        if (successRate !== undefined) updateFields.successRate = successRate;
        if (lastUsed !== undefined) updateFields.lastUsed = new Date(lastUsed);

        const result = await QuestionBank.updateOne(
          { id },
          { $set: updateFields }
        );

        if (result.modifiedCount > 0) {
          updateSuccess = true;
          operations.push("legacy-performance");
          console.log(`✅ Legacy performance update for question ${id}`);
        }
      } catch (error) {
        console.error(
          `❌ Legacy performance update failed for question ${id}:`,
          error
        );
      }
    }

    if (!updateSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "No updates were applied to the question",
        },
        { status: 400 }
      );
    }

    // Fetch updated question data
    const updatedQuestion = await QuestionBank.findOne({ id });
    if (!updatedQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found after update",
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ Question ${id} updated successfully. Operations: ${operations.join(", ")}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedQuestion.id,
          timesUsed: updatedQuestion.timesUsed,
          successRate: updatedQuestion.successRate,
          lastUsed: updatedQuestion.lastUsed,
          correctAnswer: updatedQuestion.correctAnswer,
          operations,
        },
        message: `Question updated: ${operations.join(", ")}`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error updating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/questions - Soft delete question (set isActive to false)
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Question ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🗑️ Soft deleting question:", id);

    const result = await QuestionBank.updateOne(
      { id },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Question was already inactive",
        },
        { status: 400 }
      );
    }

    console.log(`✅ Question ${id} soft deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Question deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
