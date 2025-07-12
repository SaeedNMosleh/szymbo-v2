"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Eye, EyeOff, Lightbulb } from "lucide-react";
import { ProgressiveHint } from "../types/questionTypes";

interface ProgressiveHintsProps {
  hints: ProgressiveHint[];
  onHintRevealed: (hint: ProgressiveHint) => void;
  revealedHints: string[];
  disabled: boolean;
  className?: string;
}

export function ProgressiveHints({
  hints,
  onHintRevealed,
  revealedHints,
  disabled,
  className = "",
}: ProgressiveHintsProps) {
  const [showHints, setShowHints] = useState(false);

  if (hints.length === 0) {
    return null;
  }

  const sortedHints = [...hints].sort((a, b) => a.cost - b.cost);
  const totalCost = revealedHints.reduce((total, hintId) => {
    const hint = hints.find((h) => h.id === hintId);
    return total + (hint?.cost || 0);
  }, 0);

  const handleRevealHint = (hint: ProgressiveHint) => {
    if (disabled || revealedHints.includes(hint.id)) return;
    onHintRevealed(hint);
  };

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Need a hint?
              </span>
              {totalCost > 0 && (
                <Badge variant="outline" className="text-xs">
                  Cost: {totalCost} points
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showHints ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>

          {showHints && (
            <div className="space-y-2">
              {sortedHints.map((hint, index) => {
                const isRevealed = revealedHints.includes(hint.id);
                const canReveal = !disabled && !isRevealed;

                return (
                  <div
                    key={hint.id}
                    className={`
                      rounded-md border p-3 transition-colors
                      ${
                        isRevealed
                          ? "border-blue-300 bg-white"
                          : "border-blue-200 bg-blue-100 hover:bg-blue-200"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-700">
                            Hint {index + 1}
                          </span>
                          {hint.cost > 0 && (
                            <Badge
                              variant={isRevealed ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {hint.cost} points
                            </Badge>
                          )}
                        </div>

                        {isRevealed ? (
                          <p className="text-sm text-gray-700">{hint.text}</p>
                        ) : (
                          <p className="text-xs text-blue-600">
                            Click to reveal this hint
                          </p>
                        )}
                      </div>

                      {!isRevealed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevealHint(hint)}
                          disabled={!canReveal}
                          className="shrink-0"
                        >
                          <HelpCircle className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {revealedHints.length === 0 && (
                <p className="py-2 text-center text-xs text-blue-600">
                  Hints will help you solve this question, but may reduce your
                  score.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
