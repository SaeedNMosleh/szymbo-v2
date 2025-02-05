"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  generateQuestion,
  validateAnswer,
} from "@/lib/LLMPracticeValidation/practiceValidation";
import type { ICourse } from "@/datamodels/course.model";
import type {
  IPracticeSession,
  IInteraction,
} from "@/datamodels/practice.model";

export function Practice() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [practiceSession, setPracticeSession] =
    useState<IPracticeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      generateNewQuestion();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(
        data.sort(
          (a: ICourse, b: ICourse) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    } catch (err) {
      setError("Failed to load courses. Please try again later.");
      console.error("Error fetching courses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPracticeSession = async (course: ICourse) => {
    setSelectedCourse(course);
    const newSession: IPracticeSession = {
      courseId: course.courseId,
      startedAt: new Date(),
      completedAt: new Date(),
      interactions: [],
      metrics: {
        vocabulary: { newWords: { attempted: 0, correct: 0, weakItems: [] } },
        grammar: { concepts: [] },
        accuracy: 0,
        avgResponseTime: 0,
      },
      srsSchedule: { nextReviewDate: new Date(), easinessFactor: 2.5 },
    };
    setPracticeSession(newSession);
  };

  const generateNewQuestion = async () => {
    console.log(selectedCourse);
    if (!selectedCourse) return;
    const question = await generateQuestion(selectedCourse);
    setCurrentQuestion(question);
    setUserAnswer("");
    setFeedback("");
    setShowAnswer(false);
  };

  const handleAnswerSubmit = async () => {
    if (!practiceSession || !selectedCourse) return;
    const startTime = Date.now();
    const result = await validateAnswer(
      currentQuestion,
      userAnswer,
      selectedCourse
    );
    const endTime = Date.now();

    const newInteraction: IInteraction = {
      questionType: result.questionType,
      question: currentQuestion,
      userAnswer,
      correctAnswer: result.correctAnswer,
      responseTime: endTime - startTime,
      confidenceLevel: result.confidenceLevel,
      errorType: result.errorType,
    };

    setPracticeSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        interactions: [...prev.interactions, newInteraction],
      };
    });

    setFeedback(result.feedback);
    if (!result.isCorrect) {
      setShowAnswer(true);
    } else {
      await generateNewQuestion();
    }
  };

  const endPracticeSession = async () => {
    if (!practiceSession || !selectedCourse) return;
    const completedSession = {
      ...practiceSession,
      completedAt: new Date(),
    };
    // Calculate metrics and update SRS schedule
    const updatedSession = await calculateMetricsAndSchedule(completedSession);
    // Save practice session to database
    await savePracticeSession(updatedSession);
    // Show summary
    showPracticeSummary(updatedSession);
    // Reset state
    setSelectedCourse(null);
    setPracticeSession(null);
    setCurrentQuestion("");
    setUserAnswer("");
    setFeedback("");
    setShowAnswer(false);
    // Refresh courses to update next practice dates
    await fetchCourses();
  };

  const calculateMetricsAndSchedule = async (session: IPracticeSession) => {
    // Implement metric calculation and SRS scheduling logic here
    // This is a placeholder implementation
    const updatedSession = { ...session };
    updatedSession.metrics.accuracy =
      session.interactions.filter((i) => i.userAnswer === i.correctAnswer)
        .length / session.interactions.length;
    updatedSession.metrics.avgResponseTime =
      session.interactions.reduce((sum, i) => sum + i.responseTime, 0) /
      session.interactions.length;
    updatedSession.srsSchedule.nextReviewDate = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ); // Next day for simplicity
    return updatedSession;
  };

  const savePracticeSession = async (session: IPracticeSession) => {
    try {
      const response = await fetch("/api/practice-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error("Failed to save practice session");
      }

      const data = await response.json();

      console.log("Practice session saved:", data);
    } catch (error) {
      console.error("Error saving practice session:", error);
    }
  };

  const showPracticeSummary = (session: IPracticeSession) => {
    alert(`Practice session completed!
    Accuracy: ${(session.metrics.accuracy * 100).toFixed(2)}%
    Average response time: ${session.metrics.avgResponseTime.toFixed(2)}ms
    Next review date: ${session.srsSchedule.nextReviewDate.toLocaleDateString()}`);
  };

  return (
    <Card className="mx-auto mt-8 w-[800px]">
      <CardHeader>
        <CardTitle>
          {selectedCourse ? "Practice Session" : "Course Dashboard"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div>Loading courses...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !selectedCourse ? (
            courses.length > 0 ? (
              courses.map((course) => (
                <Button
                  key={course.courseId}
                  onClick={() => startPracticeSession(course)}
                  className="mb-2 w-full justify-start"
                >
                  {course.courseType} -{" "}
                  {new Date(course.date).toLocaleDateString()} - Next practice:{" "}
                  {course.nextPracticeDate
                    ? new Date(course.nextPracticeDate).toLocaleDateString()
                    : "Not scheduled"}
                </Button>
              ))
            ) : (
              <div>
                No courses available. Add some courses to start practicing!
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div>{currentQuestion}</div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full rounded border p-2"
                rows={4}
              />
              <div>{feedback}</div>
              {showAnswer && (
                <div>
                  <strong>Correct Answer:</strong>{" "}
                  {
                    practiceSession?.interactions[
                      practiceSession.interactions.length - 1
                    ].correctAnswer
                  }
                </div>
              )}
              <div className="flex justify-between">
                <Button onClick={handleAnswerSubmit} disabled={!userAnswer}>
                  Submit Answer
                </Button>
                <Button onClick={generateNewQuestion}>Next Question</Button>
              </div>
            </div>
          )}
        </ScrollArea>
        {selectedCourse && (
          <Button onClick={endPracticeSession} className="mt-4 w-full">
            End Practice Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
