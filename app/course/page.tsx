// app/course/page.tsx (Updated with concept extraction)
"use client";

import { useState, useEffect } from "react";
import { AddCourse } from "@/components/Features/addCourse/AddCourse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Brain, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Course {
  courseId: number;
  date: string;
  keywords: string[];
  courseType: string;
  conceptExtractionStatus?: string;
  extractedConcepts?: string[];
}

const Course = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [extractingCourse, setExtractingCourse] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
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
        // Refresh courses to show updated status
        await fetchCourses();
        // Optionally redirect to review page
        // window.location.href = `/concept-review?courseId=${courseId}`;
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
      case "completed":
        return (
          <Badge variant="outline" className="border-blue-600 text-blue-600">
            Ready for Review
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
      case "completed":
        return <Clock className="size-4 text-blue-600" />;
      case "reviewed":
        return <CheckCircle className="size-4 text-green-600" />;
      default:
        return <AlertCircle className="size-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Course Management
        </h1>
        <p className="text-center text-gray-600">
          Add courses and extract concepts for intelligent practice
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Add Course Section */}
        <div>
          <AddCourse />
        </div>

        {/* Existing Courses Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 size-5" />
                Existing Courses
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
                  <p>No courses yet. Add your first course to get started!</p>
                </div>
              ) : (
                <div className="max-h-96 space-y-4 overflow-y-auto">
                  {courses.map((course) => (
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
                                  <Badge variant="outline" className="text-xs">
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
                                    ({course.extractedConcepts.length} concepts)
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

                          {course.conceptExtractionStatus === "completed" && (
                            <Link
                              href={`/concept-review?courseId=${course.courseId}`}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                Review Concepts
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
              )}

              {courses.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <Link href="/concept-review">
                    <Button variant="outline" className="w-full">
                      <Brain className="mr-2 size-4" />
                      Manage All Concepts
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Course;
