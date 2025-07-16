import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import QuestionDraft from "@/datamodels/questionDraft.model";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse("Draft IDs array is required", 400);
    }

    // Delete selected drafts
    const deleteResult = await QuestionDraft.deleteMany({
      id: { $in: ids }
    });

    return createApiResponse({
      message: `${deleteResult.deletedCount} draft(s) deleted successfully`,
      deletedCount: deleteResult.deletedCount,
    });

  } catch (error) {
    console.error("Error deleting question drafts:", error);
    return createErrorResponse("Failed to delete question drafts", 500);
  }
}