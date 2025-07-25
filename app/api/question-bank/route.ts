import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import QuestionBank from "@/datamodels/questionBank.model";
import Concept from "@/datamodels/concept.model";
import { QuestionLevel } from "@/lib/enum";
import { z } from "zod";

// Define interface for MongoDB query conditions
interface MongoQueryCondition {
  [key: string]:
    | string
    | number
    | boolean
    | { $regex: RegExp }
    | { $gte: number }
    | { $lte: number }
    | { $in: string[] };
}

const questionBankQuerySchema = z.object({
  search: z.string().optional(),
  conceptIds: z.string().optional(),
  questionType: z.string().optional(),
  difficulty: z.string().optional(),
  isActive: z.string().optional(),
  successRateMin: z.string().optional(),
  successRateMax: z.string().optional(),
  usageMin: z.string().optional(),
  usageMax: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const updateQuestionBankSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).optional(),
  correctAnswer: z.string().min(1).optional(),
  options: z.array(z.string()).optional(),
  targetConcepts: z.array(z.string()).optional(),
  difficulty: z
    .enum(Object.values(QuestionLevel) as [QuestionLevel, ...QuestionLevel[]])
    .optional(),
});

const deleteQuestionSchema = z.object({
  id: z.string().min(1),
  permanent: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const {
      search,
      conceptIds,
      questionType,
      difficulty,
      isActive,
      successRateMin,
      successRateMax,
      usageMin,
      usageMax,
      page,
      limit,
    } = questionBankQuerySchema.parse(queryParams);

    interface QuestionQuery {
      $and?: Array<MongoQueryCondition>;
      question?: { $regex: string; $options: string };
      targetConcepts?: { $in: string[] };
      questionType?: string;
      difficulty?: string;
      isActive?: boolean;
      successRate?: { $gte?: number; $lte?: number };
      timesUsed?: { $gte?: number; $lte?: number };
    }

    const query: QuestionQuery = {};
    const andConditions: Array<MongoQueryCondition> = [];

    if (search && search.trim()) {
      query.question = { $regex: search.trim(), $options: "i" };
    }

    if (conceptIds) {
      const conceptIdArray = conceptIds.split(",").filter((id) => id.trim());
      if (conceptIdArray.length > 0) {
        query.targetConcepts = { $in: conceptIdArray };
      }
    }

    if (questionType) {
      query.questionType = questionType;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (successRateMin !== undefined || successRateMax !== undefined) {
      query.successRate = {};
      if (successRateMin !== undefined) {
        query.successRate.$gte = parseFloat(successRateMin);
      }
      if (successRateMax !== undefined) {
        query.successRate.$lte = parseFloat(successRateMax);
      }
    }

    if (usageMin !== undefined || usageMax !== undefined) {
      query.timesUsed = {};
      if (usageMin !== undefined) {
        query.timesUsed.$gte = parseInt(usageMin);
      }
      if (usageMax !== undefined) {
        query.timesUsed.$lte = parseInt(usageMax);
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = page ? Math.max(1, parseInt(page)) : 1;
    const limitNum =
      limit === "all"
        ? 0
        : Math.min(100, Math.max(10, parseInt(limit || "20")));
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const [questions, totalCount] = await Promise.all([
      QuestionBank.find(query)
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      QuestionBank.countDocuments(query),
    ]);

    // Extract unique concept IDs from all questions (using camelCase naming)
    const conceptIdsUnique = [
      ...new Set(questions.flatMap((q) => q.targetConcepts)),
    ];
    const concepts = await Concept.find(
      { id: { $in: conceptIdsUnique } },
      { id: 1, name: 1 }
    ).lean();
    const conceptMap = concepts.reduce(
      (acc, concept) => {
        acc[concept.id] = concept.name;
        return acc;
      },
      {} as Record<string, string>
    );

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      questionType: q.questionType,
      targetConcepts: q.targetConcepts,
      // Map concept IDs to names for display
      conceptNames: q.targetConcepts.map((id: string) => conceptMap[id] || id),
      difficulty: q.difficulty,
      timesUsed: q.timesUsed,
      successRate: q.successRate,
      lastUsed: q.lastUsed,
      createdDate: q.createdDate,
      isActive: q.isActive,
      source: q.source,
      options: q.options || [],
      audioUrl: q.audioUrl,
      imageUrl: q.imageUrl,
    }));

    return NextResponse.json({
      success: true,
      data: {
        questions: formattedQuestions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
        },
        filters: {
          search,
          conceptIds,
          questionType,
          difficulty,
          isActive,
          successRateRange: { min: successRateMin, max: successRateMax },
          usageRange: { min: usageMin, max: usageMax },
        },
      },
    });
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

    console.error("Error fetching question bank:", error);
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

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const validatedData = updateQuestionBankSchema.parse(body);
    const { id, ...updateFields } = validatedData;

    const question = await QuestionBank.findOne({ id });
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    if (updateFields.targetConcepts) {
      const concepts = await Concept.find({
        id: { $in: updateFields.targetConcepts },
        isActive: true,
      });

      if (concepts.length !== updateFields.targetConcepts.length) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more target concepts not found",
          },
          { status: 400 }
        );
      }
    }

    const result = await QuestionBank.updateOne({ id }, { $set: updateFields });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No changes were made to the question",
        },
        { status: 400 }
      );
    }

    const updatedQuestion = await QuestionBank.findOne({ id }).lean();

    return NextResponse.json({
      success: true,
      data: updatedQuestion,
      message: "Question updated successfully",
    });
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

    console.error("Error updating question:", error);
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

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { id, permanent } = deleteQuestionSchema.parse(body);

    const question = await QuestionBank.findOne({ id });
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    if (permanent) {
      await QuestionBank.deleteOne({ id });
      return NextResponse.json({
        success: true,
        message: "Question permanently deleted",
      });
    } else {
      // Toggle the isActive status
      const newActiveStatus = !question.isActive;
      await QuestionBank.updateOne(
        { id },
        { $set: { isActive: newActiveStatus } }
      );
      return NextResponse.json({
        success: true,
        message: newActiveStatus
          ? "Question reactivated"
          : "Question deactivated",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid delete data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error deleting question:", error);
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
