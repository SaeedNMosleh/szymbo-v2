"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";

export function DiminutiveFormsQuestion({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  disabled 
}: QuestionComponentProps) {
  
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            <Label className="text-base font-medium">
              {question.question}
            </Label>
          </div>
          
          <Input
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter the diminutive form..."
            disabled={disabled}
            className="text-lg"
            aria-label="Diminutive form answer"
          />
          
          <div className="text-sm text-gray-600">
            <p>Create the diminutive (small/cute) form of the given word.</p>
            <p className="mt-1">Polish diminutives often use suffixes like -ek, -ik, -ko, -ka, -aszek, -uszka, etc.</p>
            <p className="mt-1 font-medium">Remember that diminutives can express smallness, endearment, or cuteness.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}