"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IConceptExtractionSession,
  ExtractedConcept,
  ReviewDecision,
  SimilarityMatch,
  ExtractedConceptSchema,
} from "@/datamodels/conceptExtractionSession.model";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

interface EnhancedConceptReviewProps {
  courseId: number;
  onReviewComplete?: () => void;
}

interface ConceptDecisionState {
  action: "approve" | "link" | "edit" | "reject" | "merge" | "manual_add";
  editedConcept?: Partial<ExtractedConcept>;
  targetConceptId?: string;
  mergeData?: {
    primaryConceptId: string;
    additionalData: {
      examples?: string[];
      description?: string;
    };
  };
  impliesApproval?: boolean; // UI flag for link/merge actions
}

const EditConceptSchema = ExtractedConceptSchema.partial();

export function EnhancedConceptReview({
  courseId,
  onReviewComplete,
}: EnhancedConceptReviewProps) {
  const [session, setSession] = useState<IConceptExtractionSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Map<string, ConceptDecisionState>>(
    new Map()
  );
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [showSimilarities, setShowSimilarities] = useState<
    Map<string, boolean>
  >(new Map());
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form for editing concepts
  const editForm = useForm({
    resolver: zodResolver(EditConceptSchema),
    defaultValues: {
      name: "",
      category: ConceptCategory.VOCABULARY,
      description: "",
      examples: [""],
      sourceContent: "",
      confidence: 0,
      suggestedDifficulty: QuestionLevel.EASY,
    },
  });

  // Form for manual concept addition
  const manualForm = useForm({
    resolver: zodResolver(ExtractedConceptSchema),
    defaultValues: {
      name: "",
      category: ConceptCategory.VOCABULARY,
      description: "",
      examples: [""],
      sourceContent: "Manual addition",
      confidence: 1.0,
      suggestedDifficulty: QuestionLevel.MEDIUM,
    },
  });

  const loadExtractionSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get latest extraction session for course - include both extracted and in_review status
      const response = await fetch(
        `/api/extraction-sessions?courseId=${courseId}&limit=1`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      if (data.data?.sessions && data.data.sessions.length > 0) {
        setSession(data.data.sessions[0]);

        // Load existing decisions if any
        const existingDecisions = new Map<string, ConceptDecisionState>();
        data.data.sessions[0].reviewProgress.decisions.forEach(
          (decision: ReviewDecision) => {
            existingDecisions.set(decision.extractedConcept.name, {
              action: decision.action,
              editedConcept: decision.editedConcept,
              targetConceptId: decision.targetConceptId,
              mergeData: decision.mergeData,
            });
          }
        );
        setDecisions(existingDecisions);
      } else {
        // No extraction session found, try to get from the old concept extraction system
        // Try fallback to legacy system

        try {
          // Try to get review data using the fallback API
          const extractorResponse = await fetch(
            "/api/concepts/prepare-review",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId }),
            }
          );

          if (extractorResponse.ok) {
            const reviewData = await extractorResponse.json();
            console.log("Legacy system reviewData:", reviewData);

            // Convert old format to new session format
            console.log(
              "Converting legacy reviewData to session format:",
              reviewData
            );

            const extractedConcepts = reviewData.data?.extractedConcepts || [];
            console.log(
              "Extracted concepts from reviewData:",
              extractedConcepts
            );

            const mockSession: IConceptExtractionSession = {
              id: `legacy_${courseId}_${Date.now()}`,
              courseId,
              courseName: reviewData.data?.courseName || `Course ${courseId}`,
              extractionDate: new Date(),
              status: "extracted",
              extractedConcepts,
              similarityMatches: reviewData.data?.similarityMatches
                ? Object.entries(reviewData.data.similarityMatches).map(
                    ([name, matches]: [string, unknown]) => ({
                      extractedConceptName: name,
                      matches: Array.isArray(matches) ? matches : [],
                    })
                  )
                : [],
              reviewProgress: {
                totalConcepts: extractedConcepts.length,
                reviewedCount: 0,
                decisions: [],
                isDraft: true,
              },
              extractionMetadata: {
                llmModel: "legacy",
                totalProcessingTime: 0,
                extractionConfidence: 0.8,
                sourceContentLength: 0,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("Created mock session:", mockSession);
            setSession(mockSession);
            return;
          }
        } catch (legacyError) {
          console.error("Failed to load from legacy system:", legacyError);
        }

        setError(
          "No extraction session found for this course. Please extract concepts first."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load extraction session"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Load extraction session on mount
  useEffect(() => {
    loadExtractionSession();
  }, [loadExtractionSession]);

  const handleConceptDecision = useCallback(
    (
      conceptName: string,
      action: ConceptDecisionState["action"],
      additionalData?: {
        targetConceptId?: string;
        mergeData?: {
          primaryConceptId: string;
          additionalData: {
            examples?: string[];
            description?: string;
          };
        };
        editedConcept?: Partial<ExtractedConcept>;
      }
    ) => {
      setDecisions((prev) => {
        const newDecisions = new Map(prev);
        const currentDecision = newDecisions.get(conceptName);

        // Toggle behavior: if same action is clicked again, remove the decision
        // Special case: if approve is clicked while link/merge is active, toggle off link/merge
        let shouldToggle = false;

        if (
          action === "approve" &&
          currentDecision &&
          (currentDecision.action === "link" ||
            currentDecision.action === "merge")
        ) {
          // Clicking approve while link/merge is active should clear the link/merge
          shouldToggle = true;
        } else if (currentDecision && currentDecision.action === action) {
          if (action === "link") {
            shouldToggle =
              currentDecision.targetConceptId ===
              additionalData?.targetConceptId;
          } else if (action === "merge") {
            shouldToggle =
              currentDecision.mergeData?.primaryConceptId ===
              additionalData?.mergeData?.primaryConceptId;
          } else {
            shouldToggle = true; // For approve, reject, edit actions
          }
        }

        if (shouldToggle) {
          newDecisions.delete(conceptName);
        } else {
          // UI Logic: Link/Merge implies approval for user experience
          if (action === "link" || action === "merge") {
            newDecisions.set(conceptName, {
              action,
              ...additionalData,
              // Add UI flag to show this should appear approved
              impliesApproval: true,
            });
          }
          // UI Logic: Reject clears any existing link/merge decisions
          else if (action === "reject") {
            newDecisions.set(conceptName, {
              action,
              ...additionalData,
            });
          }
          // Standard actions
          else {
            newDecisions.set(conceptName, {
              action,
              ...additionalData,
            });
          }
        }

        return newDecisions;
      });
    },
    []
  );

  const handleEditConcept = useCallback(
    (conceptName: string) => {
      const concept = session?.extractedConcepts.find(
        (c) => c.name === conceptName
      );
      if (concept) {
        editForm.reset({
          name: concept.name,
          category: concept.category,
          description: concept.description,
          examples: concept.examples,
          sourceContent: concept.sourceContent,
          confidence: concept.confidence,
          suggestedDifficulty: concept.suggestedDifficulty,
        });
        setEditingConcept(conceptName);
      }
    },
    [session, editForm]
  );

  const handleSaveEdit = useCallback(
    (values: Partial<ExtractedConcept>) => {
      if (editingConcept) {
        handleConceptDecision(editingConcept, "edit", {
          editedConcept: values,
        });
        setEditingConcept(null);
      }
    },
    [editingConcept, handleConceptDecision]
  );

  const handleManualAdd = useCallback(
    (values: ExtractedConcept) => {
      const manualConcept: ExtractedConcept = {
        ...values,
        sourceContent: "Manual addition",
      };

      // Add to session concepts temporarily for display
      if (session) {
        const updatedSession = {
          ...session,
          extractedConcepts: [...session.extractedConcepts, manualConcept],
        };
        setSession(updatedSession);
      }

      handleConceptDecision(values.name, "manual_add", {
        editedConcept: values,
      });
      setShowManualAdd(false);
      manualForm.reset();
    },
    [session, handleConceptDecision, manualForm]
  );

  const toggleSimilarities = useCallback((conceptName: string) => {
    setShowSimilarities((prev) => {
      const newMap = new Map(prev);
      newMap.set(conceptName, !newMap.get(conceptName));
      return newMap;
    });
  }, []);

  const handleSaveDraft = async () => {
    if (!session) return;

    try {
      setIsSaving(true);

      const reviewDecisions: ReviewDecision[] = Array.from(
        decisions.entries()
      ).map(([conceptName, decision]) => {
        const concept = session.extractedConcepts.find(
          (c) => c.name === conceptName
        );

        if (!concept) {
          throw new Error(`Concept not found: ${conceptName}`);
        }

        return {
          action: decision.action,
          extractedConcept: concept,
          targetConceptId: decision.targetConceptId,
          editedConcept: decision.editedConcept,
          mergeData: decision.mergeData,
          courseId,
          reviewedAt: new Date(),
          reviewerId: "current-user", // TODO: Get from auth
        };
      });

      const requestBody = {
        reviewProgress: {
          reviewedCount: decisions.size,
          decisions: reviewDecisions,
          lastReviewedAt: new Date().toISOString(),
          isDraft: true,
        },
      };

      const response = await fetch(`/api/extraction-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save draft";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use default message
        }
        throw new Error(errorMessage);
      }

      // Show success feedback
      setError(null);
    } catch (err) {
      console.error("Save draft error:", err);
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!session || decisions.size === 0) return;

    try {
      setIsSaving(true);

      const reviewDecisions: ReviewDecision[] = Array.from(
        decisions.entries()
      ).map(([conceptName, decision]) => {
        const concept = session.extractedConcepts.find(
          (c) => c.name === conceptName
        )!;
        return {
          action: decision.action,
          extractedConcept: concept,
          targetConceptId: decision.targetConceptId,
          editedConcept: decision.editedConcept,
          mergeData: decision.mergeData,
          courseId,
          reviewedAt: new Date(),
          reviewerId: "current-user", // TODO: Get from auth
        };
      });

      // Final submit with isDraft: false
      const response = await fetch(`/api/extraction-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewProgress: {
            reviewedCount: decisions.size,
            decisions: reviewDecisions,
            lastReviewedAt: new Date().toISOString(),
            isDraft: false,
          },
          status: "reviewed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      onReviewComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSaving(false);
    }
  };

  const getSimilarities = (conceptName: string): SimilarityMatch[] => {
    return (
      session?.similarityMatches.find(
        (s) => s.extractedConceptName === conceptName
      )?.matches || []
    );
  };

  const getProgressPercentage = () => {
    if (!session || !session.extractedConcepts?.length) return 0;
    return (decisions.size / session.extractedConcepts.length) * 100;
  };

  if (isLoading) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="py-8 text-center">
          <p>Loading extraction session...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={loadExtractionSession}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="py-8 text-center">
          <p>No extraction session available for this course.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Enhanced Concept Review - {session.courseName}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Progress: {decisions.size} /{" "}
              {session.extractedConcepts?.length || 0} concepts reviewed
            </span>
            <span>
              Extracted: {new Date(session.extractionDate).toLocaleDateString()}
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Extraction Metadata */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold">Extraction Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                Total Concepts: {session.extractedConcepts?.length || 0}
              </div>
              <div>
                High Confidence:{" "}
                {session.extractedConcepts?.filter((c) => c.confidence > 0.8)
                  .length || 0}
              </div>
              <div>
                Average Confidence:{" "}
                {(
                  session.extractionMetadata.extractionConfidence * 100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>

          {/* Manual Add Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Concept Review</h3>
            <Button onClick={() => setShowManualAdd(true)} variant="outline">
              Add Manual Concept
            </Button>
          </div>

          {/* Concept List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {session.extractedConcepts &&
              session.extractedConcepts.length > 0 ? (
                session.extractedConcepts.map((concept, index) => {
                  const decision = decisions.get(concept.name);
                  const similarities = getSimilarities(concept.name);
                  const showSims = showSimilarities.get(concept.name);

                  const isApproved =
                    decision?.action === "approve" || decision?.impliesApproval;
                  const isRejected = decision?.action === "reject";

                  return (
                    <Card
                      key={`concept-${index}-${concept.name}`}
                      className={`p-4 ${isApproved ? "border-green-500 bg-green-50" : isRejected ? "border-red-500 bg-red-50" : ""}`}
                    >
                      <div className="space-y-4">
                        {/* Concept Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              {concept.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary">
                                {concept.category}
                              </Badge>
                              <Badge variant="outline">
                                {concept.suggestedDifficulty}
                              </Badge>
                              <span className="text-gray-600">
                                Confidence:{" "}
                                {(concept.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={isApproved ? "default" : "outline"}
                              onClick={() =>
                                handleConceptDecision(concept.name, "approve")
                              }
                            >
                              {isApproved ? "✓ Approved" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditConcept(concept.name)}
                            >
                              Edit
                            </Button>
                            {similarities.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSimilarities(concept.name)}
                              >
                                {showSims ? "Hide" : "Show"} Similarities (
                                {similarities.length})
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={isRejected ? "destructive" : "outline"}
                              onClick={() =>
                                handleConceptDecision(concept.name, "reject")
                              }
                            >
                              {isRejected ? "✗ Rejected" : "Reject"}
                            </Button>
                          </div>
                        </div>

                        {/* Concept Content */}
                        <div className="space-y-2">
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

                        {/* Decision Status */}
                        {decision && (
                          <div className="rounded bg-gray-50 p-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span>Decision:</span>
                              <Badge>{decision.action.toUpperCase()}</Badge>
                              {decision.impliesApproval && (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  APPROVED
                                </Badge>
                              )}
                              {decision.targetConceptId && (
                                <span className="text-xs text-gray-600">
                                  → Linked to {decision.targetConceptId}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Similarities Display */}
                        {showSims && similarities.length > 0 && (
                          <div className="border-t pt-3">
                            <h5 className="mb-2 text-sm font-medium text-gray-700">
                              Similar Existing Concepts:
                            </h5>
                            <div className="space-y-2">
                              {similarities.map((match, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between rounded bg-gray-50 p-2"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {match.name}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-600">
                                      ({(match.similarity * 100).toFixed(0)}%
                                      similar)
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={
                                        decision?.action === "link" &&
                                        decision?.targetConceptId ===
                                          match.conceptId
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        handleConceptDecision(
                                          concept.name,
                                          "link",
                                          { targetConceptId: match.conceptId }
                                        )
                                      }
                                    >
                                      {decision?.action === "link" &&
                                      decision?.targetConceptId ===
                                        match.conceptId
                                        ? "✓ Linked"
                                        : "Link"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        decision?.action === "merge" &&
                                        decision?.mergeData
                                          ?.primaryConceptId === match.conceptId
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        handleConceptDecision(
                                          concept.name,
                                          "merge",
                                          {
                                            mergeData: {
                                              primaryConceptId: match.conceptId,
                                              additionalData: {
                                                examples: concept.examples,
                                                description:
                                                  concept.description,
                                              },
                                            },
                                          }
                                        )
                                      }
                                    >
                                      {decision?.action === "merge" &&
                                      decision?.mergeData?.primaryConceptId ===
                                        match.conceptId
                                        ? "✓ Merged"
                                        : "Merge"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>No concepts found in this extraction session.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              {decisions.size} / {session.extractedConcepts?.length || 0}{" "}
              concepts reviewed
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                disabled={isSaving || decisions.size === 0}
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={isSaving || decisions.size === 0}
              >
                {isSaving ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingConcept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Concept: {editingConcept}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(handleSaveEdit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(ConceptCategory).map(
                                  (category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.toUpperCase()}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="suggestedDifficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(QuestionLevel).map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="examples"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examples (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={
                                Array.isArray(field.value)
                                  ? field.value.join("\n")
                                  : field.value
                              }
                              onChange={(e) => {
                                const lines = e.target.value
                                  .split("\n")
                                  .filter((line) => line.trim() !== "");
                                field.onChange(lines);
                              }}
                              rows={4}
                              placeholder="Enter examples, one per line..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="sourceContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Content</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit">Save Changes</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingConcept(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual Add Modal */}
        {showManualAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto">
              <CardHeader>
                <CardTitle>Add Manual Concept</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...manualForm}>
                  <form
                    onSubmit={manualForm.handleSubmit(handleManualAdd)}
                    className="space-y-4"
                  >
                    <FormField
                      control={manualForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={manualForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(ConceptCategory).map(
                                  (category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.toUpperCase()}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={manualForm.control}
                        name="suggestedDifficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(QuestionLevel).map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={manualForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualForm.control}
                      name="examples"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examples (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={
                                Array.isArray(field.value)
                                  ? field.value.join("\n")
                                  : field.value
                              }
                              onChange={(e) => {
                                const lines = e.target.value
                                  .split("\n")
                                  .filter((line) => line.trim() !== "");
                                field.onChange(lines);
                              }}
                              rows={4}
                              placeholder="Enter examples, one per line..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit">Add Concept</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowManualAdd(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
