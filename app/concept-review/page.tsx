"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConceptReview } from "@/components/Features/conceptReview/ConceptReview";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";

interface Course {
  courseId: number;
  date: string;
  keywords: string[];
  courseType: string;
  conceptExtractionStatus?: string;
  extractedConcepts?: string[];
}

const CourseSelector = ({ onCourseSelect }: { onCourseSelect: (courseId: number) => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const result = await response.json();
      
      if (result.success && result.data) {
        // Filter to show only courses with "completed" status (ready for review)
        const reviewableCourses = result.data.filter(
          (course: Course) => course.conceptExtractionStatus === "completed"
        );
        setCourses(reviewableCourses);
      } else {
        console.error("Error fetching courses:", result.error || "Unknown error");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p>Loading courses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="pt-6">
          <div className="py-8 text-center text-gray-500">
            <Brain className="mx-auto mb-4 size-12 text-gray-300" />
            <p className="mb-4">No courses ready for concept review.</p>
            <p className="mb-2 text-sm">To review concepts, you need courses with extracted concepts.</p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>1. Create courses in the Course Management page</p>
              <p>2. Extract concepts in the Concept Extraction page</p>
              <p>3. Return here to review and approve concepts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 size-5" />
          Select Course for Concept Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.courseId} className="border border-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center">
                      <h3 className="font-semibold">Course #{course.courseId}</h3>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-600">
                        {new Date(course.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="mb-1 text-sm text-gray-600">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {course.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
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
                      {course.extractedConcepts && course.extractedConcepts.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({course.extractedConcepts.length} concepts)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={() => onCourseSelect(course.courseId)}
                    className="w-full"
                  >
                    Review Concepts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ConceptReviewContent = () => {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courseIdParam ? parseInt(courseIdParam) : null
  );

  const handleReviewComplete = () => {
    console.log("Concept review completed successfully");
    // Go back to course selection
    setSelectedCourseId(null);
  };

  const handleBackToCourseSelection = () => {
    setSelectedCourseId(null);
  };

  if (!selectedCourseId) {
    return <CourseSelector onCourseSelect={setSelectedCourseId} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBackToCourseSelection}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Course Selection
        </Button>
      </div>
      <ConceptReview
        courseId={selectedCourseId}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  );
};

const ConceptReviewPage = () => {
  return (
    <>
      <Navigation />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="mb-4 text-center text-3xl font-bold">
            Concept Review System
          </h1>
          <p className="mx-auto max-w-2xl text-center text-gray-600">
            Review and approve concepts extracted from your Polish language
            courses. This helps maintain quality and consistency in your learning
            system.
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ConceptReviewContent />
        </Suspense>
      </main>
    </>
  );
};

export default ConceptReviewPage;
