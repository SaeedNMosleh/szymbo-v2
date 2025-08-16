"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "../practiceNew/QuestionRenderer";
import {
  QuestionData,
  QuestionComponentProps,
} from "../practiceNew/types/questionTypes";
import { X } from "lucide-react";

interface QuestionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  questionData: QuestionData;
}

export function QuestionPreview({
  isOpen,
  onClose,
  questionData,
}: QuestionPreviewProps) {
  const [userAnswer, setUserAnswer] = useState<string | string[]>("");
  const [showValidation, setShowValidation] = useState(false);

  const handleAnswerChange = (answer: string | string[]) => {
    setUserAnswer(answer);
    setShowValidation(false);
  };

  const handleSubmit = () => {
    setShowValidation(true);
  };

  const handleRetry = () => {
    setUserAnswer("");
    setShowValidation(false);
  };

  const handleReset = () => {
    setUserAnswer("");
    setShowValidation(false);
  };

  const validationResult = showValidation
    ? {
        isCorrect: Array.isArray(userAnswer)
          ? userAnswer.join(",") === questionData.correctAnswer
          : userAnswer === questionData.correctAnswer,
        feedback: Array.isArray(userAnswer)
          ? userAnswer.join(",") === questionData.correctAnswer
            ? "Correct!"
            : "Not quite right"
          : userAnswer === questionData.correctAnswer
            ? "Correct!"
            : "Not quite right",
        correctAnswer: questionData.correctAnswer || "",
        attempts: 1,
        responseTime: 0,
      }
    : null;

  const questionProps: QuestionComponentProps = {
    question: questionData,
    userAnswer,
    onAnswerChange: handleAnswerChange,
    validationResult,
    isValidating: false,
    disabled: false,
    onSubmit: handleSubmit,
    onRetry: handleRetry,
    onNext: () => {},
    showSubmit:
      !showValidation &&
      (Array.isArray(userAnswer)
        ? userAnswer.length > 0
        : userAnswer.length > 0),
    showRetry: showValidation && !validationResult?.isCorrect,
    showNext: false,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Question Preview</DialogTitle>
              <DialogDescription>
                This is how the question will appear to users. Your interactions
                here won&apos;t affect any statistics.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="size-6 p-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          <QuestionRenderer {...questionProps} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset Answer
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
