import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/dbConnect";
import QuestionDraft from "@/datamodels/questionDraft.model";
import QuestionBank from "@/datamodels/questionBank.model";
import Concept from "@/datamodels/concept.model";
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

    // Convert concept names to IDs for consistency
    const allConceptNames = [...new Set(drafts.flatMap(draft => draft.targetConcepts))];
    console.log("Converting concept names to IDs:", allConceptNames); // Debug log
    
    const conceptMap = new Map<string, string>();
    if (allConceptNames.length > 0) {
      // First try to find by ID (in case some are already IDs)
      const conceptsByIds = await Concept.find({ 
        id: { $in: allConceptNames }, 
        isActive: true 
      });
      conceptsByIds.forEach(concept => conceptMap.set(concept.id, concept.id));
      
      // Then find by name for the remaining ones
      const remainingNames = allConceptNames.filter(name => !conceptMap.has(name));
      if (remainingNames.length > 0) {
        const conceptsByNames = await Concept.find({ 
          name: { $in: remainingNames }, 
          isActive: true 
        });
        conceptsByNames.forEach(concept => conceptMap.set(concept.name, concept.id));
      }
    }
    
    console.log("Concept mapping:", Object.fromEntries(conceptMap)); // Debug log

    // Convert each draft to question bank format and save
    for (const draft of drafts) {
      try {
        // Convert concept names/IDs to proper concept IDs (STRICT: Must resolve to valid IDs)
        const targetConceptIds = draft.targetConcepts
          .map((concept: any) => conceptMap.get(concept))
          .filter((id: any) => id !== undefined) as string[];
        
        if (targetConceptIds.length === 0) {
          console.warn(`Draft ${draft.id} has no valid target concepts - rejecting question`);
          errors.push({
            questionId: draft.id,
            error: "No valid concept IDs found - all concepts must exist in database"
          });
          continue;
        }
        
        // STRICT VALIDATION: All target concepts must be valid concept IDs
        console.log(`Draft ${draft.id} validated with concept IDs:`, targetConceptIds);

        const questionBankData = {
          id: uuidv4(),
          question: draft.question,
          correctAnswer: draft.correctAnswer,
          questionType: draft.questionType,
          targetConcepts: targetConceptIds, // Now using proper concept IDs
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

        console.log(`Saving question ${draft.id} with concept IDs:`, targetConceptIds); // Debug log
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