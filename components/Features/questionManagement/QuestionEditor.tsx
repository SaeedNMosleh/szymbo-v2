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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";
import { Plus, X, Save, RotateCcw } from "lucide-react";

interface QuestionData {
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  difficulty: QuestionLevel;
  options: string[];
  audioUrl: string;
  imageUrl: string;
}

interface ConceptOption {
  id: string;
  name: string;
  category: string;
  difficulty: string;
}

interface QuestionEditorProps {
  onQuestionSaved: () => void;
  editingQuestion?: QuestionData; // For future edit functionality
}

const initialQuestionData: QuestionData = {
  question: "",
  correctAnswer: "",
  questionType: QuestionType.BASIC_CLOZE,
  targetConcepts: [],
  difficulty: QuestionLevel.A1,
  options: [],
  audioUrl: "",
  imageUrl: "",
};

const questionTypesWithOptions = [
  QuestionType.VOCAB_CHOICE,
  QuestionType.MULTI_SELECT,
  QuestionType.WORD_ARRANGEMENT,
];

export default function QuestionEditor({
  onQuestionSaved,
  editingQuestion,
}: QuestionEditorProps) {
  const [questionData, setQuestionData] =
    useState<QuestionData>(initialQuestionData);
  const [concepts, setConcepts] = useState<ConceptOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchConcepts();
  }, []);

  useEffect(() => {
    if (editingQuestion) {
      setQuestionData({
        question: editingQuestion.question || "",
        correctAnswer: editingQuestion.correctAnswer || "",
        questionType: editingQuestion.questionType || QuestionType.BASIC_CLOZE,
        targetConcepts: editingQuestion.targetConcepts || [],
        difficulty: editingQuestion.difficulty || QuestionLevel.A1,
        options: editingQuestion.options || [],
        audioUrl: editingQuestion.audioUrl || "",
        imageUrl: editingQuestion.imageUrl || "",
      });
    }
  }, [editingQuestion]);

  const fetchConcepts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/concepts?limit=100");
      if (!response.ok) throw new Error("Failed to fetch concepts");

      const data = await response.json();
      const concepts = data.data || data.concepts || [];
      const conceptOptions = concepts.map((concept: IConcept) => ({
        id: concept.id,
        name: concept.name,
        category: concept.category,
        difficulty: concept.difficulty,
      }));

      setConcepts(conceptOptions);
    } catch {
      setError("Failed to load concepts");
    } finally {
      setIsLoading(false);
    }
  };

  const validateQuestion = (): string[] => {
    const errors: string[] = [];

    if (!questionData.question.trim()) {
      errors.push("Question text is required");
    }

    if (!questionData.correctAnswer.trim()) {
      errors.push("Correct answer is required");
    }

    if (questionData.targetConcepts.length === 0) {
      errors.push("At least one target concept must be selected");
    }

    if (questionTypesWithOptions.includes(questionData.questionType)) {
      if (questionData.options.length < 2) {
        errors.push(`${questionData.questionType} requires at least 2 options`);
      }

      if (questionData.questionType === QuestionType.MULTI_SELECT) {
        // For multi-select, correct answer should be comma-separated indices or values
        if (!questionData.correctAnswer.includes(",")) {
          errors.push(
            "Multi-select questions should have multiple correct answers separated by commas"
          );
        }
      } else if (!questionData.options.includes(questionData.correctAnswer)) {
        errors.push("Correct answer must be one of the provided options");
      }
    }

    return errors;
  };

  const handleInputChange = (field: keyof QuestionData, value: string | string[]) => {
    setQuestionData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleConceptToggle = (conceptId: string) => {
    setQuestionData((prev) => ({
      ...prev,
      targetConcepts: prev.targetConcepts.includes(conceptId)
        ? prev.targetConcepts.filter((id) => id !== conceptId)
        : [...prev.targetConcepts, conceptId],
    }));
  };

  const addOption = () => {
    setQuestionData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  const removeOption = (index: number) => {
    setQuestionData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctAnswer:
        prev.options[index] === prev.correctAnswer ? "" : prev.correctAnswer,
    }));
  };

  const handleSave = async () => {
    const errors = validateQuestion();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Save to draft DB instead of directly to question bank
      const draftData = {
        ...questionData,
        source: "manual",
        targetConcepts:
          questionData.targetConcepts.length > 0
            ? questionData.targetConcepts
            : ["Manual Entry"], // Fallback concept name
        options: questionData.options.filter((opt) => opt.trim() !== ""),
      };

      const response = await fetch("/api/question-management/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save question to drafts");
      }

      setSuccess(
        "✓ Question added to draft review! Go to the 'Draft Review' tab to finalize it."
      );

      // Reset form for new questions
      setQuestionData(initialQuestionData);

      onQuestionSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setQuestionData(editingQuestion || initialQuestionData);
    setValidationErrors([]);
    setError(null);
    setSuccess(null);
  };

  const requiresOptions = questionTypesWithOptions.includes(
    questionData.questionType
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Question Information */}
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Basic information about the question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question">Question Text *</Label>
            <Textarea
              id="question"
              placeholder="Enter the question text..."
              value={questionData.question}
              onChange={(e) => handleInputChange("question", e.target.value)}
              className="min-h-20"
            />
          </div>

          <div>
            <Label htmlFor="correctAnswer">Correct Answer *</Label>
            <Input
              id="correctAnswer"
              placeholder="Enter the correct answer..."
              value={questionData.correctAnswer}
              onChange={(e) =>
                handleInputChange("correctAnswer", e.target.value)
              }
            />
            {questionData.questionType === QuestionType.MULTI_SELECT && (
              <p className="mt-1 text-xs text-muted-foreground">
                For multi-select questions, separate multiple correct answers
                with commas
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionType">Question Type *</Label>
              <Select
                value={questionData.questionType}
                onValueChange={(value) =>
                  handleInputChange("questionType", value as QuestionType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(QuestionType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select
                value={questionData.difficulty}
                onValueChange={(value) =>
                  handleInputChange("difficulty", value as QuestionLevel)
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
          </div>
        </CardContent>
      </Card>

      {/* Options (for applicable question types) */}
      {requiresOptions && (
        <Card>
          <CardHeader>
            <CardTitle>Answer Options</CardTitle>
            <CardDescription>
              Provide multiple choice options for this question type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {questionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={questionData.options.length <= 1}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addOption}>
              <Plus className="mr-2 size-4" />
              Add Option
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Target Concepts */}
      <Card>
        <CardHeader>
          <CardTitle>Target Concepts *</CardTitle>
          <CardDescription>
            Select which concepts this question tests (
            {questionData.targetConcepts.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">Loading concepts...</div>
          ) : (
            <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
              {concepts.map((concept) => (
                <div key={concept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={concept.id}
                    checked={questionData.targetConcepts.includes(concept.id)}
                    onCheckedChange={() => handleConceptToggle(concept.id)}
                  />
                  <Label
                    htmlFor={concept.id}
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
          )}
        </CardContent>
      </Card>

      {/* Media URLs and Files */}
      <Card>
        <CardHeader>
          <CardTitle>Media (Optional)</CardTitle>
          <CardDescription>
            Add audio or image files to enhance the question. You can either
            provide URLs or upload files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Audio</Label>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="audioUrl" className="text-sm">
                  Audio URL
                </Label>
                <Input
                  id="audioUrl"
                  placeholder="https://example.com/audio.mp3"
                  value={questionData.audioUrl}
                  onChange={(e) =>
                    handleInputChange("audioUrl", e.target.value)
                  }
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                OR
              </div>
              <div>
                <Label htmlFor="audioFile" className="text-sm">
                  Upload Audio File
                </Label>
                <Input
                  id="audioFile"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, show file name - in a real app you'd upload to a service
                      const fileName = `[Uploaded: ${file.name}]`;
                      handleInputChange("audioUrl", fileName);
                    }
                  }}
                  className="file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported formats: MP3, WAV, OGG (Max 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Image</Label>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="imageUrl" className="text-sm">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={questionData.imageUrl}
                  onChange={(e) =>
                    handleInputChange("imageUrl", e.target.value)
                  }
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                OR
              </div>
              <div>
                <Label htmlFor="imageFile" className="text-sm">
                  Upload Image File
                </Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, show file name - in a real app you'd upload to a service
                      const fileName = `[Uploaded: ${file.name}]`;
                      handleInputChange("imageUrl", fileName);
                    }
                  }}
                  className="file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {(questionData.audioUrl || questionData.imageUrl) && (
            <div className="mt-4 rounded-md bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">
                Media Preview:
              </p>
              {questionData.audioUrl && (
                <p className="mt-1 text-sm text-blue-700">
                  🎵 Audio:{" "}
                  {questionData.audioUrl.startsWith("[Uploaded:")
                    ? questionData.audioUrl
                    : "URL provided"}
                </p>
              )}
              {questionData.imageUrl && (
                <p className="mt-1 text-sm text-blue-700">
                  🖼️ Image:{" "}
                  {questionData.imageUrl.startsWith("[Uploaded:")
                    ? questionData.imageUrl
                    : "URL provided"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 size-4" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 size-4" />
          {isSaving
            ? "Saving..."
            : editingQuestion
              ? "Update Question"
              : "Save Question"}
        </Button>
      </div>
    </div>
  );
}
