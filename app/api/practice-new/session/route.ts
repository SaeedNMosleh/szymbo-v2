// app/api/practice-new/session/route.ts - UPDATED with enhanced error handling and fallback messaging
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { PracticeMode } from "@/lib/enum";
import { IQuestionBank } from "@/datamodels/questionBank.model";
import { z } from "zod";

const sessionRequestSchema = z.object({
  mode: z.enum([PracticeMode.NORMAL, PracticeMode.DRILL]),
  userId: z.string().optional().default("default"),
  maxQuestions: z.number().optional().default(10),
  maxConcepts: z.number().optional().default(5),
  targetConceptIds: z.array(z.string()).optional(),
  courseId: z.number().optional(),
  drillType: z.enum(["weakness", "course"]).optional(),
});

// POST /api/practice-new/session - Start new practice session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { mode, userId, maxQuestions, maxConcepts, targetConceptIds, courseId, drillType } =
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
    } else if (mode === PracticeMode.DRILL) {
      // Drill mode concept selection
      if (drillType === "course") {
        if (!courseId) {
          return NextResponse.json(
            {
              success: false,
              error: "Course ID is required for course-based drilling",
            },
            { status: 400 }
          );
        }
        
        // Enhanced course drill validation
        console.log(`🎯 SESSION: Starting course drill for course ${courseId}`);
        conceptIds = await practiceEngine.getDrillConceptsByCourse(
          courseId,
          maxConcepts
        );
        console.log(`🎯 SESSION: getDrillConceptsByCourse returned ${conceptIds.length} concepts`);
        
        if (conceptIds.length === 0) {
          console.log(`❌ DRILL: No concepts found for course ${courseId} - cannot start drill`);
          return NextResponse.json(
            {
              success: false,
              error: `Course ${courseId} has no extracted concepts available for drilling`,
              suggestions: [
                "Use the concept extraction system to process this course content",
                "Ensure the course has sufficient content (notes, practice text, keywords)",
                "Check that concept extraction has been completed for this course",
                "Try a different course that has concepts extracted"
              ],
              debug: {
                mode,
                drillType,
                courseId,
                conceptsFound: 0
              }
            },
            { status: 400 }
          );
        }
        
        rationale = `Drilling ${conceptIds.length} concepts from course ${courseId}`;
        console.log(
          `🎯 DRILL: Course selection: ${conceptIds.length} concepts from course ${courseId}`
        );
      } else {
        // Weakness-based drilling (default) - show ALL concepts sorted by weakness
        conceptIds = await practiceEngine.getDrillConceptsByWeakness(
          userId,
          0 // 0 means no limit - show all concepts sorted by weakness
        );
        
        if (conceptIds.length === 0) {
          console.log(`❌ DRILL: No concepts found for weakness drilling - user has no concept history`);
          return NextResponse.json(
            {
              success: false,
              error: "No concepts available for weakness-based drilling",
              suggestions: [
                "Practice some questions first to build performance history",
                "Try 'Normal Practice' mode to answer questions and create drill material",
                "Add courses and extract concepts to build your concept library",
                "Use the concept extraction system to process course content"
              ],
              debug: {
                mode,
                drillType: "weakness",
                userId,
                conceptsFound: 0
              }
            },
            { status: 400 }
          );
        }
        
        rationale = `Drilling ${conceptIds.length} concepts sorted by weakness (weakest first)`;
        console.log(
          `🎯 DRILL: Weakness selection: ${conceptIds.length} concepts sorted by weakness`
        );
      }
    } else {
      // NORMAL mode - Smart concept selection via SRS
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

    // Enhanced error handling with specific messages - PREVENT ZERO QUESTION SESSIONS
    if (questions.length === 0) {
      console.log(`❌ CRITICAL: No questions found even after fallback strategies - Practice session will NOT be created`);
      
      // Different error messages based on mode
      let errorMessage = "No questions are currently available for practice.";
      let suggestions: string[] = [];

      switch (mode) {
        case PracticeMode.DRILL:
          if (drillType === "course") {
            errorMessage = `No questions found that strictly target concepts from course ${courseId}`;
            suggestions = [
              "The course may have concepts but no questions targeting them specifically",
              "Use the Question Management Hub to create questions for these concepts",
              "Try concept extraction first, then generate questions for the concepts",
              "Switch to 'Normal Practice' mode which uses flexible question matching"
            ];
          } else {
            errorMessage = "No questions found that strictly target the selected weak concepts";
            suggestions = [
              "The selected concepts exist but have no questions targeting them specifically",
              "Use the Question Management Hub to create questions for weak concepts",
              "Try 'Normal Practice' mode which uses flexible question matching",
              "Add more courses and extract concepts to build question inventory"
            ];
          }
          break;
        case PracticeMode.NORMAL:
          errorMessage = "No concepts or questions available for practice.";
          suggestions = [
            "Add some Polish language courses through the 'Add Course' feature",
            "Extract concepts from your courses using the concept extraction system",
            "Ensure your courses have sufficient content (notes, practice text, keywords)"
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

    // Additional safety check - minimum question threshold
    if (questions.length < 3) {
      console.log(`⚠️ WARNING: Only ${questions.length} questions available - recommending user to add more content`);
      return NextResponse.json(
        {
          success: false,
          error: `Only ${questions.length} question(s) available for practice. A minimum of 3 questions is recommended.`,
          suggestions: [
            "Add more courses with Polish content",
            "Extract concepts from existing courses",
            "Use the Question Management Hub to create more questions",
            "Try a different practice mode or concept selection"
          ],
          debug: {
            mode,
            conceptsFound: conceptIds.length,
            questionsFound: questions.length,
            minimumRequired: 3
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

    // Check question-concept matching for reporting
    const conceptSet = new Set(conceptIds);
    let questionsWithMatchingConcepts: IQuestionBank[] = [];

    if (mode === PracticeMode.DRILL) {
      // DRILL mode: All questions should target at least one drill concept
      questionsWithMatchingConcepts = questions.filter(q => 
        q.targetConcepts.some(tc => conceptSet.has(tc))
      );
      
      console.log(`🎯 DRILL: ${questionsWithMatchingConcepts.length}/${questions.length} questions target drill concepts`);
      
      // Log drill relevance metrics
      const drillMetrics = questions.map(q => {
        const drillMatches = q.targetConcepts.filter(tc => conceptSet.has(tc)).length;
        const totalConcepts = q.targetConcepts.length;
        return { drillMatches, totalConcepts, relevance: drillMatches / totalConcepts };
      });
      
      const avgRelevance = drillMetrics.reduce((sum, m) => sum + m.relevance, 0) / drillMetrics.length;
      console.log(`📊 DRILL: Average question relevance: ${(avgRelevance * 100).toFixed(1)}%`);
    } else {
      // NORMAL mode: Check for matching concepts (allow fallback)
      questionsWithMatchingConcepts = questions.filter(q => 
        q.targetConcepts.some(tc => conceptSet.has(tc))
      );
      
      if (questionsWithMatchingConcepts.length < questions.length) {
        fallbackUsed = true;
        console.log(`⚠️ NORMAL: Using ${questions.length - questionsWithMatchingConcepts.length} fallback questions`);
      }
    }

    // Enhanced rationale with fallback information (NORMAL mode only)
    let enhancedRationale = rationale;
    if (fallbackUsed && mode === PracticeMode.NORMAL) {
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
            correctAnswer: q.correctAnswer,
            options: q.options,
            audioUrl: q.audioUrl,
            imageUrl: q.imageUrl,
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