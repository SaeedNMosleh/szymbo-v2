"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateQuestion } from "@/lib/LLMPracticeValidation/generateQuestion";
import { validateAnswer } from "@/lib/LLMPracticeValidation/validateAnswer";
import type { ICourse } from "@/datamodels/course.model";
import type { IPracticeSession } from "@/datamodels/practice.model";
import type { IQuestionAnswer } from "@/datamodels/questionAnswer.model";
import { PracticeSummary } from "@/components/Features/practiceSummary/PracticeSummary";
import { QuestionLevel } from "@/lib/enum";

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
  const [attempts, setAttempts] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const generateNewQuestion = useCallback(async () => {
    if (!selectedCourse) return;
    const previousQuestions = practiceSession
      ? practiceSession.questionAnswers.map((qa) => qa.question)
      : [];
    const question = await generateQuestion(selectedCourse, previousQuestions);
    setCurrentQuestion(question);
    setUserAnswer("");
    setFeedback("");
    setShowAnswer(false);
    setAttempts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceSession]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      generateNewQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      questionAnswers: [],
      metrics: {
        vocabulary: { newWords: { attempted: 0, correct: 0, weakItems: [] } },
        grammar: { concepts: [] },
        accuracy: 0,
        avgResponseTime: 0,
      },
    };
    setPracticeSession(newSession);
  };

  const handleAnswerSubmit = async () => {
    if (!practiceSession || !selectedCourse) return;
    const startTime = Date.now();
    const result = await validateAnswer(
      currentQuestion,
      userAnswer,
      selectedCourse,
      attempts + 1
    );
    const endTime = Date.now();

    const newQuestionAnswer: IQuestionAnswer = {
      question: currentQuestion,
      correctAnswer: result.correctAnswer || "",
      userAnswers: [
        ...(practiceSession.questionAnswers.find(
          (qa) => qa.question === currentQuestion
        )?.userAnswers || []),
        userAnswer,
      ],
      keywords: result.keywords || [],
      category: result.category || "",
      questionType: result.questionType!,
      courseId: selectedCourse.courseId,
      analysisDetails: {
        mistakeType: result.analysisDetails?.mistakeType || null,
        confidence: result.analysisDetails?.confidence || 0,
        questionLevel:
          result.analysisDetails?.questionLevel ?? QuestionLevel.A1,
        responseTime: endTime - startTime,
      },
      isCorrect: result.isCorrect || false,
      feedback: result.feedback || "",
    };

    setPracticeSession((prev) => {
      if (!prev) return null;
      const updatedQuestionAnswers = [...prev.questionAnswers];
      const existingIndex = updatedQuestionAnswers.findIndex(
        (qa) => qa.question === currentQuestion
      );
      if (existingIndex !== -1) {
        updatedQuestionAnswers[existingIndex] = newQuestionAnswer;
      } else {
        updatedQuestionAnswers.push(newQuestionAnswer);
      }
      return {
        ...prev,
        questionAnswers: updatedQuestionAnswers,
      };
    });

    setFeedback(result.feedback || "");
    setAttempts((prev) => prev + 1);
    setShowAnswer(true);
  };

  const endPracticeSession = async () => {
    if (!practiceSession || !selectedCourse) return;
    const completedSession = {
      ...practiceSession,
      completedAt: new Date(),
    };
    const updatedSession = await calculateMetrics(completedSession);
    console.log("Updated session:", updatedSession);
    const saveResult = await savePracticeSession(updatedSession);
    setShowSummary(true);
    setSaveStatus(
      saveResult.success
        ? "Practice session saved successfully!"
        : "Failed to save practice session."
    );
  };

  const calculateMetrics = async (session: IPracticeSession) => {
    const updatedSession = { ...session };
    updatedSession.metrics.accuracy =
      session.questionAnswers.filter((qa) => qa.isCorrect).length /
      session.questionAnswers.length;
    updatedSession.metrics.avgResponseTime =
      session.questionAnswers.reduce(
        (sum, qa) => sum + qa.analysisDetails.responseTime,
        0
      ) / session.questionAnswers.length;
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
      return { success: true };
    } catch (error) {
      console.error("Error saving practice session:", error);
      return { success: false };
    }
  };

  const goToCourses =async () => {
    setSelectedCourse(null);
    setPracticeSession(null);
    setShowSummary(false);
    setSaveStatus(null);
    await fetchCourses();
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
          {showSummary ? (
            <>
              <PracticeSummary session={practiceSession!} />
              {saveStatus && (
                <p className="mt-4 text-center font-bold">{saveStatus}</p>
              )}
              <Button onClick={goToCourses} className="mt-4 w-full">
                Go to Courses
              </Button>
            </>
          ) : isLoading ? (
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
                  {new Date(course.date).toLocaleDateString()} - Course ID:{" "}
                  {course.courseId} - Fluency: {course.fluency} - Practices:{" "}
                  {course.numberOfPractices}
                </Button>
              ))
            ) : (
              <div>
                No courses available. Add some courses to start practicing!
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="my-4 rounded border border-blue-300 bg-blue-100 p-4 text-center text-2xl text-gray-800 shadow-md">
                {currentQuestion}
              </div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full rounded border p-2"
                rows={4}
              />
              <div>{feedback}</div>
              <div>Attempts: {attempts}/3</div>
              {showAnswer && attempts === 3 && (
                <div>
                  <strong>Correct Answer:</strong>{" "}
                  {
                    practiceSession?.questionAnswers[
                      practiceSession.questionAnswers.length - 1
                    ].correctAnswer
                  }
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswer || attempts >= 3}
                >
                  Submit Answer
                </Button>
                <Button onClick={generateNewQuestion}>Next Question</Button>
              </div>
            </div>
          )}
        </ScrollArea>
        {selectedCourse && !showSummary && (
          <Button onClick={endPracticeSession} className="mt-4 w-full">
            End Practice Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
