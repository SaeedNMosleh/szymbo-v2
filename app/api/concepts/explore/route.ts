import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManagerEnhanced } from "@/lib/conceptExtraction/conceptManagerEnhanced";
import { ConceptLLMService } from "@/lib/conceptExtraction/conceptLLM";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { IConceptIndex } from "@/datamodels/conceptIndex.model";
import { z } from "zod";

// Type definitions for the exploration API
interface RelatedConcept {
  id: string;
  name: string;
  similarity: number;
  reasoning: string;
  category: ConceptCategory;
  difficulty: string;
}

interface ExplorationResult {
  query: string;
  mode: string;
  relatedConcepts?: RelatedConcept[];
  suggestedTags?: string[];
  categoryAnalysis?: string;
  difficultyAnalysis?: string;
  [key: string]: unknown;
}

interface RecommendationItem {
  conceptId?: string;
  name: string;
  priority: number;
  reasoning: string;
  category: ConceptCategory;
  id?: string | null;
  matched?: boolean;
  difficulty?: string;
}

interface LearningPathStep {
  step: number;
  concept: string;
  reasoning: string;
  difficulty: string;
}

// Request validation schema for LLM exploration
const exploreConceptsSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters"),
  mode: z.enum(['similarity', 'recommendations', 'analysis']).default('similarity'),
  conceptId: z.string().optional(), // For concept-specific exploration
  includeAnalysis: z.boolean().default(true),
  maxResults: z.number().min(1).max(50).default(10),
});

// POST /api/concepts/explore - LLM-powered concept exploration
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = exploreConceptsSchema.parse(body);

    const conceptManager = new ConceptManagerEnhanced();
    const llmService = new ConceptLLMService();

    let result: ExplorationResult = {
      query: validatedData.query,
      mode: validatedData.mode,
      relatedConcepts: [],
      suggestedTags: [],
      categoryAnalysis: '',
      difficultyAnalysis: '',
    };

    // Get all concepts for analysis
    const allConcepts = await conceptManager.getActiveConcepts(1, 1000);
    const conceptIndex = await conceptManager.getConceptIndex();

    switch (validatedData.mode) {
      case 'similarity':
        result = await handleSimilarityExploration(
          llmService,
          conceptIndex,
          validatedData.query,
          validatedData.maxResults
        );
        break;

      case 'recommendations':
        result = await handleRecommendationExploration(
          llmService,
          conceptIndex,
          validatedData.query,
          validatedData.maxResults
        );
        break;

      case 'analysis':
        result = await handleAnalysisExploration(
          llmService,
          allConcepts,
          validatedData.query
        );
        break;

      default:
        throw new Error(`Unsupported exploration mode: ${validatedData.mode}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error in concept exploration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to explore concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle similarity-based exploration
async function handleSimilarityExploration(
  llmService: ConceptLLMService,
  conceptIndex: IConceptIndex[],
  query: string,
  maxResults: number
) {
  try {
    // Create a temporary concept from the query
    const queryAsConcept = {
      name: query,
      description: query,
      category: ConceptCategory.VOCABULARY,
      examples: [],
      sourceContent: 'User query',
      confidence: 0.8,
      suggestedDifficulty: QuestionLevel.B1,
      suggestedTags: [],
    };

    // Use LLM to find similar concepts
    const similarityMatches = await llmService.checkConceptSimilarity(
      queryAsConcept,
      conceptIndex
    );

    // Filter and sort by similarity
    const relatedConcepts = similarityMatches
      .filter(match => match.similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
      .map(match => ({
        id: match.conceptId,
        name: match.name,
        similarity: match.similarity,
        reasoning: 'Semantic similarity based on content analysis',
        category: match.category,
        difficulty: 'B1',
      }));

    // Generate analysis using LLM
    const analysisPrompt = `
      Analyze this search query for Polish language learning concepts: "${query}"
      
      Based on the query, provide:
      1. What category this likely belongs to (grammar or vocabulary)
      2. Recommended difficulty level (A1-C2)
      3. 3-5 relevant tags that would be useful
      4. Brief explanation of why these concepts are related
      
      Return as JSON with: categoryAnalysis, difficultyAnalysis, suggestedTags (array), explanation
    `;

    const analysisResponse = await llmService.analyzeText(analysisPrompt);
    let analysis;
    
    try {
      analysis = JSON.parse(analysisResponse);
    } catch {
      // Fallback if JSON parsing fails
      analysis = {
        categoryAnalysis: query.includes('verb') || query.includes('tense') ? 'This query relates to grammar concepts.' : 'This query relates to vocabulary concepts.',
        difficultyAnalysis: 'Recommended difficulty level: A1-A2 for basic concepts, B1-B2 for intermediate.',
        suggestedTags: extractKeywords(query),
        explanation: 'Related concepts found through semantic similarity analysis.',
      };
    }

    return {
      query,
      mode: 'similarity',
      relatedConcepts,
      suggestedTags: analysis.suggestedTags || [],
      categoryAnalysis: analysis.categoryAnalysis || '',
      difficultyAnalysis: analysis.difficultyAnalysis || '',
      explanation: analysis.explanation || '',
      totalFound: relatedConcepts.length,
    };
  } catch (error) {
    console.error('Similarity exploration failed:', error);
    return {
      query,
      mode: 'similarity',
      relatedConcepts: [],
      suggestedTags: extractKeywords(query),
      categoryAnalysis: 'Unable to analyze category due to processing error.',
      difficultyAnalysis: 'Unable to determine difficulty level.',
      explanation: 'Error occurred during similarity analysis.',
    };
  }
}


// Handle recommendation exploration
async function handleRecommendationExploration(
  llmService: ConceptLLMService,
  conceptIndex: IConceptIndex[],
  query: string,
  maxResults: number
) {
  const recommendationPrompt = `
    Based on this Polish learning query: "${query}"
    
    Recommend the most relevant concepts for learning, considering:
    1. Learning progression (what should be learned first)
    2. Practical utility (most commonly used)
    3. Foundation importance (enables learning other concepts)
    
    Rank concepts by learning priority and provide reasoning.
    Return JSON with: recommendedConcepts array containing { conceptId, name, priority, reasoning, category }
  `;

  try {
    const recommendationResponse = await llmService.analyzeText(recommendationPrompt);
    const recommendations = JSON.parse(recommendationResponse);
    
    // Match recommendations with actual concepts
    const matchedRecommendations = recommendations.recommendedConcepts
      ?.slice(0, maxResults)
      .map((rec: RecommendationItem) => {
        const matchingConcept = conceptIndex.find((c: IConceptIndex) => 
          c.name.toLowerCase().includes(rec.name.toLowerCase()) ||
          rec.name.toLowerCase().includes(c.name.toLowerCase())
        );
        
        return {
          ...rec,
          id: matchingConcept?.conceptId || null,
          matched: !!matchingConcept,
          difficulty: matchingConcept?.difficulty || 'Unknown',
        };
      }) || [];

    return {
      query,
      mode: 'recommendations',
      recommendations: matchedRecommendations,
      learningPath: generateLearningPath(matchedRecommendations),
      analysis: `Generated ${matchedRecommendations.length} learning recommendations based on your query.`,
    };
  } catch (error) {
    console.error('Recommendation exploration failed:', error);
    return {
      query,
      mode: 'recommendations',
      recommendations: [],
      learningPath: [],
      analysis: 'Error occurred while generating recommendations.',
    };
  }
}

// Handle analysis exploration
async function handleAnalysisExploration(
  llmService: ConceptLLMService,
  allConcepts: IConcept[],
  query: string
) {
  const analysisPrompt = `
    Analyze the Polish language learning concept database for: "${query}"
    
    Current database contains ${allConcepts.length} concepts.
    
    Provide comprehensive analysis including:
    1. Coverage assessment: How well does the database cover this topic?
    2. Gap analysis: What important concepts might be missing?
    3. Learning sequence: Optimal order for studying related concepts
    4. Difficulty distribution: Are concepts at appropriate levels?
    5. Practical recommendations: How to effectively study this area
    
    Return detailed analysis as text.
  `;

  try {
    const analysisResponse = await llmService.analyzeText(analysisPrompt);
    
    // Generate statistics for the analysis
    const relevantConcepts = allConcepts.filter(concept =>
      concept.name.toLowerCase().includes(query.toLowerCase()) ||
      concept.description.toLowerCase().includes(query.toLowerCase()) ||
      concept.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))
    );

    const difficultyDistribution = relevantConcepts.reduce((acc: Record<string, number>, concept: IConcept) => {
      acc[concept.difficulty] = (acc[concept.difficulty] || 0) + 1;
      return acc;
    }, {});

    const categoryDistribution = relevantConcepts.reduce((acc: Record<string, number>, concept: IConcept) => {
      acc[concept.category] = (acc[concept.category] || 0) + 1;
      return acc;
    }, {});

    return {
      query,
      mode: 'analysis',
      detailedAnalysis: analysisResponse,
      statistics: {
        totalConcepts: allConcepts.length,
        relevantConcepts: relevantConcepts.length,
        coveragePercentage: (relevantConcepts.length / allConcepts.length) * 100,
        difficultyDistribution,
        categoryDistribution,
      },
      recommendations: generateAnalysisRecommendations(relevantConcepts),
    };
  } catch (error) {
    console.error('Analysis exploration failed:', error);
    return {
      query,
      mode: 'analysis',
      detailedAnalysis: 'Error occurred during detailed analysis.',
      statistics: {
        totalConcepts: allConcepts.length,
        relevantConcepts: 0,
        coveragePercentage: 0,
        difficultyDistribution: {},
        categoryDistribution: {},
      },
      recommendations: [],
    };
  }
}

// Helper function to extract keywords from query
function extractKeywords(query: string): string[] {
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5);
}

// Helper function to generate learning path
function generateLearningPath(recommendations: RecommendationItem[]): LearningPathStep[] {
  return recommendations
    .sort((a, b) => a.priority - b.priority)
    .map((rec: RecommendationItem, index) => ({
      step: index + 1,
      concept: rec.name,
      reasoning: rec.reasoning,
      difficulty: rec.difficulty || 'B1',
    }));
}

// Helper function to generate analysis recommendations
function generateAnalysisRecommendations(concepts: IConcept[]): string[] {
  const recommendations = [];
  
  if (concepts.length === 0) {
    recommendations.push('Consider adding more concepts related to this topic');
  }
  
  if (concepts.length < 5) {
    recommendations.push('This topic appears to have limited coverage in the database');
  }
  
  const hasBasicLevel = concepts.some((c: IConcept) => ['A1', 'A2'].includes(c.difficulty));
  if (!hasBasicLevel) {
    recommendations.push('Consider adding beginner-level concepts for this topic');
  }
  
  const hasAdvancedLevel = concepts.some((c: IConcept) => ['C1', 'C2'].includes(c.difficulty));
  if (!hasAdvancedLevel) {
    recommendations.push('Advanced concepts for this topic could be added');
  }
  
  return recommendations;
}