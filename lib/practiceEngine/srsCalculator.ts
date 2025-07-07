// lib/practiceEngine/srsCalculator.ts
import ConceptProgress, { IConceptProgress } from "@/datamodels/conceptProgress.model";

export interface SRSParameters {
  easinessFactor: number;
  intervalDays: number;
  consecutiveCorrect: number;
  isCorrect: boolean;
  responseTime: number;
  difficultyRating?: number; // user-provided difficulty (1-5)
}

export interface SRSResult {
  nextReview: Date;
  newEasinessFactor: number;
  newIntervalDays: number;
  masteryLevelChange: number;
}

export class SRSCalculator {
  private static readonly MIN_EASINESS_FACTOR = 1.3;
  private static readonly MAX_EASINESS_FACTOR = 2.5;
  private static readonly INITIAL_INTERVAL = 1;
  private static readonly MAX_INTERVAL = 365; // 1 year max

  /**
   * Calculate next review date based on performance
   */
  static calculateNextReview(
    conceptProgress: IConceptProgress,
    isCorrect: boolean,
    responseTime: number = 0,
    difficultyRating?: number
  ): SRSResult {
    const params: SRSParameters = {
      easinessFactor: conceptProgress.easinessFactor,
      intervalDays: conceptProgress.intervalDays,
      consecutiveCorrect: conceptProgress.consecutiveCorrect,
      isCorrect,
      responseTime,
      difficultyRating,
    };

    return this.calculateSRS(params);
  }

  /**
   * SM-2 Algorithm implementation with modifications
   */
  private static calculateSRS(params: SRSParameters): SRSResult {
    let newEasinessFactor = params.easinessFactor;
    let newIntervalDays = params.intervalDays;
    let consecutiveCorrect = params.consecutiveCorrect;
    let masteryLevelChange = 0;

    if (params.isCorrect) {
      consecutiveCorrect++;
      masteryLevelChange = 0.1; // Increase mastery

      // Calculate new interval based on SM-2
      if (consecutiveCorrect === 1) {
        newIntervalDays = 1;
      } else if (consecutiveCorrect === 2) {
        newIntervalDays = 6;
      } else {
        newIntervalDays = Math.round(params.intervalDays * newEasinessFactor);
      }

      // Adjust easiness factor slightly upward for good performance
      if (params.responseTime < 5000) {
        // Fast response
        newEasinessFactor += 0.05;
      }

      // User difficulty rating adjustment
      if (params.difficultyRating) {
        const adjustment = (3 - params.difficultyRating) * 0.05; // Rating 1=hard, 5=easy
        newEasinessFactor += adjustment;
      }
    } else {
      consecutiveCorrect = 0;
      masteryLevelChange = -0.2; // Decrease mastery
      newIntervalDays = 1; // Reset to beginning

      // Decrease easiness factor for wrong answers
      newEasinessFactor -= 0.2;

      // Additional penalty for slow wrong answers
      if (params.responseTime > 15000) {
        newEasinessFactor -= 0.1;
      }
    }

    // Clamp easiness factor
    newEasinessFactor = Math.max(
      this.MIN_EASINESS_FACTOR,
      Math.min(this.MAX_EASINESS_FACTOR, newEasinessFactor)
    );

    // Clamp interval
    newIntervalDays = Math.max(1, Math.min(this.MAX_INTERVAL, newIntervalDays));

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newIntervalDays);

    return {
      nextReview,
      newEasinessFactor,
      newIntervalDays,
      masteryLevelChange,
    };
  }

  /**
   * Get concepts due for review today
   */
  static async getConceptsDueForReview(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await ConceptProgress.find({
      userId,
      nextReview: { $lte: today },
      isActive: true,
    }).sort({ nextReview: 1 }); // Oldest due first
  }

  /**
   * Get overdue concepts (past due date)
   */
  static async getOverdueConcepts(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    return await ConceptProgress.find({
      userId,
      nextReview: { $lt: yesterday },
      isActive: true,
    }).sort({ nextReview: 1 });
  }

  /**
   * Calculate concept priority score for practice selection
   */
  static calculatePriority(conceptProgress: IConceptProgress): number {
    const now = new Date();
    const daysSinceReview = Math.floor(
      (now.getTime() - conceptProgress.nextReview.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let priority = 0;

    // Overdue concepts get highest priority
    if (daysSinceReview > 0) {
      priority += daysSinceReview * 2; // 2 points per overdue day
    }

    // Low mastery concepts get higher priority
    priority += (1 - conceptProgress.masteryLevel) * 10;

    // Low success rate concepts get higher priority
    priority += (1 - conceptProgress.successRate) * 5;

    // Concepts with low easiness factor (hard concepts) get slight priority
    priority += (2.5 - conceptProgress.easinessFactor) * 2;

    return Math.max(0, priority);
  }

  /**
   * Initialize concept progress for new concept
   */
  static async initializeConceptProgress(
    conceptId: string,
    userId: string = "default"
  ): Promise<IConceptProgress> {
    const existing = await ConceptProgress.findOne({ userId, conceptId });
    if (existing) {
      return existing;
    }

    const newProgress = new ConceptProgress({
      userId,
      conceptId,
      masteryLevel: 0,
      lastPracticed: null,
      nextReview: new Date(), // Due immediately
      successRate: 0,
      totalAttempts: 0,
      consecutiveCorrect: 0,
      easinessFactor: 2.5, // SM-2 default
      intervalDays: 1,
      isActive: true,
    });

    return await newProgress.save();
  }

  /**
   * Update concept progress after practice
   */
  static async updateConceptProgress(
    conceptId: string,
    isCorrect: boolean,
    responseTime: number,
    userId: string = "default",
    difficultyRating?: number
  ): Promise<IConceptProgress> {
    let progress = await ConceptProgress.findOne({ userId, conceptId });

    if (!progress) {
      progress = await this.initializeConceptProgress(conceptId, userId);
    }

    // Calculate SRS updates
    const srsResult = this.calculateNextReview(
      progress,
      isCorrect,
      responseTime,
      difficultyRating
    );

    // Update progress
    progress.lastPracticed = new Date();
    progress.nextReview = srsResult.nextReview;
    progress.easinessFactor = srsResult.newEasinessFactor;
    progress.intervalDays = srsResult.newIntervalDays;
    progress.totalAttempts += 1;

    if (isCorrect) {
      progress.consecutiveCorrect += 1;
    } else {
      progress.consecutiveCorrect = 0;
    }

    // Update mastery level (0-1 scale)
    progress.masteryLevel = Math.max(
      0,
      Math.min(1, progress.masteryLevel + srsResult.masteryLevelChange)
    );

    // Update success rate
    const correctAnswers = isCorrect
      ? progress.successRate * (progress.totalAttempts - 1) + 1
      : progress.successRate * (progress.totalAttempts - 1);
    progress.successRate = correctAnswers / progress.totalAttempts;

    return await progress.save();
  }
}
