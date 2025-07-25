"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import Link from "next/link";
import { Brain, CheckCircle, Clock, AlertCircle } from "lucide-react";
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

const ConceptExtraction = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [extractingCourse, setExtractingCourse] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

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
    try {
      const response = await fetch("/api/concepts/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCourses();
      } else {
        alert(`Failed to extract concepts: ${result.error}`);
      }
    } catch (error) {
      console.error("Error extracting concepts:", error);
      alert("Failed to extract concepts");
    } finally {
      setExtractingCourse(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
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
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "extracted":
        return <Clock className="size-4 text-blue-600" />;
      case "in-review":
        return <Brain className="size-4 text-amber-600" />;
      case "reviewed":
        return <CheckCircle className="size-4 text-green-600" />;
      default:
        return <AlertCircle className="size-4 text-gray-400" />;
    }
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
