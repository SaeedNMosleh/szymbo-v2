"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ValidationResult } from "../types/questionTypes";

interface QuestionControlsProps {
  validationResult?: ValidationResult | null;
  isValidating: boolean;
  hasAnswer: boolean;
  onSubmit: () => void;
  onRetry: () => void;
  onNext: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  validationError?: string | null;
}

export function QuestionControls({
  validationResult,
  isValidating,
  hasAnswer,
  onSubmit,
  onRetry,
  onNext,
  currentQuestionIndex,
  totalQuestions,
  validationError,
}: QuestionControlsProps) {
  if (validationError) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Validation Error</p>
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validationResult) {
    return (
      <div className="space-y-4">
        <Card
          className={`border-2 ${
            validationResult.isCorrect
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              {validationResult.isCorrect ? (
                <CheckCircle className="mt-0.5 size-5 text-green-600" />
              ) : (
                <XCircle className="mt-0.5 size-5 text-red-600" />
              )}
              <div className="flex-1 space-y-2">
                <p
                  className={`font-medium ${
                    validationResult.isCorrect
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {validationResult.isCorrect ? "Correct!" : "Not quite right"}
                </p>
                {validationResult.feedback && (
                  <p className="text-sm text-gray-700">
                    {validationResult.feedback}
                  </p>
                )}
                {!validationResult.isCorrect &&
                  validationResult.correctAnswer &&
                  validationResult.showFinalAnswer && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="mb-1 text-sm font-medium text-blue-800">
                        Final Answer:
                      </p>
                      <p className="text-sm text-blue-700">
                        {validationResult.correctAnswer}
                      </p>
                    </div>
                  )}
                {!validationResult.isCorrect &&
                  validationResult.attempts < 3 && (
                    <p className="text-sm font-medium text-orange-600">
                      Attempt {validationResult.attempts} of 3
                    </p>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {!validationResult.isCorrect && validationResult.attempts < 3 && (
            <Button variant="outline" onClick={onRetry} className="flex-1">
              Try Again
            </Button>
          )}
          <Button
            onClick={onNext}
            className={
              (!validationResult.isCorrect && validationResult.attempts >= 3) ||
              validationResult.showFinalAnswer
                ? "w-full"
                : "flex-1"
            }
          >
            {currentQuestionIndex < totalQuestions - 1
              ? "Next Question"
              : "Complete Session"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onSubmit}
      disabled={!hasAnswer || isValidating}
      className="w-full"
    >
      {isValidating ? (
        <div className="flex items-center">
          <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
          Checking...
        </div>
      ) : (
        "Submit Answer"
      )}
    </Button>
  );
}
