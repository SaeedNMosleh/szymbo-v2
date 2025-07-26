// app/api/practice-new/concepts-by-weakness/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import ConceptProgress from "@/datamodels/conceptProgress.model";

// GET /api/practice-new/concepts-by-weakness - Get all concepts sorted by weakness
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";

    // Get all active concepts
    const allConcepts = await Concept.find({
      isActive: true,
    }).lean();

    const allConceptIds = allConcepts.map((c) => c.id);

    // Get progress for all concepts (if any)
    const progressMap = new Map();
    const allProgress = await ConceptProgress.find({
      userId,
      isActive: true,
      conceptId: { $in: allConceptIds },
    });

    allProgress.forEach((progress) => {
      progressMap.set(progress.conceptId, progress);
    });

    // Create weakness score for each concept
    const conceptsWithWeakness = allConcepts.map((concept) => {
      try {
        const progress = progressMap.get(concept.id);

        let weaknessScore = 0;

        if (!progress) {
          // No practice history = weakest (highest score)
          weaknessScore = 1000;
        } else {
          // Calculate weakness based on multiple factors with safe defaults
          // Lower mastery = higher weakness
          const masteryLevel = progress.masteryLevel || 0;
          const masteryWeakness = (1 - masteryLevel) * 100;

          // Lower success rate = higher weakness
          const successRate = progress.successRate || 0;
          const successWeakness = (1 - successRate) * 100;

          // More incorrect attempts = higher weakness
          const timesIncorrect = progress.timesIncorrect || 0;
          const incorrectWeakness = Math.min(timesIncorrect * 10, 100);

          // Combine factors (mastery is most important)
          weaknessScore =
            masteryWeakness * 0.5 +
            successWeakness * 0.3 +
            incorrectWeakness * 0.2;
        }

        const isOverdue =
          progress && progress.nextReview && progress.nextReview < new Date();
        const daysSinceReview =
          progress && progress.lastPracticed
            ? Math.floor(
                (new Date().getTime() - progress.lastPracticed.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;

        return {
          concept: {
            id: concept.id,
            name: concept.name,
            category: concept.category,
            description: concept.description,
            difficulty: concept.difficulty,
            tags: concept.tags || [],
          },
          progress: progress
            ? {
                masteryLevel: progress.masteryLevel || 0,
                successRate: progress.successRate || 0,
                consecutiveCorrect: progress.consecutiveCorrect || 0,
                lastPracticed: progress.lastPracticed || new Date(),
                nextReview: progress.nextReview || new Date(),
                intervalDays: progress.intervalDays || 1,
              }
            : null,
          weaknessScore,
          priority: weaknessScore, // Use weakness score as priority for compatibility
          isOverdue: isOverdue || false,
          daysSinceReview,
        };
      } catch (error) {
        console.error(`Error processing concept ${concept.id}:`, error);
        // Return a safe fallback for this concept
        return {
          concept: {
            id: concept.id,
            name: concept.name || "Unknown",
            category: concept.category || "unknown",
            description: concept.description || "",
            difficulty: concept.difficulty || "A1",
            tags: concept.tags || [],
          },
          progress: null,
          weaknessScore: 1000, // Treat as never practiced
          priority: 1000,
          isOverdue: false,
          daysSinceReview: 999,
        };
      }
    });

    // Sort by weakness (highest weakness score first)
    conceptsWithWeakness.sort((a, b) => b.weaknessScore - a.weaknessScore);

    console.log(
      `🎯 All concepts by weakness: ${conceptsWithWeakness.length} concepts`
    );
    console.log(
      `   - ${conceptsWithWeakness.filter((c) => c.weaknessScore >= 1000).length} concepts with no practice history`
    );
    console.log(
      `   - ${conceptsWithWeakness.filter((c) => c.weaknessScore < 1000).length} concepts with practice history`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          concepts: conceptsWithWeakness,
          summary: {
            totalConcepts: conceptsWithWeakness.length,
            conceptsWithoutHistory: conceptsWithWeakness.filter(
              (c) => c.weaknessScore >= 1000
            ).length,
            conceptsWithHistory: conceptsWithWeakness.filter(
              (c) => c.weaknessScore < 1000
            ).length,
            averageWeakness:
              conceptsWithWeakness.length > 0
                ? conceptsWithWeakness.reduce(
                    (sum, c) => sum + c.weaknessScore,
                    0
                  ) / conceptsWithWeakness.length
                : 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concepts by weakness:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concepts by weakness",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
