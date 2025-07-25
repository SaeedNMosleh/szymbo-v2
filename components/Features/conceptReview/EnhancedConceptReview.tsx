"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagEditor } from "@/components/ui/tag-editor";
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
  SuggestedTag,
} from "@/datamodels/conceptExtractionSession.model";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { createOperationLogger } from "@/lib/utils/logger";
import { AlertCircle } from "lucide-react";

interface EnhancedConceptReviewProps {
  courseId: number;
  onReviewComplete?: () => void;
}

interface ConceptDecisionState {
  action: "approve" | "edit" | "reject" | "merge" | "manual_add";
  editedConcept?: Partial<ExtractedConcept>;
  targetConceptId?: string; // for link functionality
  mergeData?: {
    primaryConceptId: string;
    additionalData: {
      examples?: string[];
      description?: string;
    };
  };
  impliesApproval?: boolean; // UI flag for merge actions
}

const EditConceptSchema = ExtractedConceptSchema.partial();

export function EnhancedConceptReview({
  courseId,
  onReviewComplete,
}: EnhancedConceptReviewProps) {
  // Create operation-specific loggers
  const sessionLogger = createOperationLogger("session-management", {
    courseId,
  });
  const editLogger = createOperationLogger("concept-edit", { courseId });
  const submitLogger = createOperationLogger("review-submit", { courseId });
  const decisionLogger = createOperationLogger("concept-decision", {
    courseId,
  });

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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<Set<string>>(
    new Set()
  );

  sessionLogger.info("ConceptReview component initialized", { courseId });

  // Form for editing concepts
  const editForm = useForm<Partial<ExtractedConcept>>({
    resolver: zodResolver(EditConceptSchema),
    defaultValues: {
      name: "",
      category: ConceptCategory.VOCABULARY,
      description: "",
      examples: [""],
      sourceContent: "",
      confidence: 0,
      suggestedDifficulty: QuestionLevel.A1,
      suggestedTags: [],
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
      suggestedDifficulty: QuestionLevel.A2,
      suggestedTags: [],
    },
  });

  const loadExtractionSession = useCallback(async () => {
    sessionLogger.info("Starting session load");

    try {
      setIsLoading(true);
      setError(null);

      sessionLogger.debug("Fetching extraction session from API");
      // Get latest extraction session for course - include both extracted and in_review status
      const response = await fetch(
        `/api/extraction-sessions?courseId=${courseId}&limit=1`
      );
      const data = await response.json();

      sessionLogger.debug("API response received", {
        status: response.status,
        ok: response.ok,
        dataKeys: Object.keys(data || {}),
        sessionCount: data.data?.sessions?.length || 0,
      });

      if (!response.ok) {
        sessionLogger.error("API response not ok", {
          status: response.status,
          error: data.error,
        });
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      if (data.data?.sessions && data.data.sessions.length > 0) {
        const sessionData = data.data.sessions[0];
        sessionLogger.success("Found existing session", {
          sessionId: sessionData.id,
          status: sessionData.status,
          conceptCount: sessionData.extractedConcepts?.length || 0,
          existingDecisions: sessionData.reviewProgress?.decisions?.length || 0,
        });

        setSession(sessionData);

        // Load existing decisions if any
        const existingDecisions = new Map<string, ConceptDecisionState>();
        sessionData.reviewProgress.decisions.forEach(
          (decision: ReviewDecision) => {
            existingDecisions.set(decision.extractedConcept.name, {
              action: decision.action,
              editedConcept: decision.editedConcept,
              mergeData: decision.mergeData,
            });
          }
        );
        setDecisions(existingDecisions);

        // Initialize duplicate warnings from session data
        if (sessionData.duplicateDetection?.hasDuplicates) {
          const duplicateNames = new Set<string>(
            sessionData.duplicateDetection.duplicates.map(
              (d: { extractedConceptName: string }) => d.extractedConceptName
            )
          );
          setDuplicateWarnings(duplicateNames);
          sessionLogger.warn("Duplicates detected in session", {
            duplicateCount: duplicateNames.size,
            duplicateNames: Array.from(duplicateNames),
          });
        }

        sessionLogger.debug("Loaded existing decisions", {
          decisionCount: existingDecisions.size,
        });
      } else {
        sessionLogger.warn("No extraction session found, trying legacy system");
        // No extraction session found, try to get from the old concept extraction system
        // Try fallback to legacy system

        try {
          sessionLogger.debug("Attempting legacy API call");
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
            sessionLogger.info("Legacy system data received", {
              courseName: reviewData.data?.courseName,
              conceptCount: reviewData.data?.extractedConcepts?.length || 0,
              hasSimilarityMatches: !!reviewData.data?.similarityMatches,
            });

            // Convert old format to new session format
            sessionLogger.debug("Converting legacy data to session format");

            const extractedConcepts = reviewData.data?.extractedConcepts || [];
            sessionLogger.debug("Extracted concepts from legacy data", {
              conceptCount: extractedConcepts.length,
              firstConceptName: extractedConcepts[0]?.name,
            });

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
              newTagsCreated: [],
              extractionMetadata: {
                llmModel: "legacy",
                totalProcessingTime: 0,
                extractionConfidence: 0.8,
                sourceContentLength: 0,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            sessionLogger.success("Created mock session", {
              sessionId: mockSession.id,
              conceptCount: mockSession.extractedConcepts.length,
              similarityMatches: mockSession.similarityMatches.length,
            });

            // Save the legacy session to the database so it can be updated later
            // Only send the fields that the API expects
            const sessionPayload = {
              courseId: mockSession.courseId,
              courseName: mockSession.courseName,
              extractedConcepts: mockSession.extractedConcepts,
              similarityMatches: mockSession.similarityMatches,
              extractionMetadata: mockSession.extractionMetadata,
            };

            sessionLogger.debug(
              "Attempting to save legacy session to database"
            );

            try {
              const saveResponse = await fetch("/api/extraction-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionPayload),
              });

              if (saveResponse.ok) {
                const savedSessionData = await saveResponse.json();
                sessionLogger.success("Legacy session saved to database", {
                  sessionId:
                    savedSessionData.data?.sessionId ||
                    savedSessionData.data?.session?.id,
                  responseKeys: Object.keys(savedSessionData.data || {}),
                });
                // Use the session from the response, or fall back to the created session
                setSession(
                  savedSessionData.data?.session ||
                    savedSessionData.data ||
                    mockSession
                );
              } else {
                const errorData = await saveResponse.json().catch(() => ({}));
                sessionLogger.warn("Failed to save legacy session", {
                  status: saveResponse.status,
                  error: errorData,
                });
                setSession(mockSession);
              }
            } catch (saveError) {
              sessionLogger.error(
                "Error saving legacy session",
                saveError as Error
              );
              setSession(mockSession);
            }
            return;
          }
        } catch (legacyError) {
          sessionLogger.error(
            "Failed to load from legacy system",
            legacyError as Error
          );
        }

        sessionLogger.error("No extraction session found");
        setError(
          "No extraction session found for this course. Please extract concepts first."
        );
      }
    } catch (err) {
      sessionLogger.error("Session loading failed", err as Error);
      setError(
        err instanceof Error ? err.message : "Failed to load extraction session"
      );
    } finally {
      setIsLoading(false);
      sessionLogger.debug("Session loading completed");
    }
  }, [courseId, sessionLogger]);

  // Load available tags
  const loadAvailableTags = useCallback(async () => {
    sessionLogger.debug("Loading available tags");
    try {
      const response = await fetch(`/api/concepts/tags?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        const tags = data.data?.tags || [];
        setAvailableTags(tags);
        sessionLogger.success("Tags loaded", { tagCount: tags.length });
      } else {
        sessionLogger.warn("Failed to load tags", { status: response.status });
      }
    } catch (error) {
      sessionLogger.error("Failed to load available tags", error as Error);
    }
  }, [courseId, sessionLogger]);

  // Load extraction session on mount
  useEffect(() => {
    loadExtractionSession();
    loadAvailableTags();
  }, [loadExtractionSession, loadAvailableTags]);

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
      decisionLogger.info("Concept decision triggered", {
        conceptName,
        action,
        hasAdditionalData: !!additionalData,
        additionalDataKeys: additionalData ? Object.keys(additionalData) : [],
        editedConceptFields: additionalData?.editedConcept
          ? Object.keys(additionalData.editedConcept)
          : [],
      });

      setDecisions((prev) => {
        const newDecisions = new Map(prev);
        const currentDecision = newDecisions.get(conceptName);

        decisionLogger.debug("Current decision state", {
          conceptName,
          currentAction: currentDecision?.action,
          hasCurrentDecision: !!currentDecision,
          totalDecisions: prev.size,
        });

        // Toggle behavior: if same action is clicked again, remove the decision
        // Special case: if approve is clicked while merge is active, toggle off merge
        let shouldToggle = false;

        if (
          action === "approve" &&
          currentDecision &&
          currentDecision.action === "merge"
        ) {
          // Clicking approve while merge is active should clear the merge
          shouldToggle = true;
          decisionLogger.debug("Toggle: approve clicked while merge active");
        } else if (
          action === "approve" &&
          currentDecision &&
          currentDecision.action === "edit"
        ) {
          // Clicking approve while edit is active should switch to approve (keep the edit data)
          shouldToggle = false;
          decisionLogger.debug("No toggle: approve clicked while edit active");
        } else if (currentDecision && currentDecision.action === action) {
          if (action === "merge") {
            shouldToggle =
              currentDecision.mergeData?.primaryConceptId ===
              additionalData?.mergeData?.primaryConceptId;
            decisionLogger.debug("Merge toggle check", { shouldToggle });
          } else if (action === "edit") {
            // For edit action, we should never toggle - always update with new values
            shouldToggle = false;
            decisionLogger.debug("Edit action: no toggle, will update");
          } else {
            shouldToggle = true; // For approve, reject actions
            decisionLogger.debug("Standard action toggle", { action });
          }
        }

        if (shouldToggle) {
          newDecisions.delete(conceptName);
          decisionLogger.info("Decision removed (toggled off)", {
            conceptName,
            action,
          });
        } else {
          // UI Logic: Merge implies approval for user experience
          if (action === "merge") {
            const newDecision = {
              action,
              ...additionalData,
              // Add UI flag to show this should appear approved
              impliesApproval: true,
            };
            newDecisions.set(conceptName, newDecision);
            decisionLogger.success("Merge decision set", {
              conceptName,
              action,
              impliesApproval: true,
            });
          }
          // UI Logic: Reject clears any existing merge decisions
          else if (action === "reject") {
            const newDecision = {
              action,
              ...additionalData,
            };
            newDecisions.set(conceptName, newDecision);
            decisionLogger.success("Reject decision set", { conceptName });
          }
          // Edit action should always update with the latest edited concept
          else if (action === "edit" && additionalData?.editedConcept) {
            const newDecision = {
              action,
              editedConcept: additionalData.editedConcept,
            };
            newDecisions.set(conceptName, newDecision);
            decisionLogger.success("Edit decision set", {
              conceptName,
              editedConceptFields: Object.keys(additionalData.editedConcept),
              editedConceptSample: {
                name: additionalData.editedConcept.name,
                category: additionalData.editedConcept.category,
                tagCount:
                  additionalData.editedConcept.suggestedTags?.length || 0,
              },
            });
          }
          // Standard actions
          else {
            const newDecision = {
              action,
              ...additionalData,
            };
            newDecisions.set(conceptName, newDecision);
            decisionLogger.success("Standard decision set", {
              conceptName,
              action,
            });
          }
        }

        decisionLogger.info("Decision state updated", {
          conceptName,
          finalAction: newDecisions.get(conceptName)?.action,
          totalDecisions: newDecisions.size,
          decisionExists: newDecisions.has(conceptName),
        });

        return newDecisions;
      });
    },
    [decisionLogger]
  );

  const handleEditConcept = useCallback(
    (conceptName: string) => {
      editLogger.info("Starting concept edit", { conceptName });

      const concept = session?.extractedConcepts.find(
        (c) => c.name === conceptName
      );

      if (concept) {
        editLogger.debug("Found concept for editing", {
          conceptName,
          category: concept.category,
          description: concept.description?.substring(0, 50) + "...",
          exampleCount: concept.examples?.length || 0,
          tagCount: concept.suggestedTags?.length || 0,
        });

        const formData = {
          name: concept.name,
          category: concept.category,
          description: concept.description,
          examples: concept.examples,
          sourceContent: concept.sourceContent,
          confidence: concept.confidence,
          suggestedDifficulty: concept.suggestedDifficulty,
          suggestedTags: concept.suggestedTags || [],
        };

        editForm.reset(formData);
        setEditingConcept(conceptName);

        editLogger.success("Edit form initialized", {
          conceptName,
          formFields: Object.keys(formData),
          formValid: editForm.formState.isValid,
        });
      } else {
        editLogger.error("Concept not found for editing", { conceptName });
      }
    },
    [session, editForm, editLogger]
  );

  const handleSaveEdit = useCallback(
    (values: Partial<ExtractedConcept>) => {
      editLogger.info("Edit save triggered", {
        editingConcept,
        valueFields: Object.keys(values),
        valuesPreview: {
          name: values.name,
          category: values.category,
          tagCount: values.suggestedTags?.length || 0,
          exampleCount: values.examples?.length || 0,
        },
      });

      if (editingConcept) {
        // Ensure we have the original concept to merge with edited values
        const originalConcept = session?.extractedConcepts.find(
          (c) => c.name === editingConcept
        );

        if (originalConcept) {
          editLogger.debug("Found original concept for comparison", {
            originalName: originalConcept.name,
            originalCategory: originalConcept.category,
          });

          // Make a deep copy of the edited concept with all required fields
          const editedConcept: Partial<ExtractedConcept> = {
            ...values,
            // Ensure suggestedTags is included and properly formatted
            suggestedTags: Array.isArray(values.suggestedTags)
              ? values.suggestedTags
              : [],
          };

          editLogger.success("Prepared edited concept data", {
            editingConcept,
            editedFields: Object.keys(editedConcept),
            tagCount: editedConcept.suggestedTags?.length || 0,
          });

          handleConceptDecision(editingConcept, "edit", {
            editedConcept,
          });

          editLogger.success("Edit decision called, closing modal", {
            editingConcept,
          });
          setEditingConcept(null);
        } else {
          editLogger.error("Original concept not found", { editingConcept });
        }
      } else {
        editLogger.error("No concept being edited", { editingConcept });
      }
    },
    [editingConcept, handleConceptDecision, session, editLogger]
  );

  const handleManualAdd = useCallback(
    (
      values: Omit<ExtractedConcept, "suggestedTags"> & {
        suggestedTags?: SuggestedTag[];
      }
    ) => {
      const manualConcept: ExtractedConcept = {
        ...values,
        sourceContent: "Manual addition",
        suggestedTags: values.suggestedTags || [],
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

        // For edit decisions, ensure we have all the necessary data
        let editedConcept = decision.editedConcept;
        if (decision.action === "edit" && editedConcept) {
          // Make sure editedConcept has all the fields needed
          if (!editedConcept.suggestedTags && concept.suggestedTags) {
            editedConcept = {
              ...editedConcept,
              suggestedTags: concept.suggestedTags,
            };
          }
          submitLogger.debug("Final edited concept in draft", {
            conceptName,
            editedFields: Object.keys(editedConcept),
            tagCount: editedConcept.suggestedTags?.length || 0,
          });
        }

        return {
          action: decision.action,
          extractedConcept: concept,
          targetConceptId: decision.targetConceptId,
          editedConcept,
          mergeData: decision.mergeData,
          courseId,
          reviewedAt: new Date(), // Use Date object instead of string
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
      submitLogger.error("Save draft error", err as Error);
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!session || decisions.size === 0) {
      submitLogger.warn("Cannot submit review", {
        hasSession: !!session,
        sessionId: session?.id,
        decisionCount: decisions.size,
      });
      return;
    }

    // Check for unresolved duplicates
    if (hasUnresolvedDuplicates()) {
      const unresolvedDuplicates = getUnresolvedDuplicates();
      const duplicateNames = unresolvedDuplicates.join(", ");
      setError(
        `Cannot submit review: The following concepts are duplicates and must be edited to have unique names: ${duplicateNames}`
      );
      submitLogger.warn(
        "Review submission blocked due to unresolved duplicates",
        {
          unresolvedDuplicates,
          sessionId: session.id,
        }
      );
      return;
    }

    submitLogger.info("Starting review submission", {
      sessionId: session.id,
      sessionStatus: session.status,
      decisionCount: decisions.size,
      conceptCount: session.extractedConcepts?.length || 0,
    });

    try {
      setIsSaving(true);
      setError(null);

      submitLogger.debug("Processing decisions for submission");

      const reviewDecisions: ReviewDecision[] = Array.from(
        decisions.entries()
      ).map(([conceptName, decision]) => {
        const concept = session.extractedConcepts.find(
          (c) => c.name === conceptName
        );

        if (!concept) {
          submitLogger.error("Concept not found for decision", { conceptName });
          throw new Error(`Concept not found: ${conceptName}`);
        }

        // For edit decisions, ensure we have all the necessary data
        let editedConcept = decision.editedConcept;
        if (decision.action === "edit" && editedConcept) {
          // Make sure editedConcept has all the fields needed
          if (!editedConcept.suggestedTags && concept.suggestedTags) {
            editedConcept = {
              ...editedConcept,
              suggestedTags: concept.suggestedTags,
            };
          }
          submitLogger.debug("Processing edited concept", {
            conceptName,
            editedFields: Object.keys(editedConcept),
            tagCount: editedConcept.suggestedTags?.length || 0,
          });
        }

        const reviewDecision = {
          action: decision.action,
          extractedConcept: concept,
          targetConceptId: decision.targetConceptId,
          editedConcept,
          mergeData: decision.mergeData,
          courseId,
          reviewedAt: new Date(), // Use Date object instead of string
          reviewerId: "current-user", // TODO: Get from auth
        };

        submitLogger.debug("Created review decision", {
          conceptName,
          action: decision.action,
          hasEditedConcept: !!editedConcept,
          hasTargetConceptId: !!decision.targetConceptId,
        });

        return reviewDecision;
      });

      const requestBody = {
        reviewProgress: {
          reviewedCount: decisions.size,
          decisions: reviewDecisions,
          lastReviewedAt: new Date().toISOString(),
          isDraft: false,
        },
        status: "reviewed",
      };

      submitLogger.info("Prepared submission payload", {
        sessionId: session.id,
        reviewedCount: requestBody.reviewProgress.reviewedCount,
        decisionCount: requestBody.reviewProgress.decisions.length,
        isDraft: requestBody.reviewProgress.isDraft,
        status: requestBody.status,
      });

      // Final submit with isDraft: false
      const response = await fetch(`/api/extraction-sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      submitLogger.info("Review submission API call completed", {
        status: response.status,
        ok: response.ok,
        sessionId: session.id,
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit review";
        try {
          const errorData = await response.json();
          submitLogger.error("Review submission API error", {
            status: response.status,
            errorData,
            errorMessage: errorData.error || errorData.message,
          });
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          submitLogger.error("Could not parse error response", {
            status: response.status,
          });
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      submitLogger.success("Review submission successful", {
        sessionId: session.id,
        responseKeys: Object.keys(responseData),
        responseMessage: responseData.message,
      });

      // Call the completion callback
      if (onReviewComplete) {
        submitLogger.debug("Calling onReviewComplete callback");
        onReviewComplete();
      } else {
        submitLogger.warn("No onReviewComplete callback provided");
      }
    } catch (err) {
      submitLogger.error("Review submission failed", err as Error);
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSaving(false);
      submitLogger.debug("Review submission completed");
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

  const getDuplicateInfo = (conceptName: string) => {
    if (!session?.duplicateDetection?.hasDuplicates) return null;

    return session.duplicateDetection.duplicates.find(
      (d) => d.extractedConceptName === conceptName
    );
  };

  const hasUnresolvedDuplicates = () => {
    if (!duplicateWarnings.size) return false;

    // Check if all duplicate concepts have been edited to have unique names
    for (const duplicateName of duplicateWarnings) {
      const decision = decisions.get(duplicateName);
      if (decision?.action !== "edit") {
        return true; // Still has unresolved duplicates
      }

      // Check if the edited name is still a duplicate
      if (decision?.editedConcept?.name) {
        const editedName = decision.editedConcept.name;
        const duplicateInfo = getDuplicateInfo(duplicateName);
        if (
          duplicateInfo &&
          editedName.toLowerCase() ===
            duplicateInfo.existingConcept.name.toLowerCase()
        ) {
          return true; // Still a duplicate after edit
        }
      }
    }

    return false;
  };

  const getUnresolvedDuplicates = () => {
    const unresolved: string[] = [];

    for (const duplicateName of duplicateWarnings) {
      const decision = decisions.get(duplicateName);
      if (decision?.action !== "edit") {
        unresolved.push(duplicateName);
      } else if (decision?.editedConcept?.name) {
        const editedName = decision.editedConcept.name;
        const duplicateInfo = getDuplicateInfo(duplicateName);
        if (
          duplicateInfo &&
          editedName.toLowerCase() ===
            duplicateInfo.existingConcept.name.toLowerCase()
        ) {
          unresolved.push(duplicateName);
        }
      }
    }

    return unresolved;
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
          {/* Duplicate Detection Summary */}
          {duplicateWarnings.size > 0 && (
            <div className="rounded-lg border border-orange-300 bg-orange-100 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-orange-800">
                <AlertCircle className="size-5" />
                Duplicate Detection Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-orange-700">
                  <strong>{duplicateWarnings.size}</strong> duplicate concepts
                  detected
                </div>
                <div className="text-orange-700">
                  <strong>{getUnresolvedDuplicates().length}</strong> unresolved
                  duplicates
                </div>
              </div>
              {hasUnresolvedDuplicates() && (
                <div className="mt-2 text-sm text-orange-700">
                  <strong>Action Required:</strong> Edit the highlighted
                  concepts to have unique names before you can submit the
                  review.
                </div>
              )}
            </div>
          )}

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
                  const duplicateInfo = getDuplicateInfo(concept.name);
                  const isDuplicate = duplicateWarnings.has(concept.name);

                  // Use edited concept data if available, otherwise use original
                  const displayConcept = decision?.editedConcept
                    ? { ...concept, ...decision.editedConcept }
                    : concept;

                  const isApproved =
                    decision?.action === "approve" ||
                    decision?.action === "edit" ||
                    decision?.impliesApproval;
                  const isRejected = decision?.action === "reject";

                  // Check if duplicate is resolved
                  const isDuplicateResolved =
                    isDuplicate &&
                    decision?.action === "edit" &&
                    decision?.editedConcept?.name &&
                    decision.editedConcept.name.toLowerCase() !==
                      duplicateInfo?.existingConcept.name.toLowerCase();

                  return (
                    <Card
                      key={`concept-${index}-${concept.name}`}
                      className={`p-4 ${
                        isDuplicate && !isDuplicateResolved
                          ? "border-2 border-orange-500 bg-orange-50"
                          : isDuplicateResolved
                            ? "border-blue-500 bg-blue-50"
                            : isApproved
                              ? "border-green-500 bg-green-50"
                              : isRejected
                                ? "border-red-500 bg-red-50"
                                : ""
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Duplicate Warning */}
                        {isDuplicate &&
                          !isDuplicateResolved &&
                          duplicateInfo && (
                            <div className="rounded-lg border border-orange-300 bg-orange-100 p-3">
                              <div className="flex items-center gap-2 text-orange-800">
                                <AlertCircle className="size-5" />
                                <span className="font-semibold">
                                  Duplicate Detected
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-orange-700">
                                This concept name already exists: &quot;
                                <strong>
                                  {duplicateInfo.existingConcept.name}
                                </strong>
                                &quot; in category{" "}
                                {duplicateInfo.existingConcept.category}. You
                                must edit this concept to have a unique name
                                before submitting.
                              </p>
                            </div>
                          )}

                        {/* Duplicate Resolved */}
                        {isDuplicateResolved && (
                          <div className="rounded-lg border border-blue-300 bg-blue-100 p-3">
                            <div className="flex items-center gap-2 text-blue-800">
                              <Badge className="bg-blue-600">
                                ✓ Duplicate Resolved
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-blue-700">
                              Concept name has been changed to be unique.
                            </p>
                          </div>
                        )}

                        {/* Concept Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              {displayConcept.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary">
                                {displayConcept.category}
                              </Badge>
                              <Badge variant="outline">
                                {displayConcept.suggestedDifficulty}
                              </Badge>
                              <span className="text-gray-600">
                                Confidence:{" "}
                                {(displayConcept.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            {displayConcept.suggestedTags &&
                              displayConcept.suggestedTags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {displayConcept.suggestedTags.map(
                                    (tag, tagIndex) => (
                                      <Badge
                                        key={tagIndex}
                                        variant="outline"
                                        className="bg-blue-50"
                                      >
                                        {tag.tag}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={
                                decision?.action === "approve" ||
                                decision?.impliesApproval
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                handleConceptDecision(concept.name, "approve")
                              }
                            >
                              {decision?.action === "approve" ||
                              decision?.impliesApproval
                                ? "✓ Approved"
                                : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                decision?.action === "edit"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => handleEditConcept(concept.name)}
                            >
                              {decision?.action === "edit"
                                ? "✓ Edited"
                                : "Edit"}
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
                          <p className="text-gray-700">
                            {displayConcept.description}
                          </p>

                          {displayConcept.examples.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Examples:
                              </p>
                              <ul className="list-inside list-disc text-sm text-gray-600">
                                {displayConcept.examples.map((example, i) => (
                                  <li key={i}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Source: {displayConcept.sourceContent}
                          </p>
                        </div>

                        {/* Decision Status */}
                        {decision && (
                          <div className="rounded bg-gray-50 p-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span>Decision:</span>
                              <Badge
                                className={
                                  decision.action === "edit"
                                    ? "bg-blue-100 text-blue-800"
                                    : decision.action === "approve"
                                      ? "bg-green-100 text-green-800"
                                      : ""
                                }
                              >
                                {decision.action.toUpperCase()}
                              </Badge>
                              {decision.action === "edit" && (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  APPROVED
                                </Badge>
                              )}
                              {decision.impliesApproval && (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  APPROVED
                                </Badge>
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
                                                examples:
                                                  displayConcept.examples,
                                                description:
                                                  displayConcept.description,
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
                disabled={
                  isSaving || decisions.size === 0 || hasUnresolvedDuplicates()
                }
                className={
                  hasUnresolvedDuplicates()
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                {isSaving
                  ? "Submitting..."
                  : hasUnresolvedDuplicates()
                    ? "Resolve Duplicates First"
                    : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingConcept && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget) {
                setEditingConcept(null);
              }
            }}
          >
            <Card
              className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>Edit Concept: {editingConcept}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...editForm}>
                  <form
                    onSubmit={(e) => {
                      editLogger.info("Form submit event triggered", {
                        editingConcept,
                      });
                      e.preventDefault();
                      e.stopPropagation();

                      // Get current form values
                      const formValues = editForm.getValues();
                      editLogger.debug("Current form values", {
                        editingConcept,
                        formFields: Object.keys(formValues),
                        valuesPreview: {
                          name: formValues.name,
                          category: formValues.category,
                          tagCount: formValues.suggestedTags?.length || 0,
                          exampleCount: formValues.examples?.length || 0,
                        },
                      });

                      // Validate form before submission
                      const isValid = editForm.formState.isValid;
                      editLogger.debug("Form validation check", {
                        editingConcept,
                        isValid,
                        errorCount: Object.keys(editForm.formState.errors)
                          .length,
                      });

                      if (!isValid) {
                        editLogger.warn("Form validation errors detected", {
                          editingConcept,
                          errors: editForm.formState.errors,
                        });
                      }

                      // Call the form submission handler
                      editForm.handleSubmit(handleSaveEdit)(e);
                    }}
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

                    <FormField
                      control={editForm.control}
                      name="suggestedTags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <TagEditor
                              tags={
                                Array.isArray(field.value)
                                  ? field.value.map((tag) =>
                                      typeof tag === "string"
                                        ? {
                                            tag,
                                            source: "existing" as const,
                                            confidence: 1.0,
                                          }
                                        : tag
                                    )
                                  : []
                              }
                              onTagsChange={(tags) => {
                                editLogger.debug("Edit form tags changed", {
                                  editingConcept,
                                  tagCount: tags.length,
                                  tags: tags.map((t) => ({
                                    tag: t.tag,
                                    source: t.source,
                                  })),
                                });
                                field.onChange(tags);
                              }}
                              availableTags={availableTags}
                              placeholder="Add a tag..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingConcept(null);
                        }}
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget) {
                setShowManualAdd(false);
              }
            }}
          >
            <Card
              className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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

                    <FormField
                      control={manualForm.control}
                      name="suggestedTags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <TagEditor
                              tags={
                                Array.isArray(field.value)
                                  ? field.value.map((tag) =>
                                      typeof tag === "string"
                                        ? {
                                            tag,
                                            source: "existing" as const,
                                            confidence: 1.0,
                                          }
                                        : tag
                                    )
                                  : []
                              }
                              onTagsChange={(tags) => {
                                editLogger.debug("Manual form tags changed", {
                                  tagCount: tags.length,
                                  tags: tags.map((t) => ({
                                    tag: t.tag,
                                    source: t.source,
                                  })),
                                });
                                field.onChange(tags);
                              }}
                              availableTags={availableTags}
                              placeholder="Add a tag..."
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
