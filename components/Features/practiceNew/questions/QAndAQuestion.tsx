"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export function QAndAQuestion({
  userAnswer,
  onAnswerChange,
  disabled,
}: Omit<QuestionComponentProps, "question">) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-green-600" />
        <Label className="text-base font-medium">Answer the question:</Label>
      </div>

      <Textarea
        value={typeof userAnswer === "string" ? userAnswer : ""}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Type your answer in Polish..."
        className="min-h-[120px]"
        disabled={disabled}
        aria-label="Open-ended question answer"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />

      <div className="text-sm text-gray-600">
        <p>
          Provide a complete answer in Polish. Express your thoughts clearly and
          use proper grammar.
        </p>
        <p className="mt-1">
          There may be multiple correct ways to answer this question.
        </p>
      </div>
    </div>
  );
}
