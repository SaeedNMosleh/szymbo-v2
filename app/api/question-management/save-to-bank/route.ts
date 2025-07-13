import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/dbConnect";
import QuestionDraft from "@/datamodels/questionDraft.model";
import QuestionBank from "@/datamodels/questionBank.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return createErrorResponse("Question IDs are required", 400);
    }

    // Find the draft questions
    const drafts = await QuestionDraft.find({ id: { $in: questionIds } });

    if (drafts.length === 0) {
      return createErrorResponse("No draft questions found", 404);
    }

    const savedQuestions = [];
    const errors = [];

    // Convert each draft to question bank format and save
    for (const draft of drafts) {
      try {
        const questionBankData = {
          id: uuidv4(),
          question: draft.question,
          correctAnswer: draft.correctAnswer,
          questionType: draft.questionType,
          targetConcepts: draft.targetConcepts, // Keep as concept names for now
          difficulty: draft.difficulty,
          timesUsed: 0,
          successRate: 0,
          lastUsed: null,
          isActive: true,
          source: draft.source,
          options: draft.options || [],
          audioUrl: draft.audioUrl,
          imageUrl: draft.imageUrl,
        };

        await QuestionBank.create(questionBankData);
        savedQuestions.push(draft.id);
      } catch (error) {
        console.error(`Error saving question ${draft.id}:`, error);
        errors.push({
          questionId: draft.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Remove successfully saved drafts
    if (savedQuestions.length > 0) {
      await QuestionDraft.deleteMany({ id: { $in: savedQuestions } });
    }

    return createApiResponse({
      message: `Successfully saved ${savedQuestions.length} questions to question bank`,
      savedCount: savedQuestions.length,
      savedQuestions,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Error saving questions to bank:", error);
    return createErrorResponse("Failed to save questions to bank", 500);
  }
}