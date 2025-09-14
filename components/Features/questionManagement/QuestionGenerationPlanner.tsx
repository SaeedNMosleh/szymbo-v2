"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedConceptSelector from "./EnhancedConceptSelector";
import CompactQuestionTypeSelector from "./CompactQuestionTypeSelector";

interface QuestionTypeQuantity {
  type: QuestionType;
  quantity: number;
}

interface QuestionGenerationPlannerProps {
  onGenerationComplete: () => void;
  onSwitchToDrafts?: () => void;
}

interface GenerationBreakdown {
  type: string;
  generated: number;
}

export default function QuestionGenerationPlanner({
  onGenerationComplete,
  onSwitchToDrafts,
}: QuestionGenerationPlannerProps) {
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeQuantity[]>(
    Object.values(QuestionType).map((type) => ({ type, quantity: 0 }))
  );
  const [difficulty, setDifficulty] = useState<QuestionLevel>(QuestionLevel.A1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [isCheckingDrafts, setIsCheckingDrafts] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    checkDraftCount();
  }, []);

  const checkDraftCount = async () => {
    try {
      const response = await fetch("/api/question-management/drafts");
      if (response.ok) {
        const data = await response.json();
        const count = data.data?.total || data.total || 0;
        setDraftCount(count);
      }
    } catch (err) {
      console.error("Failed to check draft count:", err);
    }
  };

  const handleNewSession = async () => {
    if (draftCount === 0) {
      setError(null);
      setSuccess("✨ New session ready! You can start generating questions.");
      return;
    }

    setShowClearConfirm(true);
  };

  const confirmClearDrafts = async () => {
    try {
      setIsCheckingDrafts(true);
      const response = await fetch("/api/question-management/drafts", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to clear drafts");

      const result = await response.json();
      setDraftCount(0);
      setSuccess(
        `✨ New session started! Cleared ${result.data?.deletedCount || result.deletedCount || 0} draft questions.`
      );
      setShowClearConfirm(false);
      onGenerationComplete();
    } catch {
      setError("Failed to clear existing drafts");
    } finally {
      setIsCheckingDrafts(false);
    }
  };

  const handleQuantityChange = (type: QuestionType, quantity: number) => {
    setQuestionTypes((prev) =>
      prev.map((qt) =>
        qt.type === type ? { ...qt, quantity: Math.max(0, quantity) } : qt
      )
    );
  };

  const getTotalQuestions = () => {
    return questionTypes.reduce((sum, qt) => sum + qt.quantity, 0);
  };

  const handleGenerate = async () => {
    if (selectedConcepts.length === 0) {
      setError("Please select at least one concept");
      return;
    }

    if (getTotalQuestions() === 0) {
      setError("Please specify quantity for at least one question type");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);

      const activeQuestionTypes = questionTypes.filter((qt) => qt.quantity > 0);
      const response = await fetch("/api/question-management/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptIds: selectedConcepts,
          questionTypes: activeQuestionTypes,
          difficulty,
          specialInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const result = await response.json();

      // Show detailed success message with breakdown
      const breakdown: GenerationBreakdown[] = result.summary?.breakdown || [];
      const successDetails = breakdown
        .filter((b: GenerationBreakdown) => b.generated > 0)
        .map(
          (b: GenerationBreakdown) =>
            `${b.generated} ${b.type.replace(/_/g, " ")}`
        )
        .join(", ");

      setSuccess(
        `🎉 Successfully generated ${result.count} questions! ${successDetails ? `(${successDetails})` : ""}

        ➡️ Go to the "Draft Review" tab above to review and approve your questions.`
      );
      onGenerationComplete();
      checkDraftCount(); // Update draft count after generation

      // Don't reset form immediately - let user see the success message
      setTimeout(() => {
        setSelectedConcepts([]);
        setQuestionTypes((prev) => prev.map((qt) => ({ ...qt, quantity: 0 })));
        setSpecialInstructions("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate questions"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="flex flex-col space-y-3">
              <div>{success}</div>
              <Button
                onClick={() => {
                  if (onSwitchToDrafts) {
                    onSwitchToDrafts();
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-fit bg-green-600 hover:bg-green-700"
              >
                📝 Review Generated Questions Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Concept Selection */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EnhancedConceptSelector
            selectedConceptIds={selectedConcepts}
            onSelectionChange={setSelectedConcepts}
            maxHeight="500px"
            showQuestionCounts={true}
          />
        </div>

        <div className="space-y-6">
          {/* Question Type Selection */}
          <CompactQuestionTypeSelector
            questionTypes={questionTypes}
            onQuantityChange={handleQuantityChange}
            totalQuestions={getTotalQuestions()}
            maxPerType={50}
          />

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={difficulty}
                  onValueChange={(value) =>
                    setDifficulty(value as QuestionLevel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(QuestionLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Special requirements..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Session and Generate Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleNewSession}
            variant="outline"
            disabled={isCheckingDrafts}
          >
            {isCheckingDrafts ? "Checking..." : "🆕 New Session"}
          </Button>
          {draftCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {draftCount} draft questions exist
            </span>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            selectedConcepts.length === 0 ||
            getTotalQuestions() === 0
          }
          size="lg"
        >
          {isGenerating
            ? "Generating Questions..."
            : `Generate ${getTotalQuestions()} Questions`}
        </Button>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-800">
            <div className="space-y-3">
              <p>
                ⚠️ You have {draftCount} draft questions in the system. Starting
                a new session will permanently delete all existing drafts.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={confirmClearDrafts}
                  disabled={isCheckingDrafts}
                  size="sm"
                  variant="destructive"
                >
                  {isCheckingDrafts ? "Clearing..." : "Yes, Clear All Drafts"}
                </Button>
                <Button
                  onClick={() => setShowClearConfirm(false)}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
