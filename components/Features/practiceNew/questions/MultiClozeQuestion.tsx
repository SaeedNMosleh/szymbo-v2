"use client";

import React, { useState, useMemo } from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MultiClozeQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const [gapAnswers, setGapAnswers] = useState<{ [key: string]: string }>({});

  // Parse the question to find all gaps and their positions
  const questionParts = useMemo(() => {
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

    let gapIndex = 0;

    return parts.map((part, index) => {
      if (
        (part.startsWith("[") && part.endsWith("]")) ||
        /^_{3,}$/.test(part)
      ) {
        const gapId = `gap-${gapIndex++}`;
        return { type: "gap" as const, content: part, gapId, index };
      }
      return { type: "text" as const, content: part, index };
    });
  }, [question.question]);

  // Initialize gap answers from userAnswer if it's an array
  React.useEffect(() => {
    if (Array.isArray(userAnswer)) {
      const newGapAnswers: { [key: string]: string } = {};
      userAnswer.forEach((answer, index) => {
        newGapAnswers[`gap-${index}`] = answer || "";
      });
      setGapAnswers(newGapAnswers);
    }
  }, [userAnswer]);

  const handleGapChange = (gapId: string, value: string) => {
    const newGapAnswers = { ...gapAnswers, [gapId]: value };
    setGapAnswers(newGapAnswers);

    // Convert to array format for parent component
    const gapCount = questionParts.filter((part) => part.type === "gap").length;
    const answersArray = Array.from(
      { length: gapCount },
      (_, index) => newGapAnswers[`gap-${index}`] || ""
    );

    onAnswerChange(answersArray);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Fill in all the blanks:</Label>

      <div className="text-lg leading-relaxed">
        {questionParts.map((part) => {
          if (part.type === "gap") {
            return (
              <span key={part.index} className="mx-1 inline-block">
                <Input
                  value={gapAnswers[part.gapId] || ""}
                  onChange={(e) => handleGapChange(part.gapId, e.target.value)}
                  disabled={disabled}
                  className="inline-block h-8 w-32 text-center"
                  placeholder="..."
                  aria-label={`Fill in blank ${part.gapId.split("-")[1]}`}
                />
              </span>
            );
          }
          return <span key={part.index}>{part.content}</span>;
        })}
      </div>

      <div className="text-sm text-gray-600">
        <p>Complete the sentence by filling in all missing words or phrases.</p>
        {questionParts.filter((p) => p.type === "gap").length > 0 && (
          <p className="mt-1">
            Gaps to fill: {questionParts.filter((p) => p.type === "gap").length}
          </p>
        )}
      </div>
    </div>
  );
}
