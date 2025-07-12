"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionControls } from "./ui/QuestionControls";
import { QuestionData, ValidationResult } from "./types/questionTypes";
import { Progress } from "@/components/ui/progress";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { validateAnswer } from "@/lib/LLMPracticeValidation/validateAnswer";
import { IQuestionBank } from "@/datamodels/questionBank.model";
import { ICourse } from "@/datamodels/course.model";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  questionType: string;
  difficulty: string;
  targetConcepts: string[];
  correctAnswer?: string; // This might be empty for newly generated questions
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

interface PracticeSessionProps {
  mode: PracticeMode;
  sessionData: SessionData;
  onComplete: () => void;
  onBack: () => void;
}

// Use ValidationResult from types instead of local interface

export function PracticeSession({
  mode,
  sessionData,
  onComplete,
  onBack,
}: PracticeSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string | string[]>("");
  const [questionResult, setQuestionResult] = useState<ValidationResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [sessionResults, setSessionResults] = useState<ValidationResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + (questionResult ? 1 : 0)) /
      sessionData.questions.length) *
    100;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setValidationError(null);
  }, [currentQuestionIndex]);

  // Enhanced Question Bank Service
  class QuestionBankService {
    static async saveQuestion(
      questionData: Partial<IQuestionBank>
    ): Promise<IQuestionBank | null> {
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `Saving question attempt ${attempt}:`,
            questionData.question?.substring(0, 50)
          );

          const response = await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          if (result.success) {
            console.log(`✅ Question saved successfully: ${result.data.id}`);
            return result.data;
          } else {
            throw new Error(result.error || "Failed to save question");
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Save attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      console.error(
        `Failed to save question after ${maxRetries} attempts:`,
        lastError
      );
      return null;
    }

    static async updateQuestionAnswer(
      questionId: string,
      correctAnswer: string
    ): Promise<boolean> {
      try {
        const response = await fetch("/api/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: questionId,
            correctAnswer,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update question: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ Question ${questionId} updated with correct answer`);
        return result.success;
      } catch (error) {
        console.error(`❌ Failed to update question ${questionId}:`, error);
        return false;
      }
    }

    static async updateQuestionPerformance(
      questionId: string,
      isCorrect: boolean
    ): Promise<boolean> {
      try {
        const response = await fetch("/api/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: questionId,
            isCorrect,
            performanceOnly: true,
          }),
        });

        if (!response.ok) {
          console.error(
            `Failed to update question performance: ${response.status}`
          );
          return false;
        }

        const result = await response.json();
        if (result.success) {
          console.log(`✅ Question ${questionId} performance updated`);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`❌ Error updating question performance:`, error);
        return false;
      }
    }

    static async questionExists(questionId: string): Promise<boolean> {
      try {
        const response = await fetch(`/api/questions?questionId=${questionId}`);
        if (!response.ok) {
          return false;
        }
        const result = await response.json();
        return result.success;
      } catch (error) {
        console.error(`❌ Error checking question existence:`, error);
        return false;
      }
    }
  }

  const updateConceptProgress = async (
    conceptId: string,
    isCorrect: boolean,
    responseTime: number
  ) => {
    try {
      const response = await fetch("/api/practice-new/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          questionId: currentQuestion.id,
          isCorrect,
          responseTime,
          userId: "default",
          sessionId: sessionData.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating concept progress:", error);
      throw error;
    }
  };

  const handleSubmitAnswer = async () => {
    const hasAnswer = Array.isArray(userAnswer) 
      ? userAnswer.some(answer => answer.trim()) 
      : userAnswer.trim();
    
    if (!hasAnswer || isValidating) return;

    setIsValidating(true);
    setValidationError(null);
    const responseTime = Date.now() - questionStartTime;

    try {
      const mockCourse: ICourse = {
        courseId: 0,
        date: new Date(),
        courseType: CourseType.NEW,
        notes: `Concepts: ${currentQuestion.targetConcepts.join(", ")}`,
        practice: currentQuestion.question,
        keywords: currentQuestion.targetConcepts,
        newWords: [],
      };

      const attempts = (questionResult?.attempts || 0) + 1;
      const answerString = Array.isArray(userAnswer) 
        ? userAnswer.join(", ") 
        : userAnswer;
        
      const result = await validateAnswer(
        currentQuestion.question,
        answerString,
        mockCourse,
        attempts
      );

      const newResult: ValidationResult = {
        isCorrect: result.isCorrect || false,
        feedback: result.feedback || "No feedback provided",
        correctAnswer: result.correctAnswer || "",
        attempts,
        responseTime,
      };

      setQuestionResult(newResult);

      // Check if question exists and update accordingly
      const questionExists = await QuestionBankService.questionExists(
        currentQuestion.id
      );

      if (questionExists) {
        // Question exists in bank - update correct answer if we got one
        if (newResult.correctAnswer && newResult.correctAnswer.trim()) {
          const updateSuccess = await QuestionBankService.updateQuestionAnswer(
            currentQuestion.id,
            newResult.correctAnswer
          );

          if (updateSuccess) {
            console.log(
              `✅ Updated question ${currentQuestion.id} with correct answer`
            );
          }
        }

        // Update performance metrics
        const perfUpdateSuccess =
          await QuestionBankService.updateQuestionPerformance(
            currentQuestion.id,
            newResult.isCorrect
          );

        if (perfUpdateSuccess) {
          console.log(
            `✅ Updated performance for question ${currentQuestion.id}`
          );
        }
      } else {
        // Question doesn't exist - this shouldn't happen but let's handle it
        console.warn(
          `⚠️ Question ${currentQuestion.id} not found in bank during answer submission`
        );

        // Try to save it now
        const questionData: Partial<IQuestionBank> = {
          id: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: newResult.correctAnswer,
          questionType: currentQuestion.questionType as QuestionType,
          targetConcepts: currentQuestion.targetConcepts,
          difficulty: currentQuestion.difficulty as QuestionLevel,
          source: "generated",
        };

        const saved = await QuestionBankService.saveQuestion(questionData);
        if (saved) {
          console.log(
            `✅ Retroactively saved question ${currentQuestion.id} to bank`
          );
        }
      }

      // Update concept progress
      for (const conceptId of currentQuestion.targetConcepts) {
        try {
          await updateConceptProgress(
            conceptId,
            newResult.isCorrect,
            responseTime
          );
        } catch (error) {
          console.error(
            `❌ Failed to update progress for concept ${conceptId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("❌ Error validating answer:", error);
      setValidationError("Failed to validate your answer. Please try again.");
      setQuestionResult({
        isCorrect: false,
        feedback:
          "There was an error checking your answer. Please try submitting again.",
        correctAnswer: "",
        attempts: 1,
        responseTime,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextQuestion = () => {
    if (questionResult) {
      setSessionResults([...sessionResults, questionResult]);
    }

    if (currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(Array.isArray(userAnswer) ? [] : "");
      setQuestionResult(null);
      setValidationError(null);
      setQuestionStartTime(Date.now());
    } else {
      // Session complete
      setIsSessionComplete(true);
    }
  };

  const handleRetryQuestion = () => {
    setUserAnswer(Array.isArray(userAnswer) ? [] : "");
    setQuestionResult(null);
    setValidationError(null);
    setQuestionStartTime(Date.now());
  };

  if (isSessionComplete) {
    const finalResults = questionResult
      ? [...sessionResults, questionResult]
      : sessionResults;
    const correctCount = finalResults.filter((r) => r.isCorrect).length;
    const accuracy =
      finalResults.length > 0 ? (correctCount / finalResults.length) * 100 : 0;

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="text-4xl font-bold text-green-600">
              {Math.round(accuracy)}%
            </div>
            <p className="text-lg">
              {correctCount} out of {finalResults.length} questions correct
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionData.metadata.conceptCount}
                </div>
                <p className="text-sm text-gray-600">Concepts Practiced</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {finalResults.length > 0
                    ? Math.round(
                        finalResults.reduce(
                          (sum, r) => sum + r.responseTime,
                          0
                        ) /
                          finalResults.length /
                          1000
                      )
                    : 0}
                  s
                </div>
                <p className="text-sm text-gray-600">Avg. Response Time</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Session Details:</h3>
            <p className="text-sm text-gray-600">
              {sessionData.metadata.rationale}
            </p>
            <p className="text-sm text-gray-600">
              Mode:{" "}
              {mode === PracticeMode.NORMAL
                ? "Smart Practice"
                : mode === PracticeMode.PREVIOUS
                  ? "Previous Questions"
                  : "Drill Session"}
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1">
              New Session
            </Button>
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto mb-2 size-8" />
            <p>No questions available for this session.</p>
            <Button onClick={onBack} className="mt-4">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of{" "}
              {sessionData.questions.length}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {currentQuestion.difficulty}
            </span>
            <span className="rounded bg-blue-100 px-2 py-1">
              {currentQuestion.questionType}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <QuestionRenderer
            question={{
              id: currentQuestion.id,
              question: currentQuestion.question,
              questionType: currentQuestion.questionType as QuestionType,
              difficulty: currentQuestion.difficulty as any,
              targetConcepts: currentQuestion.targetConcepts,
              correctAnswer: currentQuestion.correctAnswer,
              options: (currentQuestion as any).options,
              audioUrl: (currentQuestion as any).audioUrl,
              imageUrl: (currentQuestion as any).imageUrl,
            }}
            userAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            validationResult={questionResult}
            isValidating={isValidating}
            disabled={isValidating || !!questionResult}
            onSubmit={handleSubmitAnswer}
            onRetry={handleRetryQuestion}
            onNext={handleNextQuestion}
            showSubmit={!questionResult}
            showRetry={!!questionResult && !questionResult.isCorrect && questionResult.attempts < 3}
            showNext={!!questionResult}
          />

          <QuestionControls
            validationResult={questionResult}
            isValidating={isValidating}
            hasAnswer={Array.isArray(userAnswer) 
              ? userAnswer.some(answer => answer.trim()) 
              : !!userAnswer.trim()}
            onSubmit={handleSubmitAnswer}
            onRetry={handleRetryQuestion}
            onNext={handleNextQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={sessionData.questions.length}
            validationError={validationError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
