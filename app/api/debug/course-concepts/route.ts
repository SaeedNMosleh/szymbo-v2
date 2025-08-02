// app/api/debug/course-concepts/route.ts - Debug course-concept relationships
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";

// GET /api/debug/course-concepts - Debug what concepts exist for courses
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // Import required models
    const { default: CourseConcept } = await import("@/datamodels/courseConcept.model");
    const { default: Concept } = await import("@/datamodels/concept.model");
    const { default: Course } = await import("@/datamodels/course.model");

    if (courseId) {
      // Debug specific course
      const [course, courseConceptMappings, allConcepts] = await Promise.all([
        Course.findOne({ courseId: parseInt(courseId) }),
        CourseConcept.find({ courseId: parseInt(courseId) }),
        Concept.find({ isActive: true }).limit(5)
      ]);

      return NextResponse.json({
        debug: {
          courseId: parseInt(courseId),
          course: course ? {
            id: course.courseId,
            type: course.courseType,
            status: course.conceptExtractionStatus,
            keywords: course.keywords,
          } : null,
          courseConceptMappings: courseConceptMappings.length,
          mappingDetails: courseConceptMappings.map(cc => ({
            conceptId: cc.conceptId,
            confidence: cc.confidence,
            isActive: cc.isActive,
            extractedDate: cc.extractedDate
          })),
          sampleConcepts: allConcepts.map(c => ({
            id: c.id,
            name: c.name,
            category: c.category
          }))
        }
      });
    }

    // Debug all courses and their concept counts
    const [allCourses, allCourseConcepts, totalConcepts] = await Promise.all([
      Course.find({}).sort({ courseId: 1 }).limit(10),
      CourseConcept.find({ isActive: true }),
      Concept.countDocuments({ isActive: true })
    ]);

    // Group course concepts by courseId
    const conceptCounts = new Map();
    allCourseConcepts.forEach(cc => {
      conceptCounts.set(cc.courseId, (conceptCounts.get(cc.courseId) || 0) + 1);
    });

    return NextResponse.json({
      debug: {
        totalCourses: allCourses.length,
        totalCourseConcepts: allCourseConcepts.length,
        totalConcepts,
        courseDetails: allCourses.map(course => ({
          id: course.courseId,
          type: course.courseType,
          status: course.conceptExtractionStatus || 'pending',
          conceptCount: conceptCounts.get(course.courseId) || 0,
          keywords: course.keywords?.slice(0, 3) || []
        })),
        sampleCourseConcepts: allCourseConcepts.slice(0, 5).map(cc => ({
          courseId: cc.courseId,
          conceptId: cc.conceptId,
          confidence: cc.confidence,
          isActive: cc.isActive
        }))
      }
    });

  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}