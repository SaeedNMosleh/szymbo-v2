"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export function VisualVocabularyQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  if (!question.imageUrl) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="size-5" />
            <div>
              <p className="font-medium">Image Missing</p>
              <p className="text-sm">
                No image provided for this visual vocabulary question.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Look at the image and answer the question:
          </Label>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <img
                src={question.imageUrl}
                alt="Visual vocabulary exercise"
                className="h-auto w-full rounded-lg border shadow-sm"
                style={{ maxHeight: "400px", objectFit: "contain" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const errorDiv = target.nextSibling as HTMLElement;
                  if (errorDiv) errorDiv.style.display = "block";
                }}
              />
              <div
                className="hidden rounded-lg bg-gray-100 p-8 text-center text-gray-600"
                style={{ display: "none" }}
              >
                <AlertCircle className="mx-auto mb-2 size-8" />
                <p>Failed to load image</p>
              </div>
            </div>
          </div>

          <div className="text-center text-lg font-medium">
            {question.question}
          </div>

          <Input
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer in Polish..."
            disabled={disabled}
            className="text-center text-lg"
            aria-label="Visual vocabulary answer"
          />

          <div className="text-center text-sm text-gray-600">
            <p>Look carefully at the image and provide the answer in Polish.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
