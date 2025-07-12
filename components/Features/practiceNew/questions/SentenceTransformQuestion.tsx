"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";

export function SentenceTransformQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Transform the sentence:
          </Label>

          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="text-lg font-medium text-gray-800">
                {question.question}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center">
            <ArrowRight className="size-5 text-gray-400" />
          </div>

          <Textarea
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type the transformed sentence..."
            className="min-h-[100px]"
            disabled={disabled}
            aria-label="Sentence transformation answer"
          />

          <div className="text-sm text-gray-600">
            <p>
              Transform the sentence according to the instructions (e.g., formal
              to informal, past to present, etc.).
            </p>
            <p className="mt-1">
              Maintain the original meaning while applying the requested
              transformation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
