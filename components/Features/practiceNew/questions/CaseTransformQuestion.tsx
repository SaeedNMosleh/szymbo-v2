"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function CaseTransformQuestion({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  disabled 
}: QuestionComponentProps) {
  
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  // Extract case information from question if available
  const getCaseInfo = () => {
    const casePattern = /(nominative|genitive|dative|accusative|instrumental|locative|vocative)/i;
    const match = question.question.match(casePattern);
    return match ? match[1].toLowerCase() : null;
  };

  const targetCase = getCaseInfo();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            {question.question}
          </Label>
          
          {targetCase && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Target case:</span>
              <Badge variant="outline" className="capitalize">
                {targetCase}
              </Badge>
            </div>
          )}
          
          <Input
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter the transformed word or phrase..."
            disabled={disabled}
            className="text-lg"
            aria-label="Case transformation answer"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          
          <div className="text-sm text-gray-600">
            <p>Transform the given word or phrase into the correct grammatical case.</p>
            <p className="mt-1">Remember to consider gender, number, and the specific case requirements.</p>
            {targetCase && (
              <p className="mt-1 font-medium">
                Focus on the <span className="capitalize">{targetCase}</span> case endings.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}