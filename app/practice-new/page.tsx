"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/ui/navigation";
import { PracticeSelector } from "@/components/Features/practiceNew/PracticeSelector";
import { PracticeSession } from "@/components/Features/practiceNew/PracticeSession";
import { PracticeStats } from "@/components/Features/practiceNew/PracticeStats";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";

// Interface definitions matching what's expected in PracticeSession
interface Question {
  id: string;
  question: string;
  questionType: QuestionType;
  difficulty: QuestionLevel;
  targetConcepts: string[];
  options?: string[];
  correctAnswer?: string;
  context?: string;
  additionalInfo?: string;
}

interface SessionData {
  sessionId: string;
  conceptIds: string[];
  questions: Question[];
  metadata: {
    mode: PracticeMode;
    totalQuestions: number;
    conceptCount: number;
    rationale: string;
  };
}

interface Course {
  courseId: number;
  date: string;
  courseType: CourseType;
  notes: string;
  keywords: string[];
  extractedConcepts?: string[];
}

interface CourseWithConcepts extends Course {
  conceptDetails?: {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    category: string;
    questionCount: number;
  }[];
}

interface WeakConcept {
  concept: {
    id: string;
    name: string;
    category: string;
    description: string;
    difficulty: string;
    tags?: string[];
  };
  progress: {
    masteryLevel: number;
    successRate: number;
    consecutiveCorrect: number;
    lastPracticed: Date;
    nextReview: Date;
    intervalDays: number;
  } | null;
  priority: number;
  isOverdue: boolean;
  daysSinceReview: number;
  questionCount?: number;
}

function WeakConceptSelector({
  onConceptSelect,
  onBack,
  isLoading,
}: {
  onConceptSelect: (conceptIds: string[]) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionCounts = async (conceptIds: string[]) => {
    try {
      const counts: Record<string, number> = {};

      // Fetch question counts for each concept (batch them if needed)
      const batchSize = 10;
      for (let i = 0; i < conceptIds.length; i += batchSize) {
        const batch = conceptIds.slice(i, i + batchSize);
        const response = await fetch(
          `/api/questions?conceptIds=${batch.join(",")}&limit=100`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.questions) {
            // Count questions per concept
            result.data.questions.forEach(
              (question: { targetConcepts: string[] }) => {
                question.targetConcepts.forEach((conceptId: string) => {
                  if (batch.includes(conceptId)) {
                    counts[conceptId] = (counts[conceptId] || 0) + 1;
                  }
                });
              }
            );
          }
        }
      }

      return counts;
    } catch (error) {
      console.error("Failed to fetch question counts:", error);
      return {};
    }
  };

  const fetchWeakConcepts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/practice-new/concepts-by-weakness?userId=default"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch concepts");
      }
      const result = await response.json();

      if (result.success && result.data && result.data.concepts) {
        const concepts = result.data.concepts;

        // Fetch question counts for all concepts
        const conceptIds = concepts.map((c: WeakConcept) => c.concept.id);
        const questionCounts = await fetchQuestionCounts(conceptIds);

        // Add question counts to concepts
        const conceptsWithCounts = concepts.map((concept: WeakConcept) => ({
          ...concept,
          questionCount: questionCounts[concept.concept.id] || 0,
        }));

        setWeakConcepts(conceptsWithCounts);
      } else {
        setError(result.error || "Failed to load concepts");
      }
    } catch {
      setError("Failed to load concepts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeakConcepts();
  }, [fetchWeakConcepts]);

  const toggleConceptSelection = (conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId]
    );
  };

  const handleStartPractice = () => {
    if (selectedConcepts.length > 0) {
      onConceptSelect(selectedConcepts);
    }
  };

  const getWeaknessColor = (
    successRate: number,
    isOverdue: boolean,
    hasProgress: boolean
  ) => {
    if (!hasProgress) return "text-purple-600 bg-purple-100";
    if (isOverdue) return "text-red-600 bg-red-100";
    if (successRate < 0.3) return "text-red-600 bg-red-100";
    if (successRate < 0.5) return "text-orange-600 bg-orange-100";
    if (successRate < 0.7) return "text-yellow-600 bg-yellow-100";
    return "text-blue-600 bg-blue-100";
  };

  const getWeaknessText = (
    successRate: number,
    isOverdue: boolean,
    hasProgress: boolean
  ) => {
    if (!hasProgress) return "Never Practiced";
    if (isOverdue) return "Overdue";
    if (successRate < 0.3) return "Very Weak";
    if (successRate < 0.5) return "Weak";
    if (successRate < 0.7) return "Needs Practice";
    return "Due for Review";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p>Loading weak concepts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={onBack} className="mt-4">
              Back to Practice Modes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Practice Modes
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Select Concepts to Practice
            </h2>
            <p className="text-sm text-gray-600">
              All concepts sorted by weakness (weakest first)
            </p>
          </div>
        </div>

        {weakConcepts.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">
              No concepts available for practice.
            </p>
            <Button onClick={onBack}>Back to Practice Modes</Button>
          </div>
        ) : (
          <>
            <div className="mb-6 max-h-96 space-y-3 overflow-y-auto">
              {weakConcepts.map((conceptData) => {
                const isSelected = selectedConcepts.includes(
                  conceptData.concept.id
                );
                const successRate = conceptData.progress?.successRate || 0;
                const hasProgress = conceptData.progress !== null;
                const lastPracticed =
                  conceptData.progress?.lastPracticed || new Date();
                return (
                  <div
                    key={conceptData.concept.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      toggleConceptSelection(conceptData.concept.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleConceptSelection(conceptData.concept.id)
                          }
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {conceptData.concept.name}
                          </h3>
                          {conceptData.concept.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {conceptData.concept.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs ${getWeaknessColor(successRate, conceptData.isOverdue, hasProgress)}`}
                            >
                              {getWeaknessText(
                                successRate,
                                conceptData.isOverdue,
                                hasProgress
                              )}{" "}
                              {hasProgress &&
                                `(${Math.round(successRate * 100)}%)`}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              Priority: {conceptData.priority.toFixed(1)}
                            </span>
                            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-600">
                              {conceptData.concept.difficulty}
                            </span>
                            {conceptData.concept.category && (
                              <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-600">
                                {conceptData.concept.category}
                              </span>
                            )}
                            <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-600">
                              {conceptData.questionCount || 0} questions
                            </span>
                          </div>
                          {conceptData.concept.tags &&
                            conceptData.concept.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {conceptData.concept.tags
                                  .slice(0, 3)
                                  .map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {conceptData.concept.tags.length > 3 && (
                                  <span className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-600">
                                    +{conceptData.concept.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="text-right">
                        {hasProgress ? (
                          <>
                            <div className="text-xs text-gray-500">
                              Last:{" "}
                              {new Date(lastPracticed).toLocaleDateString()}
                            </div>
                            {conceptData.isOverdue && (
                              <div className="text-xs font-medium text-red-600">
                                {conceptData.daysSinceReview} days overdue
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs font-medium text-purple-600">
                            New Concept
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedConcepts.length} concept
                {selectedConcepts.length !== 1 ? "s" : ""} selected
              </div>
              <Button
                onClick={handleStartPractice}
                disabled={selectedConcepts.length === 0 || isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                Start Practice ({selectedConcepts.length} concepts)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CourseSelector({
  onCourseSelect,
  onBack,
  isLoading,
}: {
  onCourseSelect: (courseIds: number[]) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [courses, setCourses] = useState<CourseWithConcepts[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchConceptsForCourse = async (courseId: number) => {
    try {
      console.log(`🔍 DASHBOARD: Fetching concepts for course ${courseId}`);
      // Get concepts using the correct API endpoint
      const conceptsResponse = await fetch(
        `/api/concepts?courseId=${courseId}`
      );
      console.log(
        `📡 DASHBOARD: Response status for course ${courseId}:`,
        conceptsResponse.status
      );
      if (!conceptsResponse.ok) return [];

      const conceptsResult = await conceptsResponse.json();
      console.log(`📊 DASHBOARD: Concepts result for course ${courseId}:`, {
        success: conceptsResult.success,
        dataLength: conceptsResult.data?.length || 0,
        hasData: !!conceptsResult.data,
      });

      if (!conceptsResult.success || !conceptsResult.data) {
        console.log(`❌ DASHBOARD: No concepts data for course ${courseId}`);
        return [];
      }

      const concepts = conceptsResult.data;
      console.log(
        `✅ DASHBOARD: Found ${concepts.length} concepts for course ${courseId}:`,
        concepts
          .slice(0, 3)
          .map((c: { id: string; name?: string }) => c.name || c.id)
      );

      // Get question counts for these concepts
      const conceptIds = concepts.map((c: { id: string }) => c.id);
      if (conceptIds.length === 0) return [];

      const questionCounts: Record<string, number> = {};

      // Fetch question counts in batches
      const batchSize = 10;
      for (let i = 0; i < conceptIds.length; i += batchSize) {
        const batch = conceptIds.slice(i, i + batchSize);
        const response = await fetch(
          `/api/questions?conceptIds=${batch.join(",")}&limit=100`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.questions) {
            result.data.questions.forEach(
              (question: { targetConcepts: string[] }) => {
                question.targetConcepts.forEach((conceptId: string) => {
                  if (batch.includes(conceptId)) {
                    questionCounts[conceptId] =
                      (questionCounts[conceptId] || 0) + 1;
                  }
                });
              }
            );
          }
        }
      }

      // Return concepts with question counts
      return concepts.map(
        (concept: {
          id: string;
          name: string;
          description: string;
          difficulty: string;
          category: string;
        }) => ({
          id: concept.id,
          name: concept.name,
          description: concept.description,
          difficulty: concept.difficulty,
          category: concept.category,
          questionCount: questionCounts[concept.id] || 0,
        })
      );
    } catch (error) {
      console.error("Failed to fetch concepts for course:", error);
      return [];
    }
  };

  const toggleCourseExpansion = async (courseId: number) => {
    const newExpanded = new Set(expandedCourses);

    if (expandedCourses.has(courseId)) {
      // Collapse
      newExpanded.delete(courseId);
    } else {
      // Expand - fetch concepts if not already loaded
      const course = courses.find((c) => c.courseId === courseId);
      if (course && !course.conceptDetails) {
        const conceptDetails = await fetchConceptsForCourse(courseId);
        setCourses((prev) =>
          prev.map((c) =>
            c.courseId === courseId ? { ...c, conceptDetails } : c
          )
        );
      }
      newExpanded.add(courseId);
    }

    setExpandedCourses(newExpanded);
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const result = await response.json();

      // Handle the new standardized API response format
      if (result.success && result.data) {
        setCourses(
          result.data.sort(
            (a: Course, b: Course) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } else {
        setError(result.error || "Failed to load courses");
      }
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p>Loading courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={onBack} className="mt-4">
              Back to Practice Modes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleStartPractice = () => {
    if (selectedCourses.length > 0) {
      onCourseSelect(selectedCourses);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Practice Modes
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Select Courses to Drill</h2>
            <p className="text-sm text-gray-600">Choose one or more courses</p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">No courses available</p>
            <Button onClick={onBack}>Back to Practice Modes</Button>
          </div>
        ) : (
          <>
            <div className="mb-6 max-h-96 space-y-3 overflow-y-auto">
              {courses.map((course) => {
                const isSelected = selectedCourses.includes(course.courseId);
                const isExpanded = expandedCourses.has(course.courseId);
                return (
                  <div
                    key={course.courseId}
                    className={`rounded-lg border transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`cursor-pointer p-4 ${!isSelected ? "hover:bg-gray-50" : ""}`}
                      onClick={() => toggleCourseSelection(course.courseId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleCourseSelection(course.courseId)
                            }
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {course.courseType} -{" "}
                              {new Date(course.date).toLocaleDateString()}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {course.notes.substring(0, 100)}...
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {course.keywords
                                .slice(0, 3)
                                .map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              {course.keywords.length > 3 && (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                  +{course.keywords.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Course ID: {course.courseId}
                            </div>
                            {course.extractedConcepts && (
                              <div className="mt-1 text-xs text-green-600">
                                {course.extractedConcepts.length} concepts
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCourseExpansion(course.courseId);
                            }}
                            className="size-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded concepts view */}
                    {isExpanded && course.conceptDetails && (
                      <div className="border-t bg-gray-50 p-4">
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          Covered Concepts ({course.conceptDetails.length})
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {course.conceptDetails.map((concept) => (
                            <div
                              key={concept.id}
                              className="rounded border bg-white p-3 text-sm"
                            >
                              <div className="font-medium">{concept.name}</div>
                              <div className="mt-1 text-xs text-gray-600">
                                {concept.description.substring(0, 80)}...
                              </div>
                              <div className="mt-2 flex gap-1">
                                <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-600">
                                  {concept.difficulty}
                                </span>
                                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-600">
                                  {concept.category}
                                </span>
                                <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-600">
                                  {concept.questionCount} questions
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {course.conceptDetails.length === 0 && (
                          <div className="text-center text-sm text-gray-500">
                            No concepts found for this course
                          </div>
                        )}
                      </div>
                    )}

                    {/* Loading state for concepts */}
                    {isExpanded && !course.conceptDetails && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="flex items-center justify-center">
                          <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">
                            Loading concepts...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedCourses.length} course
                {selectedCourses.length !== 1 ? "s" : ""} selected
              </div>
              <Button
                onClick={handleStartPractice}
                disabled={selectedCourses.length === 0 || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Practice ({selectedCourses.length} courses)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function PracticeNewPage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [drillSubmode, setDrillSubmode] = useState<
    "weakness" | "course" | null
  >(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = async (
    mode: PracticeMode,
    options?: {
      drillType?: "weakness" | "course";
      courseIds?: number[];
      conceptIds?: string[];
    }
  ) => {
    // For drill mode, if no drillType provided, show drill selection
    if (mode === PracticeMode.DRILL && !options?.drillType) {
      setSelectedMode(mode);
      return;
    }

    // If drill weakness mode without concept selection, show concept selector
    if (
      mode === PracticeMode.DRILL &&
      options?.drillType === "weakness" &&
      !options?.conceptIds
    ) {
      setSelectedMode(mode);
      setDrillSubmode("weakness");
      return;
    }

    // If drill course mode without course selection, show course selector
    if (
      mode === PracticeMode.DRILL &&
      options?.drillType === "course" &&
      !options?.courseIds
    ) {
      setSelectedMode(mode);
      setDrillSubmode("course");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use a mutable object type for requestBody
      const requestBody: Record<string, unknown> = {
        mode,
        userId: "default",
        batchSize: 10, // Changed from maxQuestions to batchSize for unlimited sessions
        maxConcepts: 5,
      };

      if (mode === PracticeMode.DRILL && options?.drillType) {
        requestBody.drillType = options.drillType;
        if (
          options.drillType === "course" &&
          options.courseIds &&
          options.courseIds.length > 0
        ) {
          // For now, use the first course ID for compatibility
          requestBody.courseId = options.courseIds[0];
        }
        if (options.drillType === "weakness" && options.conceptIds) {
          requestBody.targetConceptIds = options.conceptIds;
        }
      }

      const response = await fetch("/api/practice-new/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to start practice session");
        return;
      }

      setSelectedMode(mode);
      setSessionData(result.data);
    } catch {
      setError("Failed to connect to server");
      console.error("Error starting practice session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionComplete = async () => {
    // Save session as completed
    if (sessionData?.sessionId) {
      try {
        const response = await fetch("/api/practice-new/session-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            userId: "default",
            completionReason: "completed",
          }),
        });

        if (!response.ok) {
          console.error("Failed to save completed session");
        } else {
          console.log("Session completed and saved");
        }
      } catch (error) {
        console.error("Error saving completed session:", error);
      }
    }

    setSelectedMode(null);
    setDrillSubmode(null);
    setSessionData(null);
  };

  const handleBackToModes = async () => {
    // Save progress if there's an active session
    if (sessionData?.sessionId) {
      try {
        const response = await fetch("/api/practice-new/session-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            userId: "default",
            completionReason: "abandoned",
          }),
        });

        if (!response.ok) {
          console.error("Failed to save session progress on early exit");
        } else {
          console.log("Session progress saved on early exit");
        }
      } catch (error) {
        console.error("Error saving session progress:", error);
      }
    }

    setSelectedMode(null);
    setDrillSubmode(null);
    setSessionData(null);
    setError(null);
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Polish Practice System
          </h1>
          <p className="text-gray-600">
            Intelligent concept-based learning with spaced repetition
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
                <button
                  onClick={handleBackToModes}
                  className="ml-4 text-sm underline"
                >
                  Try Again
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedMode && !isLoading && (
          <>
            <PracticeStats />
            <PracticeSelector
              onModeSelect={handleModeSelect}
              isLoading={isLoading}
            />
          </>
        )}

        {selectedMode === PracticeMode.DRILL &&
          drillSubmode === "course" &&
          !sessionData &&
          !isLoading && (
            <CourseSelector
              onCourseSelect={(courseIds) =>
                handleModeSelect(PracticeMode.DRILL, {
                  drillType: "course",
                  courseIds,
                })
              }
              onBack={handleBackToModes}
              isLoading={isLoading}
            />
          )}

        {selectedMode === PracticeMode.DRILL &&
          drillSubmode === "weakness" &&
          !sessionData &&
          !isLoading && (
            <WeakConceptSelector
              onConceptSelect={(conceptIds) =>
                handleModeSelect(PracticeMode.DRILL, {
                  drillType: "weakness",
                  conceptIds,
                })
              }
              onBack={handleBackToModes}
              isLoading={isLoading}
            />
          )}

        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p>Starting practice session...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedMode && sessionData && !isLoading && (
          <PracticeSession
            mode={selectedMode}
            sessionData={sessionData}
            onComplete={handleSessionComplete}
            onBack={handleBackToModes}
          />
        )}
      </div>
    </>
  );
}
