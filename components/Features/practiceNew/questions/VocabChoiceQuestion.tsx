"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function VocabChoiceQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const options = question.options || [];

  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">{question.question}</Label>

          <RadioGroup
            value={typeof userAnswer === "string" ? userAnswer : ""}
            onValueChange={handleAnswerChange}
            disabled={disabled}
            className="space-y-3"
          >
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className={`cursor-pointer text-sm ${disabled ? "opacity-60" : ""}`}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {options.length === 0 && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              No options provided for this multiple choice question.
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Select the best answer from the options above.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
