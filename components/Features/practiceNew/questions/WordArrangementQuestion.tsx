"use client";

import React, { useMemo } from "react";
import { QuestionComponentProps, DragDropItem } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DragDropZone } from "../ui/DragDropZone";

export function WordArrangementQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const words = question.options || [];

  // Initialize drag drop items from words
  const dragDropItems = useMemo(() => {
    // If userAnswer is an array, use it to preserve order
    if (Array.isArray(userAnswer) && userAnswer.length === words.length) {
      return userAnswer.map((word, index) => ({
        id: `word-${word}-${index}`,
        content: word,
        originalIndex: words.indexOf(word),
      }));
    }

    // Otherwise, create shuffled initial order
    return words.map((word, index) => ({
      id: `word-${word}-${index}`,
      content: word,
      originalIndex: index,
    }));
  }, [words, userAnswer]);

  const handleOrderChange = (newOrder: DragDropItem[]) => {
    const orderedWords = newOrder.map((item) => item.content);
    onAnswerChange(orderedWords);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">{question.question}</Label>

          {words.length > 0 ? (
            <DragDropZone
              items={dragDropItems}
              onOrderChange={handleOrderChange}
              disabled={disabled}
            />
          ) : (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              No words provided for this arrangement question.
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Drag and drop the words to create the correct sentence order.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
