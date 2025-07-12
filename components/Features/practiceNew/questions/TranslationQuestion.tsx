"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionType } from "@/lib/enum";
import { Languages } from "lucide-react";

export function TranslationQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const isPolishToEnglish =
    question.questionType === QuestionType.TRANSLATION_PL;
  const targetLanguage = isPolishToEnglish ? "English" : "Polish";
  const sourceLanguage = isPolishToEnglish ? "Polish" : "English";

  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="size-5 text-blue-600" />
            <Label className="text-base font-medium">
              Translate from {sourceLanguage} to {targetLanguage}:
            </Label>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="text-lg font-medium text-gray-800">
                {question.question}
              </div>
              <div className="mt-1 text-sm text-gray-600">{sourceLanguage}</div>
            </CardContent>
          </Card>

          <div>
            <Label
              htmlFor="translation-input"
              className="mb-2 block text-sm text-gray-600"
            >
              Your translation in {targetLanguage}:
            </Label>
            <Textarea
              id="translation-input"
              value={typeof userAnswer === "string" ? userAnswer : ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={`Type your ${targetLanguage} translation here...`}
              className="min-h-[100px]"
              disabled={disabled}
              aria-label={`Translation to ${targetLanguage}`}
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Provide an accurate translation while maintaining the meaning and
              context.
            </p>
            <p className="mt-1">
              {isPolishToEnglish
                ? "Focus on natural English expression and proper grammar."
                : "Pay attention to Polish grammar, cases, and word order."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
