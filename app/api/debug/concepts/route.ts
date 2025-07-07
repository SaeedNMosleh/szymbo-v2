// app/api/debug/concepts/route.ts - Create this new file for debugging
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import CourseConcept from "@/datamodels/courseConcept.model";
import ConceptProgress from "@/datamodels/conceptProgress.model";
import Course from "@/datamodels/course.model";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";

// GET /api/debug/concepts - Debug concept system
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId") || "default";

    switch (action) {
      case "system-overview":
        return await getSystemOverview();

      case "course-concepts":
        if (!courseId) {
          return NextResponse.json(
            { error: "courseId required" },
            { status: 400 }
          );
        }
        return await getCourseConceptsDebug(parseInt(courseId));

      case "practice-ready":
        return await getPracticeReadyConcepts(userId);

      case "fix-progress":
        return await fixConceptProgress(userId);

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            availableActions: [
              "system-overview",
              "course-concepts",
              "practice-ready",
              "fix-progress",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getSystemOverview() {
  const [
    totalConcepts,
    activeConcepts,
    totalCourseLinks,
    totalProgress,
    courses,
  ] = await Promise.all([
    Concept.countDocuments(),
    Concept.countDocuments({ isActive: true }),
    CourseConcept.countDocuments({ isActive: true }),
    ConceptProgress.countDocuments({ isActive: true }),
    Course.find({}, { courseId: 1, conceptExtractionStatus: 1 }).sort({
      courseId: 1,
    }),
  ]);

  return NextResponse.json({
    system: {
      totalConcepts,
      activeConcepts,
      totalCourseLinks,
      totalProgress,
      courses: courses.map((c) => ({
        id: c.courseId,
        status: c.conceptExtractionStatus,
      })),
    },
  });
}

async function getCourseConceptsDebug(courseId: number) {
  const [course, courseLinks, concepts] = await Promise.all([
    Course.findOne({ courseId }),
    CourseConcept.find({ courseId, isActive: true }),
    CourseConcept.aggregate([
      { $match: { courseId, isActive: true } },
      {
        $lookup: {
          from: "concepts",
          localField: "conceptId",
          foreignField: "id",
          as: "concept",
        },
      },
      { $unwind: "$concept" },
      {
        $lookup: {
          from: "conceptprogresses",
          localField: "conceptId",
          foreignField: "conceptId",
          as: "progress",
        },
      },
    ]),
  ]);

  return NextResponse.json({
    course: {
      id: courseId,
      status: course?.conceptExtractionStatus,
      extractedConcepts: course?.extractedConcepts?.length || 0,
    },
    links: {
      total: courseLinks.length,
      concepts: concepts.map((link) => ({
        id: link.conceptId,
        name: link.concept?.name,
        category: link.concept?.category,
        confidence: link.confidence,
        hasProgress: link.progress.length > 0,
        progressDetails: link.progress[0] || null,
      })),
    },
  });
}

async function getPracticeReadyConcepts(userId: string) {
  // Get concepts due for practice
  const [dueProgress, overdueProgress, allProgress] = await Promise.all([
    SRSCalculator.getConceptsDueForReview(userId),
    SRSCalculator.getOverdueConcepts(userId),
    ConceptProgress.find({ userId, isActive: true }),
  ]);

  // Get concepts without progress
  const conceptsWithProgress = allProgress.map((p) => p.conceptId);
  const conceptsWithoutProgress = await Concept.find({
    isActive: true,
    id: { $nin: conceptsWithProgress },
  });

  return NextResponse.json({
    practice: {
      dueCount: dueProgress.length,
      overdueCount: overdueProgress.length,
      totalProgressRecords: allProgress.length,
      conceptsWithoutProgress: conceptsWithoutProgress.length,
      due: dueProgress.map((p) => ({
        conceptId: p.conceptId,
        masteryLevel: p.masteryLevel,
        nextReview: p.nextReview,
      })),
      overdue: overdueProgress.map((p) => ({
        conceptId: p.conceptId,
        masteryLevel: p.masteryLevel,
        nextReview: p.nextReview,
        daysPastDue: Math.floor(
          (Date.now() - p.nextReview.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      missingProgress: conceptsWithoutProgress.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
      })),
    },
  });
}

async function fixConceptProgress(userId: string) {
  // Find concepts without progress records
  const allConcepts = await Concept.find({ isActive: true });
  const existingProgress = await ConceptProgress.find({
    userId,
    isActive: true,
  });
  const existingConceptIds = new Set(existingProgress.map((p) => p.conceptId));

  const conceptsNeedingProgress = allConcepts.filter(
    (c) => !existingConceptIds.has(c.id)
  );

  let created = 0;
  const errors = [];

  for (const concept of conceptsNeedingProgress) {
    try {
      await SRSCalculator.initializeConceptProgress(concept.id, userId);
      created++;
    } catch (error) {
      errors.push(
        `Failed to init progress for ${concept.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return NextResponse.json({
    fix: {
      conceptsFound: conceptsNeedingProgress.length,
      progressCreated: created,
      errors,
    },
  });
}
