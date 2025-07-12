import ConceptExtractionSession from "@/datamodels/conceptExtractionSession.model";

/**
 * Service for managing extraction session cleanup
 */
export class ExtractionSessionCleanupService {
  /**
   * Clean up old archived sessions
   * @param olderThanDays Remove sessions older than this many days (default: 30)
   * @returns Number of sessions deleted
   */
  static async cleanupArchivedSessions(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await ConceptExtractionSession.deleteMany({
      status: 'archived',
      updatedAt: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} archived extraction sessions older than ${olderThanDays} days`);
    return result.deletedCount;
  }

  /**
   * Clean up incomplete sessions (extracted but never reviewed)
   * @param olderThanDays Remove sessions older than this many days (default: 7)
   * @returns Number of sessions deleted
   */
  static async cleanupStaleExtractedSessions(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await ConceptExtractionSession.deleteMany({
      status: 'extracted',
      extractionDate: { $lt: cutoffDate },
      'reviewProgress.reviewedCount': 0
    });

    console.log(`Cleaned up ${result.deletedCount} stale extraction sessions older than ${olderThanDays} days`);
    return result.deletedCount;
  }

  /**
   * Archive old reviewed sessions
   * @param olderThanDays Archive sessions older than this many days (default: 90)
   * @returns Number of sessions archived
   */
  static async archiveOldReviewedSessions(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await ConceptExtractionSession.updateMany(
      {
        status: 'reviewed',
        updatedAt: { $lt: cutoffDate }
      },
      {
        $set: {
          status: 'archived',
          updatedAt: new Date()
        }
      }
    );

    console.log(`Archived ${result.modifiedCount} old reviewed sessions older than ${olderThanDays} days`);
    return result.modifiedCount;
  }

  /**
   * Get cleanup statistics
   * @returns Cleanup statistics
   */
  static async getCleanupStats(): Promise<{
    totalSessions: number;
    archivedSessions: number;
    staleSessions: number;
    oldReviewedSessions: number;
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalSessions,
      archivedSessions,
      staleSessions,
      oldReviewedSessions
    ] = await Promise.all([
      ConceptExtractionSession.countDocuments({}),
      ConceptExtractionSession.countDocuments({
        status: 'archived',
        updatedAt: { $lt: thirtyDaysAgo }
      }),
      ConceptExtractionSession.countDocuments({
        status: 'extracted',
        extractionDate: { $lt: sevenDaysAgo },
        'reviewProgress.reviewedCount': 0
      }),
      ConceptExtractionSession.countDocuments({
        status: 'reviewed',
        updatedAt: { $lt: ninetyDaysAgo }
      })
    ]);

    return {
      totalSessions,
      archivedSessions,
      staleSessions,
      oldReviewedSessions
    };
  }

  /**
   * Perform full cleanup routine
   * @param config Cleanup configuration
   * @returns Cleanup results
   */
  static async performFullCleanup(config: {
    archiveArchivedOlderThan?: number;
    removeStaleOlderThan?: number;
    archiveReviewedOlderThan?: number;
  } = {}): Promise<{
    archivedDeleted: number;
    staleDeleted: number;
    reviewedArchived: number;
  }> {
    const {
      archiveArchivedOlderThan = 30,
      removeStaleOlderThan = 7,
      archiveReviewedOlderThan = 90
    } = config;

    const [archivedDeleted, staleDeleted, reviewedArchived] = await Promise.all([
      this.cleanupArchivedSessions(archiveArchivedOlderThan),
      this.cleanupStaleExtractedSessions(removeStaleOlderThan),
      this.archiveOldReviewedSessions(archiveReviewedOlderThan)
    ]);

    return {
      archivedDeleted,
      staleDeleted,
      reviewedArchived
    };
  }
}