import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import QuestionDraft from "@/datamodels/questionDraft.model";
import Concept from "@/datamodels/concept.model";
import { QuestionLLMService } from "@/lib/questionGeneration/questionLLM";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { QuestionType, QuestionLevel } from "@/lib/enum";

interface RegenerateRequest {
  draftId: string;
  conceptIds: string[];
  questionType: QuestionType;
  difficulty: QuestionLevel;
  specialInstructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: RegenerateRequest = await request.json();
    const { draftId, conceptIds, questionType, difficulty, specialInstructions } = body;

    // Validation
    if (!draftId) {
      return createErrorResponse("Draft ID is required", 400);
    }

    if (!conceptIds || conceptIds.length === 0) {
      return createErrorResponse("Concept IDs are required", 400);
    }

    // Find the original draft
    const originalDraft = await QuestionDraft.findOne({ id: draftId });
    if (!originalDraft) {
      return createErrorResponse("Draft not found", 404);
    }

    // Fetch concepts - handle both concept IDs and names properly
    console.log("Looking for concepts with IDs/names:", conceptIds); // Debug log
    
    const conceptMap = new Map();
    const allFoundConcepts: any[] = [];
    
    // First try to find by ID
    const conceptsByIds = await Concept.find({ 
      id: { $in: conceptIds }, 
      isActive: true 
    });
    
    conceptsByIds.forEach(concept => {
      conceptMap.set(concept.id, concept);
      allFoundConcepts.push(concept);
    });
    
    // For remaining items, try to find by name
    const remainingItems = conceptIds.filter(item => !conceptMap.has(item));
    console.log("Remaining items to search by name:", remainingItems); // Debug log
    
    if (remainingItems.length > 0) {
      const conceptsByNames = await Concept.find({ 
        name: { $in: remainingItems }, 
        isActive: true 
      });
      
      conceptsByNames.forEach(concept => {
        if (!conceptMap.has(concept.id)) { // Avoid duplicates
          conceptMap.set(concept.name, concept);
          allFoundConcepts.push(concept);
        }
      });
    }
    
    console.log("Total concepts found:", allFoundConcepts.length); // Debug log
    console.log("Concept details:", allFoundConcepts.map(c => ({id: c.id, name: c.name}))); // Debug log
    
    const concepts = allFoundConcepts;

    if (concepts.length === 0) {
      return createErrorResponse("No valid concepts found", 404);
    }

    // Generate new question using LLM service
    const questionLLM = new QuestionLLMService();
    
    try {
      const newQuestion = await questionLLM.regenerateQuestion(
        originalDraft,
        concepts,
        specialInstructions
      );

      // Update the draft with new question data
      const updatedDraft = await QuestionDraft.findOneAndUpdate(
        { id: draftId },
        {
          question: newQuestion.question,
          correctAnswer: newQuestion.correctAnswer,
          options: newQuestion.options,
          audioUrl: newQuestion.audioUrl,
          imageUrl: newQuestion.imageUrl,
          lastModified: new Date(),
          generationAttempt: (originalDraft.generationAttempt || 1) + 1,
          specialInstructions: specialInstructions || originalDraft.specialInstructions,
        },
        { new: true }
      );

      if (!updatedDraft) {
        return createErrorResponse("Failed to update draft", 500);
      }

      return createApiResponse({
        message: "Question regenerated successfully",
        question: updatedDraft,
        attempt: updatedDraft.generationAttempt,
      });

    } catch (error) {
      console.error("Error regenerating question with LLM:", error);
      return createErrorResponse("Failed to generate new question content", 500);
    }

  } catch (error) {
    console.error("Error in question regeneration:", error);
    return createErrorResponse("Internal server error", 500);
  }
}