"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";

export function ScenarioResponseQuestion({
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
            <Lightbulb className="size-5 text-yellow-600" />
            <Label className="text-base font-medium">Scenario Response:</Label>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="text-gray-800">{question.question}</div>
            </CardContent>
          </Card>

          <Textarea
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="How would you respond in this situation?"
            className="min-h-[120px]"
            disabled={disabled}
            aria-label="Scenario response answer"
          />

          <div className="text-sm text-gray-600">
            <p>
              Respond as you would in this real-life situation using appropriate
              Polish.
            </p>
            <p className="mt-1">
              Consider the context, formality level, and cultural expectations.
            </p>
            <p className="mt-1">
              Your response should be natural and situationally appropriate.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
