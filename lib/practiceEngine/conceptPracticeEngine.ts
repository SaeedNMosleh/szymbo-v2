// lib/practiceEngine/conceptPracticeEngine.ts - ENHANCED VERSION WITH FALLBACK STRATEGY
import Concept, { IConcept } from "@/datamodels/concept.model";
import ConceptProgress, {
  IConceptProgress,
} from "@/datamodels/conceptProgress.model";
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { SRSCalculator } from "./srsCalculator";
import { ContextBuilder } from "./contextBuilder";
import { generateQuestion } from "@/lib/LLMPracticeValidation/generateQuestion";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { v4 as uuidv4 } from "uuid";

export interface ConceptSelection {
  concepts: IConcept[];
  rationale: string;
  priorities: Map<string, number>;
}

export interface PracticeStats {
  totalConcepts: number;
  dueConcepts: number;
  overdueConcepts: number;
  averageMastery: number;
  questionBankSize: number;
  conceptsWithProgress: number;
  recentActivity: {
    practiceSessionsThisWeek: number;
    conceptsPracticedThisWeek: number;
    averageAccuracy: number;
  };
}

interface FallbackResult {
  questions: IQuestionBank[];
  fallbackLevel: string;
  reason: string;
}

export class ConceptPracticeEngine {
  private contextBuilder: ContextBuilder;

  constructor() {
    this.contextBuilder = new ContextBuilder();
  }

  /**
   * Get comprehensive practice statistics for a user
   */
  async getPracticeStats(userId: string = "default"): Promise<PracticeStats> {
    try {
      console.log(`📊 Getting practice stats for user: ${userId}`);

      // Get all active concepts
      const totalConcepts = await Concept.countDocuments({ isActive: true });

      // Get due and overdue concepts
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      // Get all progress records for this user
      const allProgress = await ConceptProgress.find({
        userId,
        isActive: true,
      });

      // Calculate average mastery
      const averageMastery =
        allProgress.length > 0
          ? allProgress.reduce((sum, p) => sum + p.masteryLevel, 0) /
            allProgress.length
          : 0;

      // Get question bank size
      const questionBankSize = await QuestionBank.countDocuments({
        isActive: true,
      });

      // Calculate recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentProgress = await ConceptProgress.find({
        userId,
        lastPracticed: { $gte: weekAgo },
        isActive: true,
      });

      const recentActivity = {
        practiceSessionsThisWeek: 0, // Would need practice session tracking
        conceptsPracticedThisWeek: recentProgress.length,
        averageAccuracy:
          recentProgress.length > 0
            ? recentProgress.reduce((sum, p) => sum + p.successRate, 0) /
              recentProgress.length
            : 0,
      };

      const stats: PracticeStats = {
        totalConcepts,
        dueConcepts: dueProgress.length,
        overdueConcepts: overdueProgress.length,
        averageMastery,
        questionBankSize,
        conceptsWithProgress: allProgress.length,
        recentActivity,
      };

      console.log(`✅ Practice stats calculated:`, {
        totalConcepts: stats.totalConcepts,
        dueConcepts: stats.dueConcepts,
        overdueConcepts: stats.overdueConcepts,
        questionBankSize: stats.questionBankSize,
      });

      return stats;
    } catch (error) {
      console.error(
        `❌ Error calculating practice stats for user ${userId}:`,
        error
      );

      // Return default stats in case of error
      return {
        totalConcepts: 0,
        dueConcepts: 0,
        overdueConcepts: 0,
        averageMastery: 0,
        questionBankSize: 0,
        conceptsWithProgress: 0,
        recentActivity: {
          practiceSessionsThisWeek: 0,
          conceptsPracticedThisWeek: 0,
          averageAccuracy: 0,
        },
      };
    }
  }

  /**
   * Select concepts for practice based on SRS algorithm and user performance
   */
  async selectPracticeConceptsForUser(
    userId: string = "default",
    maxConcepts: number = 5
  ): Promise<ConceptSelection> {
    try {
      console.log(
        `🎯 Selecting practice concepts for user: ${userId}, max: ${maxConcepts}`
      );

      // Get due and overdue concepts
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      const allDueProgress = [...overdueProgress, ...dueProgress];
      console.log(`Found ${allDueProgress.length} concepts due for practice`);

      // If no due concepts, initialize some basic concepts for new users
      if (allDueProgress.length === 0) {
        console.log(
          "No due concepts found, initializing basic concepts for new user"
        );
        return await this.initializeNewUserPractice(userId, maxConcepts);
      }

      // Calculate priorities and select top concepts
      const priorities = new Map<string, number>();

      for (const progress of allDueProgress) {
        const priority = SRSCalculator.calculatePriority(progress);
        priorities.set(progress.conceptId, priority);
      }

      // Sort by priority and take top concepts
      const sortedProgress = allDueProgress
        .sort(
          (a, b) => priorities.get(b.conceptId)! - priorities.get(a.conceptId)!
        )
        .slice(0, maxConcepts);

      const conceptIds = sortedProgress.map((p) => p.conceptId);

      // Get full concept details
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      // Generate rationale
      const rationale = this.generateSelectionRationale(
        sortedProgress,
        overdueProgress.length
      );

      console.log(`✅ Selected ${concepts.length} concepts for practice`);

      return {
        concepts,
        rationale,
        priorities,
      };
    } catch (error) {
      console.error("❌ Error selecting practice concepts:", error);

      // Fallback to basic concept selection
      return await this.initializeNewUserPractice(userId, maxConcepts);
    }
  }

  /**
   * Initialize practice for new users with basic concepts
   */
  private async initializeNewUserPractice(
    userId: string,
    maxConcepts: number
  ): Promise<ConceptSelection> {
    try {
      console.log(`🆕 Initializing practice for new user: ${userId}`);

      // Get some basic concepts (A1 level, most fundamental)
      const basicConcepts = await Concept.find({
        isActive: true,
        difficulty: QuestionLevel.A1,
      })
        .sort({ name: 1 })
        .limit(maxConcepts);

      // If no A1 concepts, get any concepts
      if (basicConcepts.length === 0) {
        const anyConcepts = await Concept.find({ isActive: true })
          .sort({ name: 1 })
          .limit(maxConcepts);

        // Initialize progress for these concepts
        for (const concept of anyConcepts) {
          await SRSCalculator.initializeConceptProgress(concept.id, userId);
        }

        return {
          concepts: anyConcepts,
          rationale:
            "Starting with available concepts to begin your learning journey",
          priorities: new Map(),
        };
      }

      // Initialize progress for basic concepts
      for (const concept of basicConcepts) {
        await SRSCalculator.initializeConceptProgress(concept.id, userId);
      }

      console.log(
        `✅ Initialized progress for ${basicConcepts.length} basic concepts`
      );

      return {
        concepts: basicConcepts,
        rationale:
          "Starting with fundamental A1-level concepts to build your foundation",
        priorities: new Map(),
      };
    } catch (error) {
      console.error("❌ Error initializing new user practice:", error);
      return {
        concepts: [],
        rationale: "Unable to initialize practice concepts",
        priorities: new Map(),
      };
    }
  }

  /**
   * Generate human-readable rationale for concept selection
   */
  private generateSelectionRationale(
    selectedProgress: IConceptProgress[],
    overdueCount: number
  ): string {
    if (selectedProgress.length === 0) {
      return "No concepts are currently due for practice. Great job keeping up!";
    }

    const parts: string[] = [];

    if (overdueCount > 0) {
      parts.push(
        `${overdueCount} overdue concept${overdueCount > 1 ? "s" : ""}`
      );
    }

    const dueCount = selectedProgress.length - overdueCount;
    if (dueCount > 0) {
      parts.push(`${dueCount} concept${dueCount > 1 ? "s" : ""} due today`);
    }

    const lowMasteryCount = selectedProgress.filter(
      (p) => p.masteryLevel < 0.5
    ).length;
    if (lowMasteryCount > 0) {
      parts.push(
        `focusing on ${lowMasteryCount} concept${lowMasteryCount > 1 ? "s" : ""} that need more practice`
      );
    }

    if (parts.length === 0) {
      return "Selected concepts based on spaced repetition schedule";
    }

    return `Selected ${parts.join(", ")} for optimal learning`;
  }

  /**
   * Get questions for selected concepts with comprehensive fallback strategy
   */
  async getQuestionsForConcepts(
    conceptIds: string[],
    mode: PracticeMode,
    maxQuestions: number = 10
  ): Promise<IQuestionBank[]> {
    try {
      console.log(
        `🎯 Getting questions for concepts: ${conceptIds.join(", ")}, mode: ${mode}`
      );

      if (conceptIds.length === 0) {
        console.log("No concepts provided, using fallback strategy");
        return await this.getFallbackQuestions([], mode, maxQuestions);
      }

      let questions: IQuestionBank[] = [];

      switch (mode) {
        case PracticeMode.NORMAL:
          questions = await this.getNormalPracticeQuestions(
            conceptIds,
            maxQuestions
          );
          break;
        case PracticeMode.PREVIOUS:
          questions = await this.getPreviousQuestionsWithFallback(
            conceptIds,
            maxQuestions
          );
          break;
        case PracticeMode.DRILL:
          questions = await this.getDrillQuestions(conceptIds, maxQuestions);
          break;
        default:
          questions = await this.getNormalPracticeQuestions(
            conceptIds,
            maxQuestions
          );
      }

      console.log(`✅ Retrieved ${questions.length} questions for practice`);
      return questions;
    } catch (error) {
      console.error("❌ Error getting questions for concepts:", error);
      return [];
    }
  }

  /**
   * Enhanced Previous Questions with comprehensive fallback strategy
   */
  private async getPreviousQuestionsWithFallback(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    console.log(`🔄 Implementing fallback strategy for previous questions`);

    // 1. Try: SRS due concepts → previous questions
    let result = await this.tryGetPreviousQuestions(
      conceptIds,
      maxQuestions,
      "SRS due concepts"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 2. Fallback 1: Any concepts with progress → previous questions
    console.log(
      `⚠️ ${result.reason}, trying fallback 1: concepts with progress`
    );
    const conceptsWithProgress = await this.getConceptsWithProgress();
    result = await this.tryGetPreviousQuestions(
      conceptsWithProgress.map((c) => c.conceptId),
      maxQuestions,
      "concepts with progress"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 3. Fallback 2: Any concepts → previous questions
    console.log(`⚠️ ${result.reason}, trying fallback 2: any concepts`);
    const allConcepts = await Concept.find({ isActive: true }).limit(20); // Limit to prevent huge queries
    result = await this.tryGetPreviousQuestions(
      allConcepts.map((c) => c.id),
      maxQuestions,
      "any available concepts"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 4. Fallback 3: All previous questions (ignore concepts)
    console.log(
      `⚠️ ${result.reason}, trying fallback 3: all previous questions`
    );
    result = await this.tryGetAllPreviousQuestions(maxQuestions);
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 5. Final: All available questions
    console.log(
      `⚠️ ${result.reason}, trying final fallback: all available questions`
    );
    result = await this.tryGetAllAvailableQuestions(maxQuestions);
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    console.log(`❌ All fallback strategies exhausted, no questions available`);
    return [];
  }

  /**
   * Try to get previous questions for specific concepts
   */
  private async tryGetPreviousQuestions(
    conceptIds: string[],
    maxQuestions: number,
    fallbackLevel: string
  ): Promise<FallbackResult> {
    if (conceptIds.length === 0) {
      return {
        questions: [],
        fallbackLevel,
        reason: `No concepts available for ${fallbackLevel}`,
      };
    }

    try {
      const questions = await QuestionBank.find({
        targetConcepts: { $in: conceptIds },
        timesUsed: { $gt: 0 },
        isActive: true,
      })
        .sort({ lastUsed: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel,
        reason:
          questions.length === 0
            ? `No previous questions found for ${fallbackLevel}`
            : `Found questions using ${fallbackLevel}`,
      };
    } catch (error) {
      console.error(
        `Error in tryGetPreviousQuestions for ${fallbackLevel}:`,
        error
      );
      return {
        questions: [],
        fallbackLevel,
        reason: `Error querying ${fallbackLevel}`,
      };
    }
  }

  /**
   * Try to get all previous questions regardless of concepts
   */
  private async tryGetAllPreviousQuestions(
    maxQuestions: number
  ): Promise<FallbackResult> {
    try {
      const questions = await QuestionBank.find({
        timesUsed: { $gt: 0 },
        isActive: true,
      })
        .sort({ lastUsed: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel: "all previous questions",
        reason:
          questions.length === 0
            ? "No previously used questions found"
            : "Found previously used questions",
      };
    } catch (error) {
      console.error("Error in tryGetAllPreviousQuestions:", error);
      return {
        questions: [],
        fallbackLevel: "all previous questions",
        reason: "Error querying all previous questions",
      };
    }
  }

  /**
   * Final fallback: get any available questions
   */
  private async tryGetAllAvailableQuestions(
    maxQuestions: number
  ): Promise<FallbackResult> {
    try {
      const questions = await QuestionBank.find({
        isActive: true,
      })
        .sort({ createdDate: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel: "all available questions",
        reason:
          questions.length === 0
            ? "No questions available in database"
            : "Using any available questions",
      };
    } catch (error) {
      console.error("Error in tryGetAllAvailableQuestions:", error);
      return {
        questions: [],
        fallbackLevel: "all available questions",
        reason: "Error querying all available questions",
      };
    }
  }

  /**
   * Get concepts that have progress records
   */
  private async getConceptsWithProgress(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    try {
      return await ConceptProgress.find({
        userId,
        isActive: true,
      });
    } catch (error) {
      console.error("Error getting concepts with progress:", error);
      return [];
    }
  }

  /**
   * Fallback questions when no concepts are provided
   */
  private async getFallbackQuestions(
    conceptIds: string[],
    mode: PracticeMode,
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    console.log(`🔄 Using fallback questions for mode: ${mode}`);

    switch (mode) {
      case PracticeMode.PREVIOUS: {
        const result = await this.tryGetAllPreviousQuestions(maxQuestions);
        return result.questions;
      }
      case PracticeMode.DRILL:
        return await this.tryGetAllAvailableQuestions(maxQuestions).then(
          (r) => r.questions
        );
      default:
        return await this.tryGetAllAvailableQuestions(maxQuestions).then(
          (r) => r.questions
        );
    }
  }

  /**
   * Get normal practice questions (mix of existing and new)
   */
  private async getNormalPracticeQuestions(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    // Get existing questions (50% of total)
    const existingCount = Math.floor(maxQuestions * 0.5);
    const existingQuestions = await QuestionBank.find({
      targetConcepts: { $in: conceptIds },
      isActive: true,
    })
      .sort({ timesUsed: 1, successRate: -1 }) // Prefer less used, higher success rate
      .limit(existingCount);

    // Generate new questions for remaining slots
    const newCount = maxQuestions - existingQuestions.length;
    const newQuestions = await this.generateNewQuestions(conceptIds, newCount);

    return [...existingQuestions, ...newQuestions];
  }

  /**
   * Get drill questions (focus on poor performance)
   */
  private async getDrillQuestions(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    const poorQuestions = await QuestionBank.find({
      targetConcepts: { $in: conceptIds },
      successRate: { $lt: 0.6 },
      timesUsed: { $gt: 2 },
      isActive: true,
    })
      .sort({ successRate: 1 }) // Worst performing first
      .limit(Math.floor(maxQuestions * 0.7));

    // Fill remaining with new questions
    const remainingCount = maxQuestions - poorQuestions.length;
    const newQuestions = await this.generateNewQuestions(
      conceptIds,
      remainingCount
    );

    return [...poorQuestions, ...newQuestions];
  }

  /**
   * Generate new questions for concepts
   */
  private async generateNewQuestions(
    conceptIds: string[],
    count: number
  ): Promise<IQuestionBank[]> {
    if (count <= 0) return [];

    console.log(
      `🎯 Generating ${count} new questions for concepts: ${conceptIds.join(", ")}`
    );

    try {
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      if (concepts.length === 0) {
        console.log("No concepts found, cannot generate questions");
        return [];
      }

      const context = concepts
        .map(
          (c) =>
            `${c.name}: ${c.description}. Examples: ${c.examples.join(", ")}`
        )
        .join("\n");

      const savedQuestions: IQuestionBank[] = [];

      // Generate questions one by one
      for (let i = 0; i < Math.min(count, 3); i++) {
        try {
          const mockCourse = {
            courseId: 0,
            date: new Date(),
            courseType: CourseType.NEW,
            notes: context,
            practice: context,
            keywords: concepts.flatMap((c) => [c.name]),
            newWords: concepts.flatMap((c) => c.examples.slice(0, 2)),
          };

          const previousQuestions = savedQuestions.map((q) => q.question);
          const questionText = await generateQuestion(
            mockCourse,
            previousQuestions
          );

          if (!questionText || questionText.includes("Failed to generate")) {
            console.log(`❌ Failed to generate question ${i + 1}, skipping`);
            continue;
          }

          // Create question with valid required fields
          const questionData: IQuestionBank = {
            id: uuidv4(),
            question: questionText,
            correctAnswer: "To be determined during practice",
            questionType: QuestionType.Q_AND_A,
            targetConcepts: conceptIds,
            difficulty: this.inferDifficulty(concepts),
            timesUsed: 0,
            successRate: 0,
            lastUsed: new Date(),
            createdDate: new Date(),
            isActive: true,
            source: "generated",
          };

          // Save directly to database with proper validation
          const savedQuestion = await QuestionBank.create(questionData);
          savedQuestions.push(savedQuestion.toObject());
          console.log(
            `✅ Generated and saved question ${i + 1}: ${questionText.substring(0, 50)}...`
          );
        } catch (error) {
          console.error(`❌ Error generating question ${i + 1}:`, error);

          // Log the specific validation error for debugging
          if (
            error instanceof Error &&
            error.message.includes("validation failed")
          ) {
            console.error(`❌ Validation details:`, error);
          }
        }
      }

      console.log(
        `✅ Successfully generated ${savedQuestions.length} questions`
      );
      return savedQuestions;
    } catch (error) {
      console.error("❌ Error in generateNewQuestions:", error);
      return [];
    }
  }

  /**
   * Infer difficulty level from concepts
   */
  private inferDifficulty(concepts: IConcept[]): QuestionLevel {
    if (concepts.length === 0) return QuestionLevel.A1;

    // Use the highest difficulty among the concepts
    const difficulties = concepts.map((c) => c.difficulty);

    // Simple priority order
    const priorityOrder = [
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ];

    for (const level of priorityOrder.reverse()) {
      if (difficulties.includes(level)) {
        return level;
      }
    }

    return QuestionLevel.A1;
  }

  /**
   * Update question performance after use
   */
  async updateQuestionPerformance(
    questionId: string,
    isCorrect: boolean
  ): Promise<void> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(`Question ${questionId} not found for performance update`);
        return;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newCorrect / newTimesUsed;

      await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date(),
          },
        }
      );

      console.log(
        `✅ Updated question ${questionId} performance: ${(newSuccessRate * 100).toFixed(1)}% success rate`
      );
    } catch (error) {
      console.error(`❌ Error updating question performance:`, error);
    }
  }
}
