"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { IConcept } from "@/datamodels/concept.model";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ConceptSelection {
  conceptId: string;
  name: string;
  category: string;
  difficulty: string;
  selected: boolean;
}

interface QuestionTypeQuantity {
  type: QuestionType;
  quantity: number;
}

interface QuestionGenerationPlannerProps {
  onGenerationComplete: () => void;
  onSwitchToDrafts?: () => void;
}

export default function QuestionGenerationPlanner({
  onGenerationComplete,
  onSwitchToDrafts,
}: QuestionGenerationPlannerProps) {
  const [concepts, setConcepts] = useState<ConceptSelection[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeQuantity[]>(
    Object.values(QuestionType).map((type) => ({ type, quantity: 0 }))
  );
  const [difficulty, setDifficulty] = useState<QuestionLevel>(QuestionLevel.A1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [isCheckingDrafts, setIsCheckingDrafts] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    fetchConcepts();
    checkDraftCount();
  }, []);

  const fetchConcepts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/concepts");
      if (!response.ok) throw new Error("Failed to fetch concepts");

      const data = await response.json();
      const concepts = data.data || data.concepts || [];
      const conceptSelections = concepts.map((concept: IConcept) => ({
        conceptId: concept.id,
        name: concept.name,
        category: concept.category,
        difficulty: concept.difficulty,
        selected: false,
      }));

      setConcepts(conceptSelections);
    } catch (err) {
      setError("Failed to load concepts");
    } finally {
      setIsLoading(false);
    }
  };

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
      setSuccess("✨ New session started! No existing drafts to clear.");
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
      setSuccess(`✨ New session started! Cleared ${result.data?.deletedCount || result.deletedCount || 0} draft questions.`);
      setShowClearConfirm(false);
      onGenerationComplete();
    } catch (err) {
      setError("Failed to clear existing drafts");
    } finally {
      setIsCheckingDrafts(false);
    }
  };

  const handleConceptToggle = (conceptId: string) => {
    setConcepts((prev) =>
      prev.map((concept) =>
        concept.conceptId === conceptId
          ? { ...concept, selected: !concept.selected }
          : concept
      )
    );

    setSelectedConcepts((prev) => {
      if (prev.includes(conceptId)) {
        return prev.filter((id) => id !== conceptId);
      } else {
        return [...prev, conceptId];
      }
    });
  };

  const handleQuantityChange = (type: QuestionType, quantity: number) => {
    setQuestionTypes((prev) =>
      prev.map((qt) =>
        qt.type === type ? { ...qt, quantity: Math.max(0, quantity) } : qt
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedConcepts.length === concepts.length;
    if (allSelected) {
      setSelectedConcepts([]);
      setConcepts((prev) => prev.map((c) => ({ ...c, selected: false })));
    } else {
      const allIds = concepts.map((c) => c.conceptId);
      setSelectedConcepts(allIds);
      setConcepts((prev) => prev.map((c) => ({ ...c, selected: true })));
    }
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
      const breakdown = result.summary?.breakdown || [];
      const successDetails = breakdown
        .filter((b: any) => b.generated > 0)
        .map((b: any) => `${b.generated} ${b.type.replace(/_/g, ' ')}`)
        .join(', ');
      
      setSuccess(
        `🎉 Successfully generated ${result.count} questions! ${successDetails ? `(${successDetails})` : ''} 
        
        ➡️ Go to the "Draft Review" tab above to review and approve your questions.`
      );
      onGenerationComplete();
      checkDraftCount(); // Update draft count after generation

      // Don't reset form immediately - let user see the success message
      setTimeout(() => {
        setSelectedConcepts([]);
        setConcepts((prev) => prev.map((c) => ({ ...c, selected: false })));
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

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading concepts...</div>;
  }

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
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-green-600 hover:bg-green-700 w-fit"
              >
                📝 Review Generated Questions Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Concept Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Concept Selection
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedConcepts.length === concepts.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </CardTitle>
          <CardDescription>
            Choose concepts to generate questions for ({selectedConcepts.length}{" "}
            selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept) => (
              <div
                key={concept.conceptId}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={concept.conceptId}
                  checked={concept.selected}
                  onCheckedChange={() => handleConceptToggle(concept.conceptId)}
                />
                <Label
                  htmlFor={concept.conceptId}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <div className="flex flex-col">
                    <span>{concept.name}</span>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {concept.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {concept.difficulty}
                      </Badge>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Type & Quantity */}
      <Card>
        <CardHeader>
          <CardTitle>Question Types & Quantities</CardTitle>
          <CardDescription>
            Specify how many questions to generate for each type (Total:{" "}
            {getTotalQuestions()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questionTypes.map(({ type, quantity }) => (
              <div key={type} className="flex items-center space-x-2">
                <Label htmlFor={type} className="min-w-0 flex-1 text-sm">
                  {type.replace(/_/g, " ").toUpperCase()}
                </Label>
                <Input
                  id={type}
                  type="number"
                  min="0"
                  max="50"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(type, parseInt(e.target.value) || 0)
                  }
                  className="w-20"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Settings</CardTitle>
          <CardDescription>
            Additional parameters for question generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="difficulty">Target Difficulty Level</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as QuestionLevel)}
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
            <Label htmlFor="instructions">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="Any specific requirements or focus areas for question generation..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* New Session and Generate Buttons */}
      <div className="flex justify-between items-center">
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
                ⚠️ You have {draftCount} draft questions in the system. 
                Starting a new session will permanently delete all existing drafts.
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
