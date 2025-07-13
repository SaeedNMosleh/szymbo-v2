import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import QuestionDraft from "@/datamodels/questionDraft.model";
import { QuestionLLMService } from "@/lib/questionGeneration/questionLLM";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";

interface QuestionTypeQuantity {
  type: QuestionType;
  quantity: number;
}

interface GenerateRequest {
  conceptIds: string[];
  questionTypes: QuestionTypeQuantity[];
  difficulty: QuestionLevel;
  specialInstructions?: string;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: GenerateRequest = await request.json();
    const { conceptIds, questionTypes, difficulty, specialInstructions } = body;

    // Validation
    if (!conceptIds || conceptIds.length === 0) {
      return createErrorResponse("Concept IDs are required", 400);
    }

    if (!questionTypes || questionTypes.length === 0) {
      return createErrorResponse("Question types and quantities are required", 400);
    }

    const totalQuestions = questionTypes.reduce((sum, qt) => sum + qt.quantity, 0);
    if (totalQuestions === 0) {
      return createErrorResponse("At least one question must be requested", 400);
    }

    if (totalQuestions > 100) {
      return createErrorResponse("Maximum 100 questions per batch", 400);
    }

    // Fetch concepts
    const concepts = await Concept.find({ 
      id: { $in: conceptIds }, 
      isActive: true 
    });

    if (concepts.length === 0) {
      return createErrorResponse("No valid concepts found", 404);
    }

    // Generate batch ID
    const generationBatch = uuidv4();
    const questionLLM = new QuestionLLMService();
    const allGeneratedQuestions: any[] = [];

    // Generate questions for each type
    for (const { type, quantity } of questionTypes) {
      if (quantity > 0) {
        try {
          const questions = await questionLLM.generateQuestions({
            concepts,
            questionType: type,
            difficulty,
            quantity,
            specialInstructions,
          });

          // Convert to simplified draft format and save
          for (const question of questions) {
            const draftQuestion = {
              id: uuidv4(),
              ...question,
              source: "generated" as const,
            };

            allGeneratedQuestions.push(draftQuestion);
          }
        } catch (error) {
          console.error(`Error generating ${type} questions:`, error);
          
          // Log more details for debugging
          if (error instanceof Error) {
            console.error(`${type} generation failed: ${error.message}`);
          }
          
          // Continue with other types even if one fails
        }
      }
    }

    if (allGeneratedQuestions.length === 0) {
      return createErrorResponse("Failed to generate any questions", 500);
    }

    // Save all questions to database
    try {
      await QuestionDraft.insertMany(allGeneratedQuestions);
    } catch (error) {
      console.error("Error saving questions to database:", error);
      return createErrorResponse("Failed to save generated questions", 500);
    }

    // Return summary
    const summary = {
      totalGenerated: allGeneratedQuestions.length,
      generationBatch,
      breakdown: questionTypes.map(({ type, quantity }) => ({
        type,
        requested: quantity,
        generated: allGeneratedQuestions.filter(q => q.questionType === type).length,
      })),
      concepts: concepts.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
      })),
    };

    return createApiResponse({
      message: "Questions generated successfully",
      count: allGeneratedQuestions.length,
      batch: generationBatch,
      summary,
    });

  } catch (error) {
    console.error("Error in question generation:", error);
    return createErrorResponse("Internal server error", 500);
  }
}