import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import QuestionBank from "@/datamodels/questionBank.model";
import { QuestionType, ConceptCategory } from "@/lib/enum";
import { createApiResponse, createErrorResponse } from "@/lib/utils/apiResponse";

interface CoverageData {
  conceptId: string;
  conceptName: string;
  category: ConceptCategory;
  difficulty: string;
  coverage: Record<QuestionType, number>;
  totalQuestions: number;
}

interface CoverageStats {
  totalConcepts: number;
  totalQuestions: number;
  wellCovered: number; // concepts with 5+ questions across types
  needsAttention: number; // concepts with <3 questions total
  coverageByType: Record<QuestionType, number>;
  coverageByCategory: Record<ConceptCategory, number>;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Fetch all active concepts
    const concepts = await Concept.find({ isActive: true }).sort({ name: 1 });
    
    // Fetch all active questions
    const questions = await QuestionBank.find({ isActive: true });
    
    // Build coverage matrix
    const coverageMap = new Map<string, Record<QuestionType, number>>();
    const categoryStats = new Map<ConceptCategory, number>();
    const typeStats = new Map<QuestionType, number>();
    
    // Initialize coverage for all concepts
    concepts.forEach(concept => {
      const coverage: Record<QuestionType, number> = {} as Record<QuestionType, number>;
      Object.values(QuestionType).forEach(type => {
        coverage[type] = 0;
      });
      coverageMap.set(concept.id, coverage);
    });
    
    // Count questions for each concept and type
    questions.forEach(question => {
      question.targetConcepts.forEach((conceptId: string) => {
        const coverage = coverageMap.get(conceptId);
        if (coverage && question.questionType in QuestionType) {
          const questionType = question.questionType as QuestionType;
          coverage[questionType] = (coverage[questionType] || 0) + 1;
        }
      });
      
      // Update type statistics
      typeStats.set(
        question.questionType, 
        (typeStats.get(question.questionType) || 0) + 1
      );
    });
    
    // Build coverage data array
    const coverageData: CoverageData[] = concepts.map(concept => {
      const coverage = coverageMap.get(concept.id) || {} as Record<QuestionType, number>;
      const totalQuestions = Object.values(coverage).reduce((sum, count) => sum + count, 0);
      
      // Update category statistics
      categoryStats.set(
        concept.category,
        (categoryStats.get(concept.category) || 0) + totalQuestions
      );
      
      return {
        conceptId: concept.id,
        conceptName: concept.name,
        category: concept.category,
        difficulty: concept.difficulty,
        coverage,
        totalQuestions,
      };
    });
    
    // Calculate statistics
    const wellCovered = coverageData.filter(c => c.totalQuestions >= 5).length;
    const needsAttention = coverageData.filter(c => c.totalQuestions < 3).length;
    
    const stats: CoverageStats = {
      totalConcepts: concepts.length,
      totalQuestions: questions.length,
      wellCovered,
      needsAttention,
      coverageByType: Object.fromEntries(typeStats) as Record<QuestionType, number>,
      coverageByCategory: Object.fromEntries(categoryStats) as Record<ConceptCategory, number>,
    };
    
    // Fill missing types and categories with 0
    Object.values(QuestionType).forEach(type => {
      if (!(type in stats.coverageByType)) {
        stats.coverageByType[type] = 0;
      }
    });
    
    Object.values(ConceptCategory).forEach(category => {
      if (!(category in stats.coverageByCategory)) {
        stats.coverageByCategory[category] = 0;
      }
    });
    
    return createApiResponse({
      coverage: coverageData,
      stats,
    });

  } catch (error) {
    console.error("Error fetching coverage data:", error);
    return createErrorResponse("Failed to fetch coverage data", 500);
  }
}