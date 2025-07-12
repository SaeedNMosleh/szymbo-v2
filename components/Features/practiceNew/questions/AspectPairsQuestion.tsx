"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shuffle } from "lucide-react";

export function AspectPairsQuestion({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  disabled 
}: QuestionComponentProps) {
  
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  // Determine if this is perfective or imperfective based on question
  const getAspectType = () => {
    const questionLower = question.question.toLowerCase();
    if (questionLower.includes('perfective')) return 'perfective';
    if (questionLower.includes('imperfective')) return 'imperfective';
    return null;
  };

  const aspectType = getAspectType();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-orange-600" />
            <Label className="text-base font-medium">
              {question.question}
            </Label>
          </div>
          
          {aspectType && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Target aspect:</span>
              <Badge variant="outline" className="capitalize">
                {aspectType}
              </Badge>
            </div>
          )}
          
          <Input
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter the corresponding verb form..."
            disabled={disabled}
            className="text-lg"
            aria-label="Aspect pair answer"
          />
          
          <div className="text-sm text-gray-600">
            <p>Provide the corresponding perfective or imperfective form of the verb.</p>
            <p className="mt-1">Remember that perfective verbs express completed actions, while imperfective verbs express ongoing or repeated actions.</p>
            {aspectType && (
              <p className="mt-1 font-medium">
                You need to provide the <span className="capitalize">{aspectType}</span> form.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}