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
  validationError
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
                {!validationResult.isCorrect && validationResult.correctAnswer && (
                  <p className="text-sm">
                    <strong>Correct answer:</strong> {validationResult.correctAnswer}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {!validationResult.isCorrect && validationResult.attempts < 3 && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="flex-1"
            >
              Try Again
            </Button>
          )}
          <Button onClick={onNext} className="flex-1">
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