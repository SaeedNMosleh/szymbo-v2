"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BasicClozeQuestion({
  question,
  userAnswer,
  onAnswerChange,
  onSubmit,
  disabled,
}: QuestionComponentProps) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Parse the question text to find cloze gaps
  const renderQuestionWithGaps = () => {
    const text = question.question;

    // Handle both bracket format [gap] and underscore format _____
    let parts: string[];
    if (text.includes("[") && text.includes("]")) {
      // Bracket format: [gap] or [word]
      parts = text.split(/(\[.*?\])/g);
    } else {
      // Underscore format: _____ (3 or more underscores)
      parts = text.split(/(_{3,})/g);
    }

    return parts.map((part, index) => {
      if (
        (part.startsWith("[") && part.endsWith("]")) ||
        /^_{3,}$/.test(part)
      ) {
        // This is a gap
        const gapId = `gap-${index}`;
        return (
          <span key={index} className="mx-1 inline-block">
            <Input
              id={gapId}
              value={typeof userAnswer === "string" ? userAnswer : ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="inline-block h-8 w-32 text-center"
              placeholder="..."
              aria-label="Fill in the blank"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Fill in the blank:</Label>

      <div className="text-lg leading-relaxed">{renderQuestionWithGaps()}</div>

      <div className="text-sm text-gray-600">
        <p>Complete the sentence by filling in the missing word or phrase.</p>
      </div>
    </div>
  );
}
