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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { Check, X, RefreshCw, Edit3, Plus } from "lucide-react";

interface QuestionDraft {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  difficulty: QuestionLevel;
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
  source: "generated" | "manual";
  createdDate: string;
}

interface QuestionDraftReviewProps {
  refreshTrigger: number;
  onApprovalComplete: () => void;
}

export default function QuestionDraftReview({
  refreshTrigger,
  onApprovalComplete,
}: QuestionDraftReviewProps) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, [refreshTrigger]);

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/question-management/drafts");
      if (!response.ok) throw new Error("Failed to fetch drafts");

      const data = await response.json();
      const drafts = data.data?.drafts || data.drafts || [];
      setDrafts(drafts);
    } catch (err) {
      setError("Failed to load question drafts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraftUpdate = async (
    id: string,
    updates: Partial<QuestionDraft>
  ) => {
    try {
      const response = await fetch("/api/question-management/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });

      if (!response.ok) throw new Error("Failed to update draft");

      setDrafts((prev) =>
        prev.map((draft) =>
          draft.id === id ? { ...draft, ...updates } : draft
        )
      );
    } catch (err) {
      setError("Failed to update question draft");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    await handleDraftUpdate(id, { status, reviewNotes: notes });
    if (status === "approved") {
      setSuccess("Question approved successfully");
    }
  };


  const handleRegenerate = async (id: string) => {
    try {
      const draft = drafts.find((d) => d.id === id);
      if (!draft) return;

      const response = await fetch("/api/question-management/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: id,
          conceptIds: draft.targetConcepts,
          questionType: draft.questionType,
          difficulty: draft.difficulty,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate question");

      const result = await response.json();
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.id === id ? { ...draft, ...result.question } : draft
        )
      );

      setSuccess("Question regenerated successfully");
    } catch (err) {
      setError("Failed to regenerate question");
    }
  };

  const handleSelectToggle = (id: string) => {
    setSelectedDrafts((prev) =>
      prev.includes(id)
        ? prev.filter((draftId) => draftId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allSelected = selectedDrafts.length === drafts.length;

    if (allSelected) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map((d) => d.id));
    }
  };

  const EditableQuestionCard = ({ draft }: { draft: QuestionDraft }) => {
    const [editData, setEditData] = useState(draft);
    const isEditing = editingId === draft.id;

    const handleSave = () => {
      handleDraftUpdate(draft.id, editData);
      setEditingId(null);
    };

    const handleCancel = () => {
      setEditData(draft);
      setEditingId(null);
    };

    return (
      <Card
        className={`${draft.status === "approved" ? "border-green-200 bg-green-50" : draft.status === "rejected" ? "border-red-200 bg-red-50" : ""}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedDrafts.includes(draft.id)}
                onCheckedChange={() => handleSelectToggle(draft.id)}
              />
              <Badge
                variant={
                  draft.status === "approved"
                    ? "default"
                    : draft.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {draft.status}
              </Badge>
              <Badge variant="outline">{draft.questionType}</Badge>
              <Badge variant="outline">{draft.difficulty}</Badge>
            </div>
            <div className="flex space-x-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(draft.id)}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(draft.id)}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Check className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question</Label>
            {isEditing ? (
              <Textarea
                value={editData.question}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, question: e.target.value }))
                }
                className="min-h-20"
              />
            ) : (
              <p className="rounded bg-gray-50 p-3 text-sm">{draft.question}</p>
            )}
          </div>

          <div>
            <Label>Correct Answer</Label>
            {isEditing ? (
              <Input
                value={editData.correctAnswer}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    correctAnswer: e.target.value,
                  }))
                }
              />
            ) : (
              <p className="rounded bg-gray-50 p-2 text-sm">
                {draft.correctAnswer}
              </p>
            )}
          </div>

          {draft.options && draft.options.length > 0 && (
            <div>
              <Label>Options</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {editData.options?.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(editData.options || [])];
                        newOptions[index] = e.target.value;
                        setEditData((prev) => ({
                          ...prev,
                          options: newOptions,
                        }));
                      }}
                    />
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditData((prev) => ({
                        ...prev,
                        options: [...(prev.options || []), ""],
                      }))
                    }
                  >
                    <Plus className="mr-2 size-4" />
                    Add Option
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {draft.options.map((option, index) => (
                    <p key={index} className="rounded bg-gray-50 p-2 text-sm">
                      {index + 1}. {option}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Target Concepts</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {draft.conceptNames?.map((name) => (
                <Badge key={name} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={editData.questionType}
                  onValueChange={(value) =>
                    setEditData((prev) => ({
                      ...prev,
                      questionType: value as QuestionType,
                    }))
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
                <Label>Difficulty</Label>
                <Select
                  value={editData.difficulty}
                  onValueChange={(value) =>
                    setEditData((prev) => ({
                      ...prev,
                      difficulty: value as QuestionLevel,
                    }))
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
          )}

          {draft.status === "draft" && (
            <div className="flex space-x-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleStatusChange(draft.id, "approved")}
              >
                <Check className="mr-2 size-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleStatusChange(draft.id, "rejected")}
              >
                <X className="mr-2 size-4" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">Loading question drafts...</div>
    );
  }

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

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {selectedDrafts.length === drafts.length
              ? "Deselect All"
              : "Select All"}
          </Button>

          <span className="text-sm text-muted-foreground">
            {selectedDrafts.length} selected of {drafts.length}{" "}
            questions
          </span>
        </div>

        {selectedDrafts.length > 0 && (
          <div className="flex space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSaveToQuestionBank()}
              disabled={isSaving}
            >
              <Check className="mr-2 size-4" />
              {isSaving ? "Saving..." : "Save Selected to Bank"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteDrafts()}
            >
              <X className="mr-2 size-4" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {drafts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No draft questions found. Generate some questions using the Generation Planner or add them manually.
              </p>
            </CardContent>
          </Card>
        ) : (
          drafts.map((draft) => (
            <EditableQuestionCard key={draft.id} draft={draft} />
          ))
        )}
      </div>
    </div>
  );
}
