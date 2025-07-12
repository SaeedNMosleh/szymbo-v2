"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe } from "lucide-react";

export function CulturalContextQuestion({
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
            <Globe className="size-5 text-indigo-600" />
            <Label className="text-base font-medium">Cultural Context:</Label>
          </div>

          <div className="text-lg font-medium">{question.question}</div>

          <Textarea
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Share your knowledge about Polish culture..."
            className="min-h-[120px]"
            disabled={disabled}
            aria-label="Cultural context answer"
          />

          <div className="text-sm text-gray-600">
            <p>
              Answer based on your knowledge of Polish culture, traditions, or
              social norms.
            </p>
            <p className="mt-1">
              Consider historical context, contemporary practices, and regional
              variations where relevant.
            </p>
            <p className="mt-1">
              You may answer in English or Polish, whichever feels more natural
              for expressing cultural concepts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
