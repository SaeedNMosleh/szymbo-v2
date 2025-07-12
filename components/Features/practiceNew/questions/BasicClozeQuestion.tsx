"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BasicClozeQuestion({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  disabled 
}: QuestionComponentProps) {
  
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  // Parse the question text to find cloze gaps
  const renderQuestionWithGaps = () => {
    const text = question.question;
    const parts = text.split(/(\[.*?\])/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        // This is a gap
        const gapId = `gap-${index}`;
        return (
          <span key={index} className="inline-block mx-1">
            <Input
              id={gapId}
              value={typeof userAnswer === 'string' ? userAnswer : ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              className="w-32 h-8 text-center inline-block"
              placeholder="..."
              aria-label="Fill in the blank"
            />
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Fill in the blank:
          </Label>
          
          <div className="text-lg leading-relaxed">
            {renderQuestionWithGaps()}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Complete the sentence by filling in the missing word or phrase.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}