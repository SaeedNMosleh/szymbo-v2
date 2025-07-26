"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function MultiSelectQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const options = question.options || [];
  const selectedAnswers = Array.isArray(userAnswer) ? userAnswer : [];
  
  // Debug logging for options
  if (options.length === 0) {
    console.log(`❌ MultiSelectQuestion: No options provided for question:`, question);
  }

  const handleOptionChange = (option: string, checked: boolean) => {
    let newAnswers: string[];

    if (checked) {
      newAnswers = [...selectedAnswers, option];
    } else {
      newAnswers = selectedAnswers.filter((answer) => answer !== option);
    }

    onAnswerChange(newAnswers);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">{question.question}</Label>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Checkbox
                  id={`option-${index}`}
                  checked={selectedAnswers.includes(option)}
                  onCheckedChange={(checked) =>
                    handleOptionChange(option, !!checked)
                  }
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
          </div>

          {options.length === 0 && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              No options provided for this multi-select question.
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Select all correct answers. You may choose multiple options.</p>
            {selectedAnswers.length > 0 && (
              <p className="mt-1">
                Selected: {selectedAnswers.length} option
                {selectedAnswers.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
