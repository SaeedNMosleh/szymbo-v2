// app/api/practice-new/concepts-due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import Concept from "@/datamodels/concept.model";

// GET /api/practice-new/concept-due - Get concepts due for practice (Note: endpoint uses singular 'concept-due')
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const includeDetails = searchParams.get("includeDetails") === "true";
    const realTimeCount = searchParams.get("realTimeCount") === "true";

    // Get concepts due for review
    const [dueProgress, overdueProgress] = await Promise.all([
      SRSCalculator.getConceptsDueForReview(userId),
      SRSCalculator.getOverdueConcepts(userId)
    ]);

    const allDueProgress = [...overdueProgress, ...dueProgress];

    // For real-time count requests (used during unlimited practice)
    if (realTimeCount) {
      return NextResponse.json({
        success: true,
        data: {
          totalDue: allDueProgress.length,
          dueConcepts: dueProgress.length,
          overdueConcepts: overdueProgress.length,
          isDueQueueCleared: allDueProgress.length === 0,
          timestamp: new Date().toISOString()
        }
      }, { status: 200 });
    }

    if (!includeDetails) {
      // Return just concept IDs for lightweight requests
      return NextResponse.json({
        success: true,
        data: {
          conceptIds: allDueProgress.map(p => p.conceptId),
          dueConcepts: dueProgress.length,
          overdueConcepts: overdueProgress.length,
          totalDue: allDueProgress.length,
          isDueQueueCleared: allDueProgress.length === 0
        }
      }, { status: 200 });
    }

    // Get full concept details
    const conceptIds = allDueProgress.map(p => p.conceptId);
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true
    });

    // Combine progress data with concept details
    const conceptsWithProgress = concepts.map(concept => {
      const progress = allDueProgress.find(p => p.conceptId === concept.id);
      const priority = progress ? SRSCalculator.calculatePriority(progress) : 0;
      const isOverdue = overdueProgress.some(p => p.conceptId === concept.id);

      return {
        concept: {
          id: concept.id,
          name: concept.name,
          category: concept.category,
          description: concept.description,
          difficulty: concept.difficulty
        },
        progress: progress ? {
          masteryLevel: progress.masteryLevel,
          successRate: progress.successRate,
          consecutiveCorrect: progress.consecutiveCorrect,
          lastPracticed: progress.lastPracticed,
          nextReview: progress.nextReview,
          intervalDays: progress.intervalDays
        } : null,
        priority,
        isOverdue,
        daysSinceReview: progress ? Math.floor(
          (new Date().getTime() - progress.nextReview.getTime()) / (1000 * 60 * 60 * 24)
        ) : 0
      };
    });

    // Sort by priority (highest first)
    conceptsWithProgress.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      success: true,
      data: {
        concepts: conceptsWithProgress,
        summary: {
          totalDue: allDueProgress.length,
          dueConcepts: dueProgress.length,
          overdueConcepts: overdueProgress.length,
          isDueQueueCleared: allDueProgress.length === 0,
          averagePriority: conceptsWithProgress.length > 0 
            ? conceptsWithProgress.reduce((sum, c) => sum + c.priority, 0) / conceptsWithProgress.length 
            : 0,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching due concepts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch due concepts",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}