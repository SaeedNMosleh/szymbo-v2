// app/api/practice-new/session-batch/route.ts - Load next batch of questions for unlimited practice
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import ConceptPracticeSession from "@/datamodels/conceptPracticeSession.model";
import { PracticeMode } from "@/lib/enum";
import { IQuestionBank } from "@/datamodels/questionBank.model";
import { z } from "zod";

const sessionBatchSchema = z.object({
  sessionId: z.string().min(1),
  currentQuestionCount: z.number().min(0),
  batchSize: z.number().optional().default(10),
  userId: z.string().optional().default("default"),
});

// POST /api/practice-new/session-batch - Get next batch of questions for unlimited session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { sessionId, currentQuestionCount, batchSize, userId } =
      sessionBatchSchema.parse(body);

    console.log(
      `🔄 Getting batch for session ${sessionId}: questions ${currentQuestionCount + 1}-${currentQuestionCount + batchSize}`
    );

    // Get existing session to understand context
    const session = await ConceptPracticeSession.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found or inactive",
        },
        { status: 404 }
      );
    }

    const practiceEngine = new ConceptPracticeEngine();

    // Get real-time due concept count for this user
    const [dueProgress, overdueProgress] = await Promise.all([
      SRSCalculator.getConceptsDueForReview(userId),
      SRSCalculator.getOverdueConcepts(userId),
    ]);

    const totalDueConcepts = dueProgress.length + overdueProgress.length;
    const isDueQueueCleared = totalDueConcepts === 0;

    console.log(`📊 Due concepts status: ${totalDueConcepts} concepts due, cleared: ${isDueQueueCleared}`);

    let conceptIds: string[];
    let rationale: string;
    let questions: IQuestionBank[];

    if (isDueQueueCleared) {
      // Due queue is cleared - switch to random practice
      console.log("🎯 Due queue cleared - switching to random question selection");
      
      // Get random questions from the question bank
      questions = await practiceEngine.getRandomQuestions(batchSize);
      
      // Extract concept IDs from the questions for tracking
      const conceptSet = new Set<string>();
      questions.forEach(q => q.targetConcepts.forEach(tc => conceptSet.add(tc)));
      conceptIds = Array.from(conceptSet);
      
      rationale = "All due concepts completed! Continuing with random practice questions";
    } else {
      // Still have due concepts - use smart selection
      console.log(`🎯 ${totalDueConcepts} concepts still due - using smart selection`);
      
      const selection = await practiceEngine.selectPracticeConceptsForUser(
        userId,
        Math.min(5, totalDueConcepts) // Select up to 5 concepts or all remaining due concepts
      );
      
      conceptIds = selection.concepts.map((c) => c.id);
      rationale = `${totalDueConcepts} concepts still due - ${selection.rationale}`;

      // Get questions for selected concepts
      questions = await practiceEngine.getQuestionsForConcepts(
        conceptIds,
        session.mode || PracticeMode.NORMAL,
        batchSize
      );
    }

    // Ensure we have questions
    if (questions.length === 0) {
      console.log("⚠️ No questions found for batch - using fallback");
      questions = await practiceEngine.getRandomQuestions(batchSize);
      if (questions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No questions available for practice continuation",
            suggestions: [
              "Add more courses and extract concepts",
              "Create more questions using the Question Management Hub",
              "Try ending this session and starting a new one"
            ]
          },
          { status: 400 }
        );
      }
      rationale += " (using fallback questions)";
    }

    // Update session metadata for unlimited tracking
    session.sessionMetrics.totalQuestions = currentQuestionCount + questions.length;
    session.questionsUsed = [
      ...session.questionsUsed,
      ...questions.map(q => q.id)
    ];
    
    // Add concept tracking if not already tracked
    const newConcepts = conceptIds.filter(id => !session.selectedConcepts.includes(id));
    session.selectedConcepts = [...session.selectedConcepts, ...newConcepts];
    
    await session.save();

    console.log(
      `✅ Batch loaded: ${questions.length} questions for ${conceptIds.length} concepts`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          batchNumber: Math.floor(currentQuestionCount / batchSize) + 1,
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
            totalQuestions: questions.length,
            conceptCount: conceptIds.length,
            rationale,
            isDueQueueCleared,
            totalDueConcepts,
            currentQuestionCount: currentQuestionCount + questions.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading question batch:", error);

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
        error: "Failed to load question batch",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}