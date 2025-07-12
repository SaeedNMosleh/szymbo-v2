"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export function QAndAQuestion({
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
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-green-600" />
            <Label className="text-base font-medium">
              Answer the question:
            </Label>
          </div>

          <div className="text-lg font-medium">{question.question}</div>

          <Textarea
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer in Polish..."
            className="min-h-[120px]"
            disabled={disabled}
            aria-label="Open-ended question answer"
          />

          <div className="text-sm text-gray-600">
            <p>
              Provide a complete answer in Polish. Express your thoughts clearly
              and use proper grammar.
            </p>
            <p className="mt-1">
              There may be multiple correct ways to answer this question.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
