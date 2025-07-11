// app/practice-new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PracticeSelector } from "@/components/Features/practiceNew/PracticeSelector";
import { PracticeSession } from "@/components/Features/practiceNew/PracticeSession";
import { PracticeStats } from "@/components/Features/practiceNew/PracticeStats";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { ArrowLeft } from "lucide-react";

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

function CourseSelector({
  onCourseSelect,
  onBack,
  isLoading,
}: {
  onCourseSelect: (courseId: number) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Practice Modes
          </Button>
          <h2 className="text-xl font-semibold">Select Course to Practice</h2>
        </div>

        {courses.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-gray-600">No courses available</p>
            <Button onClick={onBack}>Back to Practice Modes</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.courseId}
                className="cursor-pointer rounded-lg border p-4 hover:bg-gray-50"
                onClick={() => onCourseSelect(course.courseId)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      {course.courseType} -{" "}
                      {new Date(course.date).toLocaleDateString()}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {course.notes.substring(0, 100)}...
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {course.keywords.slice(0, 3).map((keyword, idx) => (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PracticeNewPage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = async (mode: PracticeMode, courseId?: number) => {
    // For course mode, if no courseId provided, just set the mode for course selection
    if (mode === PracticeMode.COURSE && !courseId) {
      setSelectedMode(mode);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use a mutable object type for requestBody
      const requestBody: Record<string, unknown> = {
        mode,
        userId: "default",
        maxQuestions: 10,
        maxConcepts: 5,
      };

      if (mode === PracticeMode.COURSE && courseId) {
        requestBody.courseId = courseId;
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

  const handleSessionComplete = () => {
    setSelectedMode(null);
    setSessionData(null);
  };

  const handleBackToModes = () => {
    setSelectedMode(null);
    setSessionData(null);
    setError(null);
  };

  return (
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

      {selectedMode === PracticeMode.COURSE && !sessionData && !isLoading && (
        <CourseSelector
          onCourseSelect={(courseId) =>
            handleModeSelect(PracticeMode.COURSE, courseId)
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
  );
}
