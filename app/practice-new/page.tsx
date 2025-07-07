// app/practice-new/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PracticeSelector } from "@/components/Features/practiceNew/PracticeSelector";
import { PracticeSession } from "@/components/Features/practiceNew/PracticeSession";
import { PracticeStats } from "@/components/Features/practiceNew/PracticeStats";
import { PracticeMode, QuestionType, QuestionLevel } from "@/lib/enum";

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

export default function PracticeNewPage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = async (mode: PracticeMode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/practice-new/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          userId: "default",
          maxQuestions: 10,
          maxConcepts: 5,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to start practice session");
        return;
      }

      setSelectedMode(mode);
      setSessionData(result.data);
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error starting practice session:", err);
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
