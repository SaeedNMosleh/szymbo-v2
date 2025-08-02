// app/api/debug/system-status/route.ts - Quick system status check
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";

// GET /api/debug/system-status - Check overall system status
export async function GET() {
  try {
    await connectToDatabase();

    // Import all models
    const { default: Concept } = await import("@/datamodels/concept.model");
    const { default: CourseConcept } = await import(
      "@/datamodels/courseConcept.model"
    );
    const { default: Course } = await import("@/datamodels/course.model");
    const { default: QuestionBank } = await import(
      "@/datamodels/questionBank.model"
    );

    // Get counts
    const [
      totalConcepts,
      activeConcepts,
      totalCourses,
      totalCourseConcepts,
      activeCourseConcepts,
      totalQuestions,
      activeQuestions,
    ] = await Promise.all([
      Concept.countDocuments(),
      Concept.countDocuments({ isActive: true }),
      Course.countDocuments(),
      CourseConcept.countDocuments(),
      CourseConcept.countDocuments({ isActive: true }),
      QuestionBank.countDocuments(),
      QuestionBank.countDocuments({ isActive: true }),
    ]);

    // Get sample data
    const [sampleConcepts, sampleCourseConcepts, sampleCourses] =
      await Promise.all([
        Concept.find({ isActive: true }).limit(3).select("id name category"),
        CourseConcept.find({ isActive: true })
          .limit(3)
          .select("courseId conceptId confidence"),
        Course.find()
          .limit(3)
          .select("courseId courseType conceptExtractionStatus"),
      ]);

    const status = {
      healthy: totalConcepts > 0 && totalCourses > 0,
      counts: {
        concepts: { total: totalConcepts, active: activeConcepts },
        courses: { total: totalCourses },
        courseConcepts: {
          total: totalCourseConcepts,
          active: activeCourseConcepts,
        },
        questions: { total: totalQuestions, active: activeQuestions },
      },
      samples: {
        concepts: sampleConcepts,
        courseConcepts: sampleCourseConcepts,
        courses: sampleCourses,
      },
      issues: [] as string[],
    };

    // Identify issues
    if (totalConcepts === 0) {
      status.issues.push("No concepts in system");
    }
    if (totalCourses === 0) {
      status.issues.push("No courses in system");
    }
    if (totalCourseConcepts === 0) {
      status.issues.push("No course-concept links exist");
    }
    if (totalConcepts > 0 && totalCourseConcepts === 0) {
      status.issues.push("Concepts exist but are not linked to courses");
    }
    if (totalQuestions === 0) {
      status.issues.push("No questions in system");
    }

    return NextResponse.json({ status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "System status check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
