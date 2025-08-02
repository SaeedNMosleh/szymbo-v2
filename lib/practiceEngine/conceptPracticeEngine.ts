// lib/practiceEngine/conceptPracticeEngine.ts - ENHANCED VERSION WITH FALLBACK STRATEGY
import Concept, { IConcept } from "@/datamodels/concept.model";
import ConceptProgress, {
  IConceptProgress,
} from "@/datamodels/conceptProgress.model";
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import ConceptGroup, { IConceptGroup } from "@/datamodels/conceptGroup.model";
import { SRSCalculator } from "./srsCalculator";
import { ContextBuilder } from "./contextBuilder";
import { PracticeMode, QuestionType, QuestionLevel } from "@/lib/enum";
import { v4 as uuidv4 } from "uuid";

export interface ConceptSelection {
  concepts: IConcept[];
  rationale: string;
  priorities: Map<string, number>;
  groups?: IConceptGroup[];
  ungroupedConcepts?: IConcept[];
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
   * Select concepts for practice based on SRS algorithm and user performance with group integration
   */
  async selectPracticeConceptsForUser(
    userId: string = "default",
    maxConcepts: number = 5
  ): Promise<ConceptSelection> {
    try {
      console.log(
        `🎯 Selecting practice concepts for user: ${userId}, max: ${maxConcepts}`
      );

      // Get due and overdue concepts (SRS as single source of truth)
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

      // Calculate priorities and select top concepts (SRS-based)
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

      // Find shared groups for better organization
      const sharedGroups = await this.getGroupsForConcepts(conceptIds);

      // Organize concepts by groups and ungrouped
      const { /* groupedConcepts, */ ungroupedConcepts } =
        this.organizeConceptsByGroups(concepts, sharedGroups);

      // Generate rationale with group information
      const rationale = this.generateGroupAwareRationale(
        sortedProgress,
        overdueProgress.length,
        sharedGroups,
        ungroupedConcepts
      );

      console.log(`✅ Selected ${concepts.length} concepts for practice`);
      console.log(`📚 Found ${sharedGroups.length} shared groups`);

      return {
        concepts,
        rationale,
        priorities,
        groups: sharedGroups,
        ungroupedConcepts,
      };
    } catch (error) {
      console.error("❌ Error selecting practice concepts:", error);

      // Fallback to basic concept selection
      return await this.initializeNewUserPractice(userId, maxConcepts);
    }
  }

  /**
   * Select concepts from a specific course for practice
   */
  async selectConceptsFromCourse(
    courseId: number,
    maxConcepts: number = 5
  ): Promise<ConceptSelection> {
    try {
      console.log(
        `📖 Selecting concepts from course: ${courseId}, max: ${maxConcepts}`
      );

      // Import CourseConcept model
      const { default: CourseConcept } = await import(
        "@/datamodels/courseConcept.model"
      );

      // Get course-concept mappings
      const courseConceptMappings = await CourseConcept.find({
        courseId,
        isActive: true,
      })
        .sort({ confidence: -1 }) // Sort by extraction confidence
        .limit(maxConcepts);

      if (courseConceptMappings.length === 0) {
        console.log(`No concepts found for course ${courseId}`);
        return {
          concepts: [],
          rationale: `No concepts have been extracted from course ${courseId} yet`,
          priorities: new Map(),
        };
      }

      const conceptIds = courseConceptMappings.map((cc) => cc.conceptId);

      // Get full concept details
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      // Create priorities based on extraction confidence
      const priorities = new Map<string, number>();
      courseConceptMappings.forEach((cc) => {
        priorities.set(cc.conceptId, cc.confidence);
      });

      // Get course info for rationale
      const { default: Course } = await import("@/datamodels/course.model");
      const course = await Course.findOne({ courseId });
      const courseName = course
        ? `${course.courseType} course from ${course.date.toLocaleDateString()}`
        : `Course ${courseId}`;

      const rationale = `Practice session focused on concepts from ${courseName}`;

      console.log(
        `✅ Selected ${concepts.length} concepts from course ${courseId}`
      );

      return {
        concepts,
        rationale,
        priorities,
      };
    } catch (error) {
      console.error(
        `❌ Error selecting concepts from course ${courseId}:`,
        error
      );
      return {
        concepts: [],
        rationale: `Error loading concepts from course ${courseId}`,
        priorities: new Map(),
      };
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
   * Generate group-aware rationale for concept selection
   */
  private generateGroupAwareRationale(
    selectedProgress: IConceptProgress[],
    overdueCount: number,
    sharedGroups: IConceptGroup[],
    ungroupedConcepts: IConcept[]
  ): string {
    const baseRationale = this.generateSelectionRationale(
      selectedProgress,
      overdueCount
    );

    const groupInfo: string[] = [];

    if (sharedGroups.length > 0) {
      const groupNames = sharedGroups.map((g) => g.name);
      groupInfo.push(`organized by ${groupNames.join(", ")}`);
    }

    if (ungroupedConcepts.length > 0) {
      groupInfo.push(
        `${ungroupedConcepts.length} individual concept${ungroupedConcepts.length > 1 ? "s" : ""}`
      );
    }

    if (groupInfo.length > 0) {
      return `${baseRationale} (${groupInfo.join(" and ")})`;
    }

    return baseRationale;
  }

  /**
   * Get groups that contain the specified concepts
   */
  async getGroupsForConcepts(conceptIds: string[]): Promise<IConceptGroup[]> {
    try {
      if (conceptIds.length === 0) {
        return [];
      }

      const groups = await ConceptGroup.find({
        memberConcepts: { $in: conceptIds },
        isActive: true,
      }).lean();

      console.log(`Found ${groups.length} groups containing the concepts`);
      return groups as unknown as IConceptGroup[];
    } catch (error) {
      console.error("❌ Error getting groups for concepts:", error);
      return [];
    }
  }

  /**
   * Get all concepts in a specific group (for drill mode)
   */
  async getConceptsInGroup(groupId: string): Promise<IConcept[]> {
    try {
      const group = (await ConceptGroup.findOne({
        id: groupId,
        isActive: true,
      }).lean()) as IConceptGroup | null;

      if (!group) {
        console.log(`Group ${groupId} not found`);
        return [];
      }

      const concepts = await Concept.find({
        id: { $in: group.memberConcepts },
        isActive: true,
      }).lean();

      console.log(`Found ${concepts.length} concepts in group ${group.name}`);
      return concepts as unknown as IConcept[];
    } catch (error) {
      console.error(`❌ Error getting concepts in group ${groupId}:`, error);
      return [];
    }
  }

  /**
   * Organize concepts by their group membership
   */
  private organizeConceptsByGroups(
    concepts: IConcept[],
    groups: IConceptGroup[]
  ): { groupedConcepts: IConcept[]; ungroupedConcepts: IConcept[] } {
    const groupedConceptIds = new Set<string>();
    const ungroupedConcepts: IConcept[] = [];

    // Mark concepts that are in groups
    for (const group of groups) {
      for (const conceptId of group.memberConcepts) {
        groupedConceptIds.add(conceptId);
      }
    }

    // Separate ungrouped concepts
    for (const concept of concepts) {
      if (!groupedConceptIds.has(concept.id)) {
        ungroupedConcepts.push(concept);
      }
    }

    const groupedConcepts = concepts.filter((c) => groupedConceptIds.has(c.id));

    return { groupedConcepts, ungroupedConcepts };
  }

  /**
   * Enhanced question retrieval with strict drill mode filtering
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
        if (mode === PracticeMode.DRILL) {
          console.log(
            "❌ DRILL: No concepts provided - cannot drill without target concepts"
          );
          return [];
        }
        console.log(
          "No concepts provided, using fallback strategy for NORMAL mode"
        );
        return await this.getFallbackQuestions([], mode, maxQuestions);
      }

      // Step 1: Get questions with appropriate filtering based on mode
      const preMadeQuestions =
        mode === PracticeMode.DRILL
          ? await this.getStrictDrillQuestions(conceptIds, maxQuestions)
          : await this.getQuestionBankQuestions(conceptIds, maxQuestions);

      // Step 2: If insufficient questions and mode allows generation
      if (preMadeQuestions.length < maxQuestions) {
        const needed = maxQuestions - preMadeQuestions.length;

        if (mode === PracticeMode.DRILL) {
          // DRILL mode: Only generate for the EXACT same concepts
          console.log(
            `🎯 DRILL: Found ${preMadeQuestions.length} strict questions for concepts: ${conceptIds.join(", ")}`
          );
          console.log(
            `🔄 DRILL: Generating ${needed} momentary questions for same concepts`
          );
          const generated = await this.generateNewQuestions(conceptIds, needed);
          const allQuestions = [...preMadeQuestions, ...generated];
          console.log(
            `✅ DRILL: ${preMadeQuestions.length} existing + ${generated.length} generated = ${allQuestions.length} total questions`
          );
          return allQuestions;
        } else {
          // NORMAL mode: Allow flexible generation and fallback
          const generated = await this.generateNewQuestions(conceptIds, needed);
          const allQuestions = [...preMadeQuestions, ...generated];
          console.log(
            `✅ NORMAL: Retrieved ${preMadeQuestions.length} pre-made + ${generated.length} generated questions`
          );
          return allQuestions;
        }
      }

      console.log(
        `✅ Retrieved ${preMadeQuestions.length} questions for ${mode} mode`
      );
      return preMadeQuestions;
    } catch (error) {
      console.error("❌ Error getting questions for concepts:", error);
      return [];
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
   * Fallback questions when no concepts are provided (NORMAL mode only)
   */
  private async getFallbackQuestions(
    conceptIds: string[],
    mode: PracticeMode,
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    if (mode === PracticeMode.DRILL) {
      console.log(
        `❌ DRILL: Fallback questions not allowed in drill mode - maintaining strict concept focus`
      );
      return [];
    }

    console.log(`🔄 Using fallback questions for mode: ${mode}`);

    try {
      // Get any available questions as fallback for NORMAL mode only
      const questions = await QuestionBank.find({
        isActive: true,
      })
        .sort({ createdDate: -1 })
        .limit(maxQuestions);

      return questions;
    } catch (error) {
      console.error("❌ Error in getFallbackQuestions:", error);
      return [];
    }
  }

  /**
   * Get questions from QuestionBank with proper prioritization (NORMAL mode)
   * Prioritizes: manual > generated > momentary
   */
  private async getQuestionBankQuestions(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    try {
      // First try to get non-momentary questions (manual and generated)
      const nonMomentaryQuestions = await QuestionBank.find({
        targetConcepts: { $in: conceptIds },
        isActive: true,
        source: { $in: ["manual", "generated"] },
      })
        .sort({
          source: 1, // manual comes before generated alphabetically
          timesUsed: 1,
          successRate: -1,
        })
        .limit(maxQuestions);

      // If we have enough non-momentary questions, return them
      if (nonMomentaryQuestions.length >= maxQuestions) {
        console.log(
          `✅ Using ${nonMomentaryQuestions.length} high-quality (non-momentary) questions`
        );
        return nonMomentaryQuestions;
      }

      // If we need more, supplement with momentary questions
      const remainingCount = maxQuestions - nonMomentaryQuestions.length;
      const momentaryQuestions = await QuestionBank.find({
        targetConcepts: { $in: conceptIds },
        isActive: true,
        source: "momentary",
      })
        .sort({ timesUsed: 1, successRate: -1 })
        .limit(remainingCount);

      const allQuestions = [...nonMomentaryQuestions, ...momentaryQuestions];
      console.log(
        `✅ Using ${nonMomentaryQuestions.length} high-quality + ${momentaryQuestions.length} momentary questions`
      );

      return allQuestions;
    } catch (error) {
      console.error("❌ Error getting QuestionBank questions:", error);
      return [];
    }
  }

  /**
   * Get questions with DRILL filtering - questions that target at least one drill concept
   * Relevance scoring adapts based on drill scope (single concept vs multi-concept course)
   */
  private async getStrictDrillQuestions(
    drillConceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    try {
      console.log(
        `🎯 DRILL: Getting questions that target drill concepts: ${drillConceptIds.join(", ")}`
      );

      // Get questions that target at least one of the drill concepts
      const drillQuestions = await QuestionBank.find({
        isActive: true,
        // Must target at least one of the drill concepts AND exclude empty arrays
        targetConcepts: {
          $in: drillConceptIds,
          $ne: [],
        },
      })
        .sort({
          source: 1, // manual > generated > momentary
          timesUsed: 1,
          successRate: -1,
        })
        .limit(maxQuestions * 2); // Get more to allow filtering by relevance

      // Determine drill type based on number of target concepts
      const isMultiConceptDrill = drillConceptIds.length > 1;
      const drillType = isMultiConceptDrill ? "COURSE" : "CONCEPT";

      console.log(
        `📊 DRILL: Detected ${drillType} drill mode (${drillConceptIds.length} target concepts)`
      );

      // Prioritize questions by drill concept relevance (different logic for course vs concept)
      const questionsByRelevance = drillQuestions.map((question) => {
        const drillConceptMatches = question.targetConcepts.filter(
          (conceptId: string) => drillConceptIds.includes(conceptId)
        ).length;

        const totalConcepts = question.targetConcepts.length;

        let relevanceScore: number;

        if (isMultiConceptDrill) {
          // COURSE DRILL: Higher score for questions covering MORE course concepts
          relevanceScore = drillConceptMatches / drillConceptIds.length; // Reward breadth of course coverage
        } else {
          // SINGLE CONCEPT DRILL: Higher score for questions MORE FOCUSED on the target concept
          relevanceScore = drillConceptMatches / totalConcepts; // Reward focus on target concept
        }

        return {
          question,
          drillConceptMatches,
          totalConcepts,
          relevanceScore,
          drillType,
        };
      });

      // Sort by relevance (different strategies for course vs concept drill)
      questionsByRelevance.sort((a, b) => {
        // First by relevance score (higher = better for both modes)
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Then by number of drill concept matches (more = better for both modes)
        if (b.drillConceptMatches !== a.drillConceptMatches) {
          return b.drillConceptMatches - a.drillConceptMatches;
        }

        // Final tiebreaker differs by drill type
        if (isMultiConceptDrill) {
          // COURSE DRILL: Prefer questions with more total concepts (comprehensive)
          return b.totalConcepts - a.totalConcepts;
        } else {
          // CONCEPT DRILL: Prefer questions with fewer total concepts (focused)
          return a.totalConcepts - b.totalConcepts;
        }
      });

      // Take the best questions up to the limit
      const bestDrillQuestions = questionsByRelevance
        .slice(0, maxQuestions)
        .map((item) => item.question);

      console.log(
        `🎯 DRILL: Found ${bestDrillQuestions.length} questions for ${drillType} drill`
      );

      // Log drill-specific metrics
      if (bestDrillQuestions.length > 0) {
        const conceptCoverage = new Set();
        const relevanceStats = questionsByRelevance
          .slice(0, maxQuestions)
          .map((item) => {
            item.question.targetConcepts.forEach((c: string) =>
              conceptCoverage.add(c)
            );

            if (isMultiConceptDrill) {
              // COURSE DRILL: Show coverage of course concepts
              return `${(item.relevanceScore * 100).toFixed(0)}% coverage (${item.drillConceptMatches}/${drillConceptIds.length} course concepts)`;
            } else {
              // CONCEPT DRILL: Show focus on target concept
              return `${(item.relevanceScore * 100).toFixed(0)}% focus (${item.drillConceptMatches}/${item.totalConcepts} total concepts)`;
            }
          });

        console.log(
          `📊 DRILL: Questions cover ${conceptCoverage.size} total concepts (${drillConceptIds.length} targeted)`
        );

        if (isMultiConceptDrill) {
          console.log(`📊 COURSE DRILL: ${relevanceStats.join(", ")}`);
        } else {
          console.log(`📊 CONCEPT DRILL: ${relevanceStats.join(", ")}`);
        }
      }

      return bestDrillQuestions;
    } catch (error) {
      console.error("❌ Error getting drill questions:", error);
      return [];
    }
  }

  /**
   * Get drill concepts by weakness (low performance)
   */
  async getDrillConceptsByWeakness(
    userId: string = "default",
    maxConcepts: number = 10
  ): Promise<string[]> {
    try {
      // Get all active concepts
      const allConcepts = await Concept.find({
        isActive: true,
      })
        .select("id")
        .lean();

      const allConceptIds = allConcepts.map((c) => c.id);

      // Get progress for all concepts (if any)
      const progressMap = new Map<string, IConceptProgress>();
      const allProgress = await ConceptProgress.find({
        userId,
        isActive: true,
        conceptId: { $in: allConceptIds },
      });

      allProgress.forEach((progress) => {
        progressMap.set(progress.conceptId, progress);
      });

      // Create weakness score for each concept
      const conceptsWithWeakness = allConceptIds.map((conceptId) => {
        const progress = progressMap.get(conceptId);

        let weaknessScore = 0;

        if (!progress) {
          // No practice history = weakest (highest score)
          weaknessScore = 1000;
        } else {
          // Calculate weakness based on multiple factors
          // Lower mastery = higher weakness
          const masteryWeakness = (1 - progress.masteryLevel) * 100;

          // Lower success rate = higher weakness
          const successWeakness = (1 - progress.successRate) * 100;

          // More incorrect attempts = higher weakness
          const incorrectAttempts = Math.round(
            progress.totalAttempts * (1 - progress.successRate)
          );
          const incorrectWeakness = Math.min(incorrectAttempts * 10, 100);

          // Combine factors (mastery is most important)
          weaknessScore =
            masteryWeakness * 0.5 +
            successWeakness * 0.3 +
            incorrectWeakness * 0.2;
        }

        return {
          conceptId,
          weaknessScore,
          progress,
        };
      });

      // Sort by weakness (highest weakness score first)
      conceptsWithWeakness.sort((a, b) => b.weaknessScore - a.weaknessScore);

      // Limit results if maxConcepts is specified and > 0
      const limitedConcepts =
        maxConcepts > 0
          ? conceptsWithWeakness.slice(0, maxConcepts)
          : conceptsWithWeakness;

      console.log(
        `🎯 Drill weakness selection: ${limitedConcepts.length} concepts sorted by weakness`
      );
      console.log(
        `   - ${conceptsWithWeakness.filter((c) => c.weaknessScore >= 1000).length} concepts with no practice history`
      );
      console.log(
        `   - ${conceptsWithWeakness.filter((c) => c.weaknessScore < 1000).length} concepts with practice history`
      );

      return limitedConcepts.map((c) => c.conceptId);
    } catch (error) {
      console.error("❌ Error getting drill concepts by weakness:", error);
      return [];
    }
  }

  /**
   * Get drill concepts by course
   */
  async getDrillConceptsByCourse(
    courseId: number,
    maxConcepts: number = 10
  ): Promise<string[]> {
    try {
      console.log(`🎯 DRILL: Looking for concepts in course ${courseId}`);

      const { default: CourseConcept } = await import(
        "@/datamodels/courseConcept.model"
      );

      // First check if CourseConcept table has ANY data
      const totalCourseConcepts = await CourseConcept.countDocuments();
      console.log(
        `📊 DRILL: Total CourseConcept records in database: ${totalCourseConcepts}`
      );

      const courseConceptMappings = await CourseConcept.find({
        courseId,
        isActive: true,
      })
        .sort({ confidence: -1 })
        .limit(maxConcepts);

      console.log(
        `📋 DRILL: Found ${courseConceptMappings.length} course-concept mappings for course ${courseId}`
      );

      if (courseConceptMappings.length > 0) {
        console.log(
          `✅ DRILL: Course ${courseId} concepts:`,
          courseConceptMappings.map((cc) => ({
            conceptId: cc.conceptId,
            confidence: cc.confidence,
          }))
        );
      }

      return courseConceptMappings.map((cc) => cc.conceptId);
    } catch (error) {
      console.error(
        `❌ Error getting drill concepts for course ${courseId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get drill concepts by multiple courses (for multi-course drilling)
   */
  async getDrillConceptsByCourses(
    courseIds: number[],
    maxConcepts: number = 10
  ): Promise<string[]> {
    try {
      const { default: CourseConcept } = await import(
        "@/datamodels/courseConcept.model"
      );

      const courseConceptMappings = await CourseConcept.find({
        courseId: { $in: courseIds },
        isActive: true,
      })
        .sort({ confidence: -1 })
        .limit(maxConcepts);

      return courseConceptMappings.map((cc) => cc.conceptId);
    } catch (error) {
      console.error(
        `❌ Error getting drill concepts for courses ${courseIds.join(", ")}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get drill concepts by group (for manual group practice)
   */
  async getDrillConceptsByGroup(
    groupId: string,
    maxConcepts: number = 20
  ): Promise<string[]> {
    try {
      const concepts = await this.getConceptsInGroup(groupId);
      const conceptIds = concepts.map((c) => c.id);

      // Limit to maxConcepts if needed
      return conceptIds.slice(0, maxConcepts);
    } catch (error) {
      console.error(
        `❌ Error getting drill concepts for group ${groupId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get drill concepts by multiple groups
   */
  async getDrillConceptsByGroups(
    groupIds: string[],
    maxConcepts: number = 20
  ): Promise<string[]> {
    try {
      const allConceptIds = new Set<string>();

      for (const groupId of groupIds) {
        const conceptIds = await this.getDrillConceptsByGroup(
          groupId,
          maxConcepts
        );
        conceptIds.forEach((id) => allConceptIds.add(id));
      }

      const uniqueConceptIds = Array.from(allConceptIds);
      return uniqueConceptIds.slice(0, maxConcepts);
    } catch (error) {
      console.error(
        `❌ Error getting drill concepts for groups ${groupIds.join(", ")}:`,
        error
      );
      return [];
    }
  }

  /**
   * Select concepts for drill mode with group and course options
   */
  async selectDrillConcepts(options: {
    mode: "weakness" | "course" | "group" | "groups";
    userId?: string;
    courseId?: number;
    groupId?: string;
    groupIds?: string[];
    maxConcepts?: number;
  }): Promise<ConceptSelection> {
    const {
      mode,
      userId = "default",
      courseId,
      groupId,
      groupIds,
      maxConcepts = 10,
    } = options;

    try {
      let conceptIds: string[] = [];
      let rationale = "";

      switch (mode) {
        case "weakness":
          conceptIds = await this.getDrillConceptsByWeakness(
            userId,
            maxConcepts
          );
          rationale =
            "Drill session focusing on concepts that need more practice";
          break;

        case "course":
          if (courseId) {
            conceptIds = await this.getDrillConceptsByCourse(
              courseId,
              maxConcepts
            );
            rationale = `Drill session for Course ${courseId}`;
          }
          break;

        case "group":
          if (groupId) {
            conceptIds = await this.getDrillConceptsByGroup(
              groupId,
              maxConcepts
            );
            const group = (await ConceptGroup.findOne({
              id: groupId,
            }).lean()) as IConceptGroup | null;
            rationale = `Drill session for group: ${group?.name || groupId}`;
          }
          break;

        case "groups":
          if (groupIds && groupIds.length > 0) {
            conceptIds = await this.getDrillConceptsByGroups(
              groupIds,
              maxConcepts
            );
            const groups = await ConceptGroup.find({
              id: { $in: groupIds },
            }).lean();
            const groupNames = groups.map((g) => g.name).join(", ");
            rationale = `Drill session for groups: ${groupNames}`;
          }
          break;
      }

      if (conceptIds.length === 0) {
        return {
          concepts: [],
          rationale: `No concepts found for drill mode: ${mode}`,
          priorities: new Map(),
        };
      }

      // Get full concept details
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      // For drill mode, create equal priorities
      const priorities = new Map<string, number>();
      concepts.forEach((concept) => {
        priorities.set(concept.id, 1.0);
      });

      console.log(
        `✅ Selected ${concepts.length} concepts for drill mode: ${mode}`
      );

      return {
        concepts,
        rationale,
        priorities,
      };
    } catch (error) {
      console.error(
        `❌ Error selecting drill concepts for mode ${mode}:`,
        error
      );
      return {
        concepts: [],
        rationale: `Error loading concepts for drill mode: ${mode}`,
        priorities: new Map(),
      };
    }
  }

  /**
   * Generate new momentary questions for concepts (limited to specific types)
   */
  private async generateNewQuestions(
    conceptIds: string[],
    count: number
  ): Promise<IQuestionBank[]> {
    if (count <= 0) return [];

    console.log(
      `🎯 Generating ${count} new momentary questions for concepts: ${conceptIds.join(", ")}`
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

      // Import the question generation service
      const { QuestionLLMService } = await import(
        "@/lib/questionGeneration/questionLLM"
      );
      const questionLLM = new QuestionLLMService();

      // Define allowed question types for momentary questions
      const allowedTypes = [
        QuestionType.BASIC_CLOZE,
        QuestionType.MULTI_CLOZE,
        QuestionType.VOCAB_CHOICE,
        QuestionType.MULTI_SELECT,
      ];

      const savedQuestions: IQuestionBank[] = [];
      const questionsPerType = Math.ceil(count / allowedTypes.length);

      // Generate questions for each allowed type
      for (const questionType of allowedTypes) {
        if (savedQuestions.length >= count) break;

        try {
          const remainingCount = Math.min(
            questionsPerType,
            count - savedQuestions.length
          );

          const generatedQuestions = await questionLLM.generateQuestions({
            concepts,
            questionType,
            difficulty: this.inferDifficulty(concepts),
            quantity: remainingCount,
            specialInstructions:
              "Generate high-quality questions for immediate practice use",
          });

          // Validate and filter questions based on type requirements
          for (const genQ of generatedQuestions) {
            if (savedQuestions.length >= count) break;

            // Validate that multi-choice questions have proper options
            if (
              questionType === QuestionType.VOCAB_CHOICE ||
              questionType === QuestionType.MULTI_SELECT
            ) {
              if (!genQ.options || genQ.options.length < 2) {
                console.log(
                  `❌ Dropping ${questionType} question without proper options`
                );
                continue;
              }
            }

            // Create question with momentary source
            const questionData: IQuestionBank = {
              id: uuidv4(),
              question: genQ.question,
              correctAnswer: genQ.correctAnswer,
              questionType: genQ.questionType,
              targetConcepts: conceptIds,
              difficulty: genQ.difficulty,
              timesUsed: 0,
              successRate: 0,
              lastUsed: new Date(),
              createdDate: new Date(),
              isActive: true,
              source: "momentary",
              options: genQ.options,
              audioUrl: genQ.audioUrl,
              imageUrl: genQ.imageUrl,
            };

            // Save directly to database
            const savedQuestion = await QuestionBank.create(questionData);
            savedQuestions.push(savedQuestion.toObject());
            console.log(
              `✅ Generated momentary ${questionType} question: ${genQ.question.substring(0, 50)}...`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error generating ${questionType} questions:`,
            error
          );
        }
      }

      console.log(
        `✅ Successfully generated ${savedQuestions.length} momentary questions`
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
   * Detect appropriate question type based on question content patterns
   */
  private detectQuestionType(questionText: string): QuestionType {
    const text = questionText.toLowerCase().trim();

    // Translation patterns
    if (
      text.includes("translate") ||
      text.includes("przetłumacz") ||
      text.includes("how do you say") ||
      text.includes("jak powiedzieć")
    ) {
      const type =
        text.includes("polish") || text.includes("polski")
          ? QuestionType.TRANSLATION_EN
          : QuestionType.TRANSLATION_PL;
      console.log(
        `🎯 Question type detection: "${text.substring(0, 50)}..." -> ${type} (translation)`
      );
      return type;
    }

    // Fill-in-the-blank / Cloze patterns
    if (
      text.includes("___") ||
      text.includes("[") ||
      text.includes("blank") ||
      text.includes("complete") ||
      text.includes("uzupełnij")
    ) {
      // Multiple blanks = multi-cloze, single blank = basic cloze
      const blankCount = (text.match(/___|\[.*?\]/g) || []).length;
      const type =
        blankCount > 1 ? QuestionType.MULTI_CLOZE : QuestionType.BASIC_CLOZE;
      console.log(
        `🎯 Question type detection: "${text.substring(0, 50)}..." -> ${type} (cloze, ${blankCount} blanks)`
      );
      return type;
    }

    // Multiple choice patterns
    if (
      text.includes("choose") ||
      text.includes("select") ||
      text.includes("wybierz") ||
      text.includes("a)") ||
      text.includes("1)") ||
      text.includes("which")
    ) {
      return QuestionType.VOCAB_CHOICE;
    }

    // Conjugation patterns
    if (
      text.includes("conjugate") ||
      text.includes("odmień") ||
      text.includes("verb form") ||
      text.includes("correct form") ||
      text.includes("właściwą formę")
    ) {
      return QuestionType.CASE_TRANSFORM;
    }

    // Word arrangement patterns
    if (
      text.includes("arrange") ||
      text.includes("order") ||
      text.includes("ułóż") ||
      text.includes("put in order") ||
      text.includes("rearrange")
    ) {
      return QuestionType.WORD_ARRANGEMENT;
    }

    // Sentence transformation patterns
    if (
      text.includes("rewrite") ||
      text.includes("transform") ||
      text.includes("przepisz") ||
      text.includes("change") ||
      text.includes("convert")
    ) {
      return QuestionType.SENTENCE_TRANSFORM;
    }

    // Cultural context patterns
    if (
      text.includes("culture") ||
      text.includes("tradition") ||
      text.includes("kultura") ||
      text.includes("customs") ||
      text.includes("społeczeństwo")
    ) {
      return QuestionType.CULTURAL_CONTEXT;
    }

    // Default to Q&A for open-ended questions
    console.log(`🎯 Question type detection: "${text}" -> Q_A (default)`);
    return QuestionType.Q_A;
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
