"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";

export function DialogueCompleteQuestion({
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
            <MessageCircle className="size-5 text-purple-600" />
            <Label className="text-base font-medium">
              Complete the dialogue:
            </Label>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="whitespace-pre-line text-gray-800">
                {question.question}
              </div>
            </CardContent>
          </Card>

          <Textarea
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Complete the conversation..."
            className="min-h-[100px]"
            disabled={disabled}
            aria-label="Dialogue completion answer"
          />

          <div className="text-sm text-gray-600">
            <p>
              Complete the dialogue in a natural and contextually appropriate
              way.
            </p>
            <p className="mt-1">
              Consider the conversational flow, politeness level, and cultural
              context.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
