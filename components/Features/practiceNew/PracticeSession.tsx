"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionControls } from "./ui/QuestionControls";
import { ValidationResult } from "./types/questionTypes";
import { Progress } from "@/components/ui/progress";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
} from "@/lib/enum";
// Removed: Client should use server-side validation API only
import { IQuestionBank } from "@/datamodels/questionBank.model";
import { ArrowLeft, AlertCircle } from "lucide-react";

// Helper function to safely map string questionType to enum
function mapQuestionType(questionType: string): QuestionType {
  // Direct enum value lookup
  const enumValues = Object.values(QuestionType) as string[];
  if (enumValues.includes(questionType)) {
    return questionType as QuestionType;
  }

  // Handle potential mismatches or legacy formats
  const typeMap: Record<string, QuestionType> = {
    q_a: QuestionType.Q_A,
    qa: QuestionType.Q_A,
    question_answer: QuestionType.Q_A,
    basic_cloze: QuestionType.BASIC_CLOZE,
    multi_cloze: QuestionType.MULTI_CLOZE,
    vocab_choice: QuestionType.VOCAB_CHOICE,
    multi_select: QuestionType.MULTI_SELECT,
    case_transform: QuestionType.CASE_TRANSFORM,
    translation_pl: QuestionType.TRANSLATION_PL,
    translation_en: QuestionType.TRANSLATION_EN,
  };

  const mapped = typeMap[questionType.toLowerCase()];
  if (mapped) {
    console.warn(`Mapped questionType "${questionType}" to "${mapped}"`);
    return mapped;
  }

  // Default fallback
  console.warn(`Unknown questionType "${questionType}", falling back to Q_A`);
  return QuestionType.Q_A;
}

interface Question {
  id: string;
  question: string;
  questionType: string;
  difficulty: string;
  targetConcepts: string[];
  correctAnswer?: string; // This might be empty for newly generated questions,
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
}

interface SessionData {
  sessionId: string;
  conceptIds: string[];
  questions: Question[];
  metadata: {
    mode: PracticeMode;
    batchSize?: number;
    isUnlimitedSession?: boolean;
    initialBatchSize?: number;
    totalQuestions: number;
    conceptCount: number;
    rationale: string;
  };
}

// Unlimited session state
interface UnlimitedSessionState {
  totalAnswered: number;
  currentBatch: number;
  questionsBuffer: Question[];
  isDueQueueCleared: boolean;
  totalDueConcepts: number;
  motivationalMilestone: number;
  backgroundLoading: boolean;
  showMotivationalOverlay: boolean;
  motivationalMessage: string;
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
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [sessionResults, setSessionResults] = useState<ValidationResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Unlimited session state
  const [unlimitedState, setUnlimitedState] = useState<UnlimitedSessionState>({
    totalAnswered: 0,
    currentBatch: 1,
    questionsBuffer: sessionData.questions,
    isDueQueueCleared: false,
    totalDueConcepts: 0,
    motivationalMilestone: 10,
    backgroundLoading: false,
    showMotivationalOverlay: false,
    motivationalMessage: "",
  });

  // Background loading for next batch
  const loadNextBatch = React.useCallback(async () => {
    if (unlimitedState.backgroundLoading) return;

    console.log("🔄 Starting background batch loading...");
    
    setUnlimitedState(prev => ({ ...prev, backgroundLoading: true }));

    try {
      const response = await fetch("/api/practice-new/session-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          currentQuestionCount: unlimitedState.totalAnswered,
          batchSize: sessionData.metadata.batchSize || 10,
          userId: "default",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newQuestions = result.data.questions;
          console.log(`✅ Loaded ${newQuestions.length} questions in background`);

          setUnlimitedState(prev => ({
            ...prev,
            questionsBuffer: [...prev.questionsBuffer, ...newQuestions],
            isDueQueueCleared: result.data.metadata.isDueQueueCleared,
            totalDueConcepts: result.data.metadata.totalDueConcepts,
            backgroundLoading: false,
          }));
        }
      }
    } catch (error) {
      console.error("❌ Background loading failed:", error);
      setUnlimitedState(prev => ({ ...prev, backgroundLoading: false }));
    }
  }, [sessionData.sessionId, sessionData.metadata.batchSize, unlimitedState.totalAnswered, unlimitedState.backgroundLoading]);

  const isUnlimitedSession = sessionData.metadata.isUnlimitedSession || false;
  const currentQuestion = unlimitedState.questionsBuffer[currentQuestionIndex];
  
  // For unlimited sessions, we don't calculate progress as a percentage
  const progress = isUnlimitedSession ? 0 : 
    ((currentQuestionIndex + (questionResult ? 1 : 0)) /
      sessionData.questions.length) *
    100;

  // Fetch initial due concept count when session starts
  useEffect(() => {
    if (isUnlimitedSession) {
      const fetchInitialDueCount = async () => {
        try {
          const response = await fetch("/api/practice-new/concept-due?userId=default&realTimeCount=true");
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const dueData = result.data;
              setUnlimitedState(prev => ({
                ...prev,
                isDueQueueCleared: dueData.isDueQueueCleared,
                totalDueConcepts: dueData.totalDue,
              }));
              console.log(`📊 Initial due concepts loaded: ${dueData.totalDue} total`);
            }
          }
        } catch (error) {
          console.error("❌ Error fetching initial due count:", error);
        }
      };
      
      fetchInitialDueCount();
    }
  }, [isUnlimitedSession]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setValidationError(null);
    setCurrentAttempts(0); // Reset attempts for new question

    // Background loading logic for unlimited sessions
    if (isUnlimitedSession && !unlimitedState.backgroundLoading) {
      const questionsRemaining = unlimitedState.questionsBuffer.length - currentQuestionIndex - 1;
      
      // Start background loading when 2 questions remain in current batch
      if (questionsRemaining <= 2) {
        loadNextBatch();
      }
    }
  }, [currentQuestionIndex, isUnlimitedSession, unlimitedState.backgroundLoading, unlimitedState.questionsBuffer.length, loadNextBatch]);

  // Get motivational messages
  const getMotivationalMessage = (milestone: number, isDueCleared: boolean): string => {
    const messages = [
      "🎉 Great progress! Loading more questions...",
      "🌟 You're doing amazing! Preparing next set...",
      "💪 Keep up the excellent work! Getting more challenges...",
      "🚀 Fantastic effort! Loading fresh questions...",
      "⭐ Outstanding progress! Preparing next batch...",
    ];

    if (isDueCleared) {
      return "🌟 All due concepts completed! Continuing with random practice...";
    }

    const randomIndex = (milestone / 10 - 1) % messages.length;
    return messages[randomIndex];
  };

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

    // REMOVED: updateQuestionAnswer method - correctAnswer is now immutable

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
      ? userAnswer.some((answer) => answer.trim())
      : userAnswer.trim();

    if (!hasAnswer || isValidating) return;

    setIsValidating(true);
    setValidationError(null);
    const responseTime = Date.now() - questionStartTime;

    const attempts = currentAttempts + 1;
    setCurrentAttempts(attempts);

    try {
      // Use server-side validation API that ensures immutable correctAnswer
      const response = await fetch("/api/practice-new/session-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          questionId: currentQuestion.id,
          userAnswer,
          responseTime,
          userId: "default",
          attemptNumber: attempts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();

      const newResult: ValidationResult = {
        isCorrect: result.data.isCorrect || false,
        feedback: result.data.feedback || "No feedback provided",
        correctAnswer: result.data.correctAnswer || "", // Only show correct answer if server provides it (after 3rd attempt)
        attempts,
        responseTime,
        previousAnswer: userAnswer,
        showFinalAnswer: (!result.data.isCorrect && attempts >= 3) || result.data.isQuestionCompleted,
      };

      setQuestionResult(newResult);

      // Update unlimited session state with real-time due concept data
      if (isUnlimitedSession && result.data.dueConceptsStatus) {
        const dueStatus = result.data.dueConceptsStatus;
        setUnlimitedState(prev => ({
          ...prev,
          isDueQueueCleared: dueStatus.isDueQueueCleared,
          totalDueConcepts: dueStatus.totalDue,
        }));
        
        console.log(`📊 Updated due concepts: ${dueStatus.totalDue} total, cleared: ${dueStatus.isDueQueueCleared}`);
      }

      // Update performance metrics (performance tracking is still allowed)
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

    const totalAnswered = unlimitedState.totalAnswered + 1;
    
    // Update unlimited session state
    setUnlimitedState(prev => ({
      ...prev,
      totalAnswered,
    }));

    if (isUnlimitedSession) {
      // Unlimited session logic
      const nextQuestionIndex = currentQuestionIndex + 1;
      
      // Check if we're at a motivational milestone (every 10th question)
      if (totalAnswered % 10 === 0) {
        const message = getMotivationalMessage(totalAnswered, unlimitedState.isDueQueueCleared);
        
        setUnlimitedState(prev => ({
          ...prev,
          showMotivationalOverlay: true,
          motivationalMessage: message,
          motivationalMilestone: totalAnswered + 10,
        }));

        // Hide overlay after 2 seconds and continue
        setTimeout(() => {
          setUnlimitedState(prev => ({
            ...prev,
            showMotivationalOverlay: false,
          }));
        }, 2000);
      }

      // Check if we have more questions in buffer
      if (nextQuestionIndex < unlimitedState.questionsBuffer.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setUserAnswer(Array.isArray(userAnswer) ? [] : "");
        setQuestionResult(null);
        setValidationError(null);
        setQuestionStartTime(Date.now());
      } else {
        // This shouldn't happen with proper background loading
        console.warn("⚠️ Ran out of questions in unlimited session");
        loadNextBatch(); // Emergency batch load
      }
    } else {
      // Legacy finite session logic
      if (currentQuestionIndex < sessionData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserAnswer(Array.isArray(userAnswer) ? [] : "");
        setQuestionResult(null);
        setValidationError(null);
        setQuestionStartTime(Date.now());
      } else {
        // Finite session complete - unlimited sessions never complete
        console.log("Finite session complete");
      }
    }
  };

  const handleRetryQuestion = () => {
    // Preserve the previous answer if available
    if (questionResult?.previousAnswer) {
      setUserAnswer(questionResult.previousAnswer);
    }
    setQuestionResult(null);
    setValidationError(null);
    setQuestionStartTime(Date.now());
    // Keep currentAttempts - don't reset it during retry
  };

  // Unlimited sessions never show completion screen - they run forever
  // Only finite sessions (legacy) would show completion
  const shouldShowCompletion = !isUnlimitedSession && currentQuestionIndex >= sessionData.questions.length;
  
  if (shouldShowCompletion) {
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
      {/* Motivational Overlay */}
      {unlimitedState.showMotivationalOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 text-4xl">{unlimitedState.motivationalMessage.split(' ')[0]}</div>
              <p className="text-lg font-semibold">{unlimitedState.motivationalMessage.substring(2)}</p>
              <div className="mt-4">
                <div className="mx-auto h-2 w-12 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            {isUnlimitedSession ? (
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  Question {unlimitedState.totalAnswered + 1}
                </div>
                <div className="text-xs text-gray-600">
                  {unlimitedState.isDueQueueCleared 
                    ? "🌟 All due completed!" 
                    : `${unlimitedState.totalDueConcepts} concepts still due`}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of{" "}
                {sessionData.questions.length}
              </div>
            )}
          </div>
          {!isUnlimitedSession && <Progress value={progress} className="w-full" />}
          {isUnlimitedSession && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>Unlimited Practice Session</span>
              {unlimitedState.backgroundLoading && (
                <span className="flex items-center gap-1">
                  <div className="size-2 animate-pulse rounded-full bg-blue-500"></div>
                  Loading next batch...
                </span>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <></>
        </CardHeader>

        <CardContent className="space-y-4">
          <QuestionRenderer
            question={{
              id: currentQuestion.id,
              question: currentQuestion.question,
              questionType: mapQuestionType(currentQuestion.questionType),
              difficulty: currentQuestion.difficulty as QuestionLevel,
              targetConcepts: currentQuestion.targetConcepts,
              correctAnswer: currentQuestion.correctAnswer,
              options: (currentQuestion as { options?: string[] }).options,
              audioUrl: (currentQuestion as { audioUrl?: string }).audioUrl,
              imageUrl: (currentQuestion as { imageUrl?: string }).imageUrl,
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
            showRetry={
              !!questionResult &&
              !questionResult.isCorrect &&
              questionResult.attempts < 3
            }
            showNext={!!questionResult}
          />

          {(() => {
            const questionType = mapQuestionType(currentQuestion.questionType);
            const missingOptions =
              (questionType === QuestionType.MULTI_SELECT ||
                questionType === QuestionType.VOCAB_CHOICE) &&
              (!currentQuestion.options ||
                currentQuestion.options.length === 0);
            const missingAudio =
              questionType === QuestionType.AUDIO_COMPREHENSION && !currentQuestion.audioUrl;

            if (missingOptions || missingAudio) {
              return (
                <div>
                  {missingAudio && (
                    <p className="mb-2 text-red-600">
                      No audio file provided for this question.
                    </p>
                  )}
                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                  >
                    Skip Question
                  </button>
                </div>
              );
            }

            return null;
          })()}

          <QuestionControls
            validationResult={questionResult}
            isValidating={isValidating}
            hasAnswer={
              Array.isArray(userAnswer)
                ? userAnswer.some((answer) => answer.trim())
                : !!userAnswer.trim()
            }
            onSubmit={handleSubmitAnswer}
            onRetry={handleRetryQuestion}
            onNext={handleNextQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={isUnlimitedSession ? unlimitedState.totalAnswered + 1 : sessionData.questions.length}
            validationError={validationError}
            isUnlimitedSession={isUnlimitedSession}
          />
        </CardContent>
      </Card>
    </div>
  );
}
