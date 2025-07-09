// app/api/practice-new/session/route.ts - UPDATED with enhanced error handling and fallback messaging
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { PracticeMode } from "@/lib/enum";
import { z } from "zod";

const sessionRequestSchema = z.object({
  mode: z.enum([
    PracticeMode.NORMAL,
    PracticeMode.PREVIOUS,
    PracticeMode.DRILL,
    PracticeMode.COURSE,
  ]),
  userId: z.string().optional().default("default"),
  maxQuestions: z.number().optional().default(10),
  maxConcepts: z.number().optional().default(5),
  targetConceptIds: z.array(z.string()).optional(),
  courseId: z.number().optional(),
});

// POST /api/practice-new/session - Start new practice session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { mode, userId, maxQuestions, maxConcepts, targetConceptIds, courseId } =
      sessionRequestSchema.parse(body);

    console.log(
      `🎯 Starting practice session: mode=${mode}, userId=${userId}, maxQuestions=${maxQuestions}, maxConcepts=${maxConcepts}`
    );

    const practiceEngine = new ConceptPracticeEngine();

    // Select concepts for practice
    let conceptIds: string[];
    let rationale: string;
    let fallbackUsed = false;

    if (targetConceptIds && targetConceptIds.length > 0) {
      // Manual concept selection
      conceptIds = targetConceptIds.slice(0, maxConcepts);
      rationale = "Manually selected concepts";
      console.log(`Using manually selected concepts: ${conceptIds.join(", ")}`);
    } else if (mode === PracticeMode.COURSE) {
      // Course-based concept selection
      if (!courseId) {
        return NextResponse.json(
          {
            success: false,
            error: "Course ID is required for course-based practice",
          },
          { status: 400 }
        );
      }
      
      const selection = await practiceEngine.selectConceptsFromCourse(
        courseId,
        maxConcepts
      );
      conceptIds = selection.concepts.map((c) => c.id);
      rationale = selection.rationale;
      console.log(
        `Course selection result: ${conceptIds.length} concepts selected from course ${courseId}`
      );
    } else {
      // Smart concept selection
      const selection = await practiceEngine.selectPracticeConceptsForUser(
        userId,
        maxConcepts
      );
      conceptIds = selection.concepts.map((c) => c.id);
      rationale = selection.rationale;
      console.log(
        `Smart selection result: ${conceptIds.length} concepts selected`
      );
    }

    // Get questions for selected concepts with enhanced fallback
    console.log(`🔍 Attempting to get questions for ${conceptIds.length} concepts`);
    const questions = await practiceEngine.getQuestionsForConcepts(
      conceptIds,
      mode,
      maxQuestions
    );

    // Enhanced error handling with specific messages
    if (questions.length === 0) {
      console.log(`❌ No questions found even after fallback strategies`);
      
      // Different error messages based on mode
      let errorMessage = "No questions are currently available for practice.";
      let suggestions: string[] = [];

      switch (mode) {
        case PracticeMode.PREVIOUS:
          errorMessage = "No previously practiced questions found.";
          suggestions = [
            "Try practicing in 'Smart Practice' mode first to build up a question history",
            "Add some courses and extract concepts to expand your question bank",
            "Switch to 'Smart Practice' mode to generate new questions"
          ];
          break;
        case PracticeMode.DRILL:
          errorMessage = "No questions with performance data found for drilling.";
          suggestions = [
            "Practice some questions first to build performance history",
            "Try 'Smart Practice' mode to answer questions and create drill material",
            "Add more courses with concept extraction to expand available content"
          ];
          break;
        case PracticeMode.NORMAL:
          errorMessage = "No concepts or questions available for practice.";
          suggestions = [
            "Add some Polish language courses through the 'Add Course' feature",
            "Extract concepts from your courses using the concept extraction system",
            "Ensure your courses have sufficient content (notes, practice text, keywords)"
          ];
          break;
        case PracticeMode.COURSE:
          errorMessage = `No concepts or questions available for the selected course.`;
          suggestions = [
            "Ensure concepts have been extracted from this course",
            "Try the concept extraction system to process course content",
            "Add more content to the course (notes, practice text, keywords)",
            "Switch to 'Smart Practice' mode to practice other concepts"
          ];
          break;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          suggestions,
          debug: {
            mode,
            conceptsFound: conceptIds.length,
            questionsAttempted: true,
            fallbacksUsed: true
          }
        },
        { status: 400 }
      );
    }

    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log successful session creation with details
    console.log(
      `✅ Session created successfully: ${sessionId} with ${questions.length} questions`
    );

    // Check if we're using fallback questions (questions without matching target concepts)
    const conceptSet = new Set(conceptIds);
    const questionsWithMatchingConcepts = questions.filter(q => 
      q.targetConcepts.some(tc => conceptSet.has(tc))
    );
    
    if (questionsWithMatchingConcepts.length < questions.length) {
      fallbackUsed = true;
      console.log(`⚠️ Using ${questions.length - questionsWithMatchingConcepts.length} fallback questions`);
    }

    // Enhanced rationale with fallback information
    let enhancedRationale = rationale;
    if (fallbackUsed) {
      enhancedRationale += ` (Used fallback strategy to ensure questions are available)`;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          conceptIds,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            questionType: q.questionType,
            difficulty: q.difficulty,
            targetConcepts: q.targetConcepts,
          })),
          metadata: {
            mode,
            totalQuestions: questions.length,
            conceptCount: conceptIds.length,
            rationale: enhancedRationale,
            fallbackUsed,
            questionsWithMatchingConcepts: questionsWithMatchingConcepts.length,
            fallbackQuestions: questions.length - questionsWithMatchingConcepts.length
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating practice session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create practice session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/practice-new/session - Get practice statistics
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";

    console.log(`📊 Getting practice stats for user: ${userId}`);

    const practiceEngine = new ConceptPracticeEngine();
    const stats = await practiceEngine.getPracticeStats(userId);

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching practice stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch practice statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}