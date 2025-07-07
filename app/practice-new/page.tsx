// app/practice-new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PracticeSelector } from "@/components/Features/practiceNew/PracticeSelector";
import { PracticeSession } from "@/components/Features/practiceNew/PracticeSession";
import { PracticeStats } from "@/components/Features/practiceNew/PracticeStats";
import { PracticeMode } from "@/lib/enum";

export default function PracticeNewPage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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