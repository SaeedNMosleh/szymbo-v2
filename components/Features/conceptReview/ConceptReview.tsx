// components/Features/conceptReview/ConceptReview.tsx
"use client"

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConceptExtraction } from "@/hooks/useConceptExtraction";
import {
  ReviewDecision,
  ExtractedConcept,
} from "@/lib/conceptExtraction/types";

interface ConceptReviewProps {
  courseId: number;
  onReviewComplete?: () => void;
}

/**
 * Component for reviewing and approving extracted concepts
 * Provides human-in-the-loop concept validation workflow
 */
export function ConceptReview({
  courseId,
  onReviewComplete,
}: ConceptReviewProps) {
  const {
    isExtracting,
    isProcessingReview,
    extractionData,
    error,
    extractConcepts,
    processReviewDecisions,
    clearError,
    resetExtraction,
  } = useConceptExtraction();

  const [reviewDecisions, setReviewDecisions] = useState<ReviewDecision[]>([]);

  /**
   * Handle concept extraction trigger
   */
  const handleExtractConcepts = useCallback(async () => {
    const success = await extractConcepts(courseId);
    if (success) {
      // Reset review decisions when new extraction completes
      setReviewDecisions([]);
    }
  }, [courseId, extractConcepts]);

  /**
   * Handle individual concept decision
   */
  const handleConceptDecision = useCallback(
    (concept: ExtractedConcept, action: "approve" | "reject") => {
      const decision: ReviewDecision = {
        action,
        extractedConcept: concept,
        courseId,
      };

      setReviewDecisions((prev) => {
        // Remove any existing decision for this concept
        const filtered = prev.filter(
          (d) => d.extractedConcept.name !== concept.name
        );
        // Add new decision if not rejecting
        if (action === "approve") {
          return [...filtered, decision];
        }
        return filtered;
      });
    },
    [courseId]
  );

  /**
   * Handle review submission - FIXED
   */
  const handleSubmitReview = useCallback(async () => {
    if (reviewDecisions.length === 0) {
      return;
    }

    const success = await processReviewDecisions(reviewDecisions);
    if (success) {
      setReviewDecisions([]);
      // Force reset extraction data to clear the UI
      resetExtraction();
      onReviewComplete?.();
    }
  }, [reviewDecisions, processReviewDecisions, onReviewComplete, resetExtraction]);

  /**
   * Check if concept has a decision
   */
  const getConceptDecision = useCallback(
    (conceptName: string) => {
      return reviewDecisions.find(
        (d) => d.extractedConcept.name === conceptName
      );
    },
    [reviewDecisions]
  );

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-red-600">{error}</p>
          <div className="flex gap-2">
            <Button onClick={clearError} variant="outline">
              Clear Error
            </Button>
            <Button onClick={resetExtraction}>Reset</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Concept Review - Course {courseId}</CardTitle>
      </CardHeader>
      <CardContent>
        {!extractionData ? (
          <div className="py-8 text-center">
            <p className="mb-4">
              Extract concepts from this course to begin review process.
            </p>
            <Button
              onClick={handleExtractConcepts}
              disabled={isExtracting}
              className="w-48"
            >
              {isExtracting ? "Extracting..." : "Extract Concepts"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Extraction Summary */}
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold">Extraction Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Concepts: {extractionData.totalExtracted}</div>
                <div>High Confidence: {extractionData.highConfidenceCount}</div>
              </div>
            </div>

            {/* Concept Review List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {extractionData.extractedConcepts.map((concept, index) => {
                  const decision = getConceptDecision(concept.name);
                  const isApproved = decision?.action === "approve";

                  return (
                    <Card
                      key={index}
                      className={`p-4 ${isApproved ? "border-green-500 bg-green-50" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              {concept.name}
                            </h4>
                            <p className="text-sm capitalize text-gray-600">
                              {concept.category} • Confidence:{" "}
                              {(concept.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isApproved ? "default" : "outline"}
                              onClick={() =>
                                handleConceptDecision(concept, "approve")
                              }
                            >
                              {isApproved ? "✓ Approved" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleConceptDecision(concept, "reject")
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-700">{concept.description}</p>

                        {concept.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Examples:
                            </p>
                            <ul className="list-inside list-disc text-sm text-gray-600">
                              {concept.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Source: {concept.sourceContent}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Review Actions */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                {reviewDecisions.length} concept(s) approved for creation
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetExtraction}
                  variant="outline"
                  disabled={isProcessingReview}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewDecisions.length === 0 || isProcessingReview}
                >
                  {isProcessingReview ? "Processing..." : "Create Concepts"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}