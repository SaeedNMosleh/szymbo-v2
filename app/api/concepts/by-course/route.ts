// app/api/concepts/by-course/route.ts - Get concepts for a specific course
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";

// GET /api/concepts/by-course?courseId=X - Get concepts for a specific course
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: "courseId parameter is required",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Getting concepts for course ${courseId}`);

    // Import required models
    const { default: CourseConcept } = await import("@/datamodels/courseConcept.model");
    const { default: Concept } = await import("@/datamodels/concept.model");

    // Get course-concept mappings
    const courseConceptMappings = await CourseConcept.find({
      courseId: parseInt(courseId),
      isActive: true,
    }).sort({ confidence: -1 });

    if (courseConceptMappings.length === 0) {
      console.log(`📋 No concepts found for course ${courseId}`);
      return NextResponse.json({
        success: true,
        data: [],
        message: `No concepts have been extracted for course ${courseId}`,
      });
    }

    const conceptIds = courseConceptMappings.map(cc => cc.conceptId);

    // Get full concept details
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    // Create a map for quick lookup of confidence scores
    const confidenceMap = new Map();
    courseConceptMappings.forEach(cc => {
      confidenceMap.set(cc.conceptId, cc.confidence);
    });

    // Enhanced concepts with extraction confidence
    const enhancedConcepts = concepts.map(concept => ({
      id: concept.id,
      name: concept.name,
      description: concept.description,
      difficulty: concept.difficulty,
      category: concept.category,
      tags: concept.tags,
      isActive: concept.isActive,
      extractionConfidence: confidenceMap.get(concept.id) || 0,
    }));

    console.log(`✅ Found ${enhancedConcepts.length} concepts for course ${courseId}`);

    return NextResponse.json({
      success: true,
      data: enhancedConcepts,
    });

  } catch (error) {
    console.error(`❌ Error getting concepts for course:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get concepts for course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}