import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/dbConnect";
import QuestionDraft from "@/datamodels/questionDraft.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all drafts (simplified - no complex filtering)
    const drafts = await QuestionDraft.find({})
      .sort({ createdDate: -1 })
      .limit(200); // Reasonable limit for staging area


    return createApiResponse({
      drafts,
      total: drafts.length,
    });

  } catch (error) {
    console.error("Error fetching question drafts:", error);
    return createErrorResponse("Failed to fetch question drafts", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      question,
      correctAnswer,
      questionType,
      targetConcepts,
      difficulty,
      options,
      audioUrl,
      imageUrl,
      source = "manual"
    } = body;

    // Validation
    if (!question || !correctAnswer || !questionType || !difficulty) {
      return createErrorResponse("Question, correct answer, type, and difficulty are required", 400);
    }

    if (!targetConcepts || targetConcepts.length === 0) {
      return createErrorResponse("At least one target concept is required", 400);
    }

    // Create draft question
    const draftQuestion = {
      id: uuidv4(),
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
      questionType,
      targetConcepts,
      difficulty,
      source,
      options: options || [],
      audioUrl: audioUrl || undefined,
      imageUrl: imageUrl || undefined,
    };

    const savedDraft = await QuestionDraft.create(draftQuestion);

    return createApiResponse({
      message: "Question draft created successfully",
      draft: savedDraft,
    });

  } catch (error) {
    console.error("Error creating question draft:", error);
    return createErrorResponse("Failed to create question draft", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return createErrorResponse("Draft ID is required", 400);
    }

    // Find and update the draft (simplified - just edit content)
    const updatedDraft = await QuestionDraft.findOneAndUpdate(
      { id },
      updates,
      { new: true }
    );

    if (!updatedDraft) {
      return createErrorResponse("Draft not found", 404);
    }

    return createApiResponse({
      message: "Draft updated successfully",
      draft: updatedDraft,
    });

  } catch (error) {
    console.error("Error updating question draft:", error);
    return createErrorResponse("Failed to update question draft", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let deleteQuery: Record<string, unknown> = {};
    
    if (id) {
      deleteQuery.id = id;
    } else {
      // If no ID provided, delete all drafts (for "New Session" functionality)
      deleteQuery = {};
    }

    const result = await QuestionDraft.deleteMany(deleteQuery);

    return createApiResponse({
      message: `${result.deletedCount} draft(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error("Error deleting question draft:", error);
    return createErrorResponse("Failed to delete question draft", 500);
  }
}