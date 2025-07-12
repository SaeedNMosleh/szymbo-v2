"use client";

import React from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "../ui/AudioPlayer";
import { AlertCircle } from "lucide-react";

export function AudioComprehensionQuestion({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  disabled 
}: QuestionComponentProps) {
  
  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
  };

  if (!question.audioUrl) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Audio Missing</p>
              <p className="text-sm">No audio file provided for this question.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Listen to the audio and answer the question:
          </Label>
          
          <AudioPlayer 
            src={question.audioUrl}
            className="mb-4"
          />
          
          <div className="text-lg font-medium">
            {question.question}
          </div>
          
          <Textarea
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer in Polish..."
            className="min-h-[100px]"
            disabled={disabled}
            aria-label="Audio comprehension answer"
          />
          
          <div className="text-sm text-gray-600">
            <p>Listen to the audio clip carefully and provide your answer based on what you heard.</p>
            <p className="mt-1">You can replay the audio as many times as needed.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}