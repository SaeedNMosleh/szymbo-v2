"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
import { Check, X, RefreshCw, Edit3, Plus, Eye } from "lucide-react";
import { QuestionPreview } from "./QuestionPreview";
import { transformDraftToQuestionData } from "@/utils/questionDataTransform";

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
  status?: "draft" | "approved" | "rejected";
  reviewNotes?: string;
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
  const [conceptMap, setConceptMap] = useState<Map<string, string>>(new Map());
  const [previewQuestion, setPreviewQuestion] = useState<QuestionDraft | null>(null);

  useEffect(() => {
    fetchDrafts();
    fetchConceptMap();
  }, [refreshTrigger]);

  const fetchConceptMap = async () => {
    try {
      const response = await fetch("/api/concepts?limit=100");
      if (!response.ok) return;

      const data = await response.json();
      const concepts = data.data || data.concepts || [];
      
      const map = new Map<string, string>();
      concepts.forEach((concept: { id: string; name: string }) => {
        map.set(concept.id, concept.name);
        map.set(concept.name, concept.name); // Handle cases where names are used
      });
      
      setConceptMap(map);
    } catch (err) {
      console.error("Failed to fetch concept map:", err);
    }
  };

  const getConceptDisplayName = (conceptIdOrName: string): string => {
    return conceptMap.get(conceptIdOrName) || conceptIdOrName;
  };

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/question-management/drafts");
      if (!response.ok) throw new Error("Failed to fetch drafts");

      const data = await response.json();
      const drafts = data.data?.drafts || data.drafts || [];
      
      console.log("Fetched drafts:", drafts); // Debug log
      console.log("First draft sample:", drafts[0]); // Debug log
      
      setDrafts(drafts);
    } catch (err) {
      console.error("Draft fetch error:", err); // Debug log
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
    } catch {
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
      if (!draft) {
        console.error("Draft not found for regeneration:", id); // Debug log
        return;
      }

      console.log("Regenerating draft:", draft); // Debug log
      
      const requestBody = {
        draftId: id,
        conceptIds: draft.targetConcepts,
        questionType: draft.questionType,
        difficulty: draft.difficulty,
      };
      
      console.log("Regenerate request body:", requestBody); // Debug log

      const response = await fetch("/api/question-management/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Regenerate response status:", response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Regenerate error response:", errorData); // Debug log
        throw new Error(errorData.error || "Failed to regenerate question");
      }

      const result = await response.json();
      console.log("Regenerate success result:", result); // Debug log
      
      const updatedQuestion = result.data?.question || result.question;
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.id === id ? { ...draft, ...updatedQuestion } : draft
        )
      );

      setSuccess("Question regenerated successfully");
    } catch (err) {
      console.error("Regenerate error:", err); // Debug log
      setError(err instanceof Error ? err.message : "Failed to regenerate question");
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

  const handleDeleteDrafts = async () => {
    if (selectedDrafts.length === 0) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/question-management/drafts/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedDrafts }),
      });

      if (!response.ok) throw new Error("Failed to delete drafts");

      const result = await response.json();
      setDrafts((prev) => prev.filter((draft) => !selectedDrafts.includes(draft.id)));
      setSelectedDrafts([]);
      setSuccess(`Successfully deleted ${result.deletedCount || selectedDrafts.length} draft questions`);
    } catch {
      setError("Failed to delete selected drafts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToQuestionBank = async () => {
    if (selectedDrafts.length === 0) return;

    try {
      setIsSaving(true);
      console.log("Saving to bank - selected drafts:", selectedDrafts); // Debug log
      
      const response = await fetch("/api/question-management/save-to-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selectedDrafts }),
      });

      console.log("Save to bank response status:", response.status); // Debug log
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Save to bank error response:", errorData); // Debug log
        throw new Error(errorData.error || "Failed to save drafts to question bank");
      }

      const result = await response.json();
      console.log("Save to bank success result:", result); // Debug log
      
      setDrafts((prev) => prev.filter((draft) => !selectedDrafts.includes(draft.id)));
      setSelectedDrafts([]);
      setSuccess(`Successfully saved ${result.data?.savedCount || result.savedCount || selectedDrafts.length} questions to the question bank`);
      onApprovalComplete();
    } catch (err) {
      console.error("Save to bank error:", err); // Debug log
      setError(err instanceof Error ? err.message : "Failed to save selected drafts to question bank");
    } finally {
      setIsSaving(false);
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
                    onClick={() => setPreviewQuestion(draft)}
                  >
                    <Eye className="size-4" />
                  </Button>
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
              {draft.targetConcepts?.map((concept) => (
                <Badge key={concept} variant="outline" className="text-xs">
                  {getConceptDisplayName(concept)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Display media URLs when not editing */}
          {!isEditing && (draft.audioUrl || draft.imageUrl) && (
            <div className="grid grid-cols-2 gap-4">
              {draft.audioUrl && (
                <div>
                  <Label>Audio</Label>
                  <div className="rounded bg-gray-50 p-2 text-sm">
                    <a 
                      href={draft.audioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {draft.audioUrl.length > 50 ? draft.audioUrl.substring(0, 50) + '...' : draft.audioUrl}
                    </a>
                  </div>
                </div>
              )}
              {draft.imageUrl && (
                <div>
                  <Label>Image</Label>
                  <div className="rounded bg-gray-50 p-2 text-sm">
                    <a 
                      href={draft.imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {draft.imageUrl.length > 50 ? draft.imageUrl.substring(0, 50) + '...' : draft.imageUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audio and Image URLs */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audio URL (Optional)</Label>
                <Input
                  value={editData.audioUrl || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, audioUrl: e.target.value }))
                  }
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
              <div>
                <Label>Image URL (Optional)</Label>
                <Input
                  value={editData.imageUrl || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={editData.questionType}
                  onValueChange={(value) => {
                    const newType = value as QuestionType;
                    setEditData((prev) => {
                      const needsOptions = [QuestionType.VOCAB_CHOICE, QuestionType.MULTI_SELECT, QuestionType.WORD_ARRANGEMENT].includes(newType);
                      const hadOptions = [QuestionType.VOCAB_CHOICE, QuestionType.MULTI_SELECT, QuestionType.WORD_ARRANGEMENT].includes(prev.questionType);
                      
                      return {
                        ...prev,
                        questionType: newType,
                        options: needsOptions ? (prev.options && prev.options.length > 0 ? prev.options : ['', '']) : [],
                        correctAnswer: (!needsOptions && hadOptions) ? '' : prev.correctAnswer,
                      };
                    });
                  }}
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

      {/* Question Preview Modal */}
      {previewQuestion && (
        <QuestionPreview
          isOpen={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
          questionData={transformDraftToQuestionData(previewQuestion)}
        />
      )}
    </div>
  );
}
