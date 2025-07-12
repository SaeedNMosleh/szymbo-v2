"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
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
              <Image
                src={question.imageUrl}
                alt="Visual vocabulary exercise"
                width={400} // Specify appropriate width
                height={300} // Specify appropriate height
                className="h-auto w-full rounded-lg border shadow-sm"
              />
              {/* The error handling div is no longer needed with next/image as it handles loading states */}
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
