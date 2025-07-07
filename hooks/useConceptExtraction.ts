// hooks/useConceptExtraction.ts - FIXED VERSION
import { useState, useCallback } from "react";
import { ConceptReviewData, ReviewDecision } from "@/lib/conceptExtraction/types";

interface UseConceptExtractionReturn {
  isExtracting: boolean;
  isProcessingReview: boolean;
  extractionData: ConceptReviewData | null;
  error: string | null;
  extractConcepts: (courseId: number) => Promise<boolean>;
  processReviewDecisions: (decisions: ReviewDecision[]) => Promise<boolean>;
  clearError: () => void;
  resetExtraction: () => void;
}

/**
 * Custom hook for managing concept extraction workflow
 * Handles extraction, review data, and processing review decisions
 */
export function useConceptExtraction(): UseConceptExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [extractionData, setExtractionData] = useState<ConceptReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract concepts from a course
   * @param courseId ID of the course to extract concepts from
   * @returns Success status
   */
  const extractConcepts = useCallback(async (courseId: number): Promise<boolean> => {
    setIsExtracting(true);
    setError(null);

    try {
      console.log(`Starting concept extraction for course ${courseId}`);
      
      const response = await fetch("/api/concepts/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Concept extraction failed");
      }

      if (result.success) {
        console.log(`Successfully extracted ${result.data?.totalExtracted || 0} concepts`);
        setExtractionData(result.data);
        return true;
      } else {
        throw new Error(result.error || "Unknown extraction error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to extract concepts";
      console.error("Concept extraction error:", err);
      setError(errorMessage);
      return false;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Process human review decisions
   * @param decisions Array of review decisions
   * @returns Success status
   */
  const processReviewDecisions = useCallback(
    async (decisions: ReviewDecision[]): Promise<boolean> => {
      setIsProcessingReview(true);
      setError(null);

      try {
        console.log(`Processing ${decisions.length} review decisions`);
        
        const response = await fetch("/api/concepts/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decisions }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Review processing failed");
        }

        if (result.success) {
          console.log(`Successfully processed ${result.processedCount} decisions, created ${result.createdCount} concepts`);
          // IMPORTANT: Clear extraction data immediately after successful processing
          setExtractionData(null);
          return true;
        } else {
          throw new Error(result.error || "Unknown review processing error");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process review decisions";
        console.error("Review processing error:", err);
        setError(errorMessage);
        return false;
      } finally {
        setIsProcessingReview(false);
      }
    },
    []
  );

  /**
   * Clear current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset extraction state - ENHANCED
   */
  const resetExtraction = useCallback(() => {
    console.log("Resetting extraction state");
    setExtractionData(null);
    setError(null);
    setIsExtracting(false);
    setIsProcessingReview(false);
  }, []);

  return {
    isExtracting,
    isProcessingReview,
    extractionData,
    error,
    extractConcepts,
    processReviewDecisions,
    clearError,
    resetExtraction,
  };
}