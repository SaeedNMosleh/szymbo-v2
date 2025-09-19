"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import Link from "next/link";
import {
  Brain,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  courseId: number;
  date: string;
  keywords: string[];
  courseType: string;
  conceptExtractionStatus?: string;
  extractedConcepts?: string[];
}

interface ExtractionProgress {
  extractionId: string;
  courseId: number;
  percentage: number;
  phase: string;
  currentOperation: string;
  estimatedTimeRemaining?: number;
  chunks?: { total: number; processed: number };
  concepts?: { total: number; extracted: number; similarityChecked: number };
}

const ConceptExtraction = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [extractingCourse, setExtractingCourse] = useState<number | null>(null);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgress | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Apply filter whenever courses or status filter changes
  useEffect(() => {
    if (courses) {
      filterCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, statusFilter]);

  const filterCourses = () => {
    if (statusFilter === "all") {
      setFilteredCourses(courses);
    } else if (statusFilter === "pending") {
      setFilteredCourses(
        courses.filter((course) => course.conceptExtractionStatus === "pending")
      );
    } else if (statusFilter === "in-review") {
      setFilteredCourses(
        courses.filter(
          (course) =>
            course.conceptExtractionStatus === "extracted" ||
            course.conceptExtractionStatus === "in-review"
        )
      );
    } else if (statusFilter === "processing") {
      setFilteredCourses(
        courses.filter(
          (course) =>
            course.conceptExtractionStatus === "analyzing" ||
            course.conceptExtractionStatus === "extracting" ||
            course.conceptExtractionStatus === "similarity_checking"
        )
      );
    } else if (statusFilter === "reviewed") {
      setFilteredCourses(
        courses.filter(
          (course) => course.conceptExtractionStatus === "reviewed"
        )
      );
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const result = await response.json();

      if (result.success && result.data) {
        setCourses(result.data);
      } else {
        console.error(
          "Error fetching courses:",
          result.error || "Unknown error"
        );
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractConcepts = async (courseId: number) => {
    setExtractingCourse(courseId);
    setExtractionProgress(null);

    try {
      // Start chunked extraction with automatic processing
      const response = await fetch("/api/concepts/extract/chunked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          autoProcess: true, // Enable automatic processing
        }),
      });

      const result = await response.json();

      if (result.success) {
        const extractionId = result.data.extractionId;

        // Start polling for progress
        startProgressPolling(extractionId, courseId);
      } else {
        alert(`Failed to start concept extraction: ${result.error}`);
        setExtractingCourse(null);
      }
    } catch (error) {
      console.error("Error starting concept extraction:", error);
      alert("Failed to start concept extraction");
      setExtractingCourse(null);
    }
  };

  const startProgressPolling = (extractionId: string, courseId: number) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set initial progress
    setExtractionProgress({
      extractionId,
      courseId,
      percentage: 5,
      phase: "analyzing",
      currentOperation: "Starting extraction...",
    });

    // Start polling every 2 seconds
    const interval = setInterval(async () => {
      try {
        const statusResponse = await fetch(
          `/api/concepts/extract/status/${extractionId}`
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to get extraction status");
        }

        const statusResult = await statusResponse.json();

        if (statusResult.success) {
          const progress = statusResult.data.progress;

          setExtractionProgress({
            extractionId,
            courseId,
            percentage: progress.percentage,
            phase: progress.phase,
            currentOperation: progress.currentOperation,
            estimatedTimeRemaining: progress.estimatedTimeRemaining,
            chunks: progress.chunks,
            concepts: progress.concepts,
          });

          // Check if extraction is complete
          if (statusResult.data.extractionMetadata?.isComplete) {
            clearInterval(interval);
            setPollingInterval(null);
            setExtractingCourse(null);
            setExtractionProgress(null);

            // Refresh courses to show updated status
            await fetchCourses();

            // Show success message
            alert(
              `Extraction completed! ${progress.concepts?.extracted || 0} concepts extracted.`
            );
          } else if (progress.phase === "error") {
            // Handle error state
            clearInterval(interval);
            setPollingInterval(null);
            setExtractingCourse(null);
            setExtractionProgress(null);
            alert(
              `Extraction failed: ${statusResult.data.error || "Unknown error"}`
            );
          }
        }
      } catch (error) {
        console.error("Error polling extraction status:", error);
        // Continue polling - temporary network issues shouldn't stop progress tracking
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "analyzing":
        return (
          <Badge
            variant="outline"
            className="border-purple-600 text-purple-600"
          >
            Analyzing Content
          </Badge>
        );
      case "extracting":
        return (
          <Badge
            variant="outline"
            className="border-yellow-600 text-yellow-600"
          >
            Extracting Concepts
          </Badge>
        );
      case "similarity_checking":
        return (
          <Badge
            variant="outline"
            className="border-orange-600 text-orange-600"
          >
            Checking Similarities
          </Badge>
        );
      case "extracted":
        return (
          <Badge variant="outline" className="border-blue-600 text-blue-600">
            Ready for Review
          </Badge>
        );
      case "in-review":
        return (
          <Badge variant="outline" className="border-amber-600 text-amber-600">
            In Progress
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="default" className="bg-green-600">
            Concepts Added
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Extraction Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "analyzing":
        return <BarChart3 className="size-4 animate-pulse text-purple-600" />;
      case "extracting":
        return <Brain className="size-4 animate-pulse text-yellow-600" />;
      case "similarity_checking":
        return <Search className="size-4 animate-pulse text-orange-600" />;
      case "extracted":
        return <Clock className="size-4 text-blue-600" />;
      case "in-review":
        return <Brain className="size-4 text-amber-600" />;
      case "reviewed":
        return <CheckCircle className="size-4 text-green-600" />;
      case "error":
        return <AlertCircle className="size-4 text-red-600" />;
      default:
        return <AlertCircle className="size-4 text-gray-400" />;
    }
  };

  const renderProgressBar = (progress: ExtractionProgress) => {
    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Progress: {Math.round(progress.percentage)}%
          </span>
          {progress.estimatedTimeRemaining && (
            <span className="text-gray-500">
              ~{Math.round(progress.estimatedTimeRemaining / 60)}m remaining
            </span>
          )}
        </div>

        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
            }}
          />
        </div>

        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Loader2 className="size-3 animate-spin" />
            <span>{progress.currentOperation}</span>
          </div>

          {progress.chunks && (
            <div className="mt-1">
              Chunks: {progress.chunks.processed}/{progress.chunks.total}
            </div>
          )}

          {progress.concepts && (
            <div className="mt-1">
              Concepts: {progress.concepts.extracted} extracted,{" "}
              {progress.concepts.similarityChecked} similarity checked
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-center text-3xl font-bold">
            Concept Extraction
          </h1>
          <p className="text-center text-gray-600">
            Extract and manage learning concepts from your courses
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 size-5" />
                Course Concepts Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p>Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Brain className="mx-auto mb-4 size-12 text-gray-300" />
                  <p>No courses available. Create a course first!</p>
                  <Link href="/course" className="mt-4 inline-block">
                    <Button>Add Your First Course</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Filter:</span>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="in-review">In Review</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    {filteredCourses.map((course) => (
                      <Card
                        key={course.courseId}
                        className="border border-gray-200"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center">
                                <h3 className="font-semibold">
                                  Course #{course.courseId}
                                </h3>
                                <span className="mx-2 text-gray-300">•</span>
                                <span className="text-sm text-gray-600">
                                  {new Date(course.date).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="mb-3">
                                <p className="mb-1 text-sm text-gray-600">
                                  Keywords:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {course.keywords
                                    .slice(0, 3)
                                    .map((keyword, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  {course.keywords.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{course.keywords.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="mb-3 flex items-center space-x-2">
                                {getStatusIcon(course.conceptExtractionStatus)}
                                {getStatusBadge(course.conceptExtractionStatus)}
                                {course.extractedConcepts &&
                                  course.extractedConcepts.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({course.extractedConcepts.length}{" "}
                                      concepts)
                                    </span>
                                  )}
                              </div>

                              {/* Show progress bar for active extraction */}
                              {extractionProgress &&
                                extractionProgress.courseId ===
                                  course.courseId &&
                                renderProgressBar(extractionProgress)}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            {course.conceptExtractionStatus === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleExtractConcepts(course.courseId)
                                }
                                disabled={extractingCourse === course.courseId}
                                className="flex-1"
                              >
                                {extractingCourse === course.courseId ? (
                                  <div className="flex items-center">
                                    <div className="mr-2 size-3 animate-spin rounded-full border-b-2 border-white"></div>
                                    Extracting...
                                  </div>
                                ) : (
                                  <>
                                    <Brain className="mr-1 size-3" />
                                    Extract Concepts
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Show review button for processing states that haven't reached extracted yet */}
                            {[
                              "analyzing",
                              "extracting",
                              "similarity_checking",
                            ].includes(
                              course.conceptExtractionStatus || ""
                            ) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="flex-1"
                              >
                                <Loader2 className="mr-1 size-3 animate-spin" />
                                Processing...
                              </Button>
                            )}

                            {(course.conceptExtractionStatus === "extracted" ||
                              course.conceptExtractionStatus ===
                                "in-review") && (
                              <Link
                                href={`/concept-review?courseId=${course.courseId}`}
                                className="flex-1"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  {course.conceptExtractionStatus ===
                                  "in-review"
                                    ? "Continue Review"
                                    : "Review Concepts"}
                                </Button>
                              </Link>
                            )}

                            {course.conceptExtractionStatus === "reviewed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="flex-1"
                              >
                                <CheckCircle className="mr-1 size-3" />
                                Completed
                              </Button>
                            )}

                            {course.conceptExtractionStatus === "error" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleExtractConcepts(course.courseId)
                                }
                                disabled={extractingCourse === course.courseId}
                                variant="outline"
                                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <AlertCircle className="mr-1 size-3" />
                                Retry Extraction
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <Link href="/concept-review">
                      <Button variant="outline" className="w-full">
                        <Brain className="mr-2 size-4" />
                        Manage All Concepts
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ConceptExtraction;
