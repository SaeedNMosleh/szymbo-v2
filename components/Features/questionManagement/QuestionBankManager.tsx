"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Edit,
  Trash2,
  Archive,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface QuestionBankItem {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[];
  conceptNames: string[];
  difficulty: QuestionLevel;
  timesUsed: number;
  successRate: number;
  lastUsed: Date | null;
  createdDate: Date;
  isActive: boolean;
  source: "generated" | "manual";
  options?: string[];
  audioUrl?: string;
  imageUrl?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  search: string;
  conceptIds: string;
  questionType: string;
  difficulty: string;
  isActive: string;
  successRateMin: string;
  successRateMax: string;
  usageMin: string;
  usageMax: string;
}

interface EditingQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  targetConcepts: string[];
  difficulty: QuestionLevel;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  conceptIds: "",
  questionType: "",
  difficulty: "",
  isActive: "true",
  successRateMin: "",
  successRateMax: "",
  usageMin: "",
  usageMax: "",
};

export default function QuestionBankManager() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; permanent: boolean } | null>(null);
  const [concepts, setConcepts] = useState<{id: string; name: string}[]>([]);

  const fetchConcepts = useCallback(async () => {
    try {
      const response = await fetch("/api/concepts");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConcepts(data.data.concepts || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch concepts:", error);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/question-bank?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || "Failed to fetch questions");
      }
    } catch (err) {
      setError("Network error while fetching questions");
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const startEdit = (question: QuestionBankItem) => {
    setEditingQuestion({
      id: question.id,
      question: question.question,
      correctAnswer: question.correctAnswer,
      options: question.options || [],
      targetConcepts: question.targetConcepts,
      difficulty: question.difficulty,
    });
  };

  const saveEdit = async () => {
    if (!editingQuestion) return;

    try {
      const response = await fetch("/api/question-bank", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingQuestion),
      });

      const data = await response.json();
      if (data.success) {
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        setError(data.error || "Failed to update question");
      }
    } catch (err) {
      setError("Network error while updating question");
      console.error("Error updating question:", err);
    }
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  const confirmDelete = (questionId: string, permanent: boolean) => {
    setQuestionToDelete({ id: questionId, permanent });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      const response = await fetch("/api/question-bank", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionToDelete),
      });

      const data = await response.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        setQuestionToDelete(null);
        fetchQuestions();
      } else {
        setError(data.error || "Failed to delete question");
      }
    } catch (err) {
      setError("Network error while deleting question");
      console.error("Error deleting question:", err);
    }
  };

  const filteredConcepts = useMemo(() => {
    return concepts.filter(concept => 
      concept.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [concepts, filters.search]);

  const renderQuestionCard = (question: QuestionBankItem) => {
    const isExpanded = expandedQuestions.has(question.id);
    const isEditing = editingQuestion?.id === question.id;

    return (
      <Card key={question.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{question.questionType}</Badge>
                <Badge variant={question.difficulty === "A1" || question.difficulty === "A2" ? "default" : "secondary"}>
                  {question.difficulty}
                </Badge>
                <Badge variant={question.isActive ? "default" : "secondary"} 
                       className={question.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                  {question.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Math.round(question.successRate * 100)}% success
                </span>
              </div>
              {isEditing ? (
                <Textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, question: e.target.value } : null)}
                  className="mb-2"
                />
              ) : (
                <CardTitle className="text-base leading-relaxed">{question.question}</CardTitle>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {question.conceptNames.map((name, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" onClick={saveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save changes</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel editing</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => startEdit(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit question</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => confirmDelete(question.id, false)}
                        className={question.isActive 
                          ? "border-orange-300 text-orange-700 hover:bg-orange-50" 
                          : "border-green-300 text-green-700 hover:bg-green-50"
                        }
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{question.isActive ? "Deactivate question" : "Reactivate question"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={() => confirmDelete(question.id, true)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete permanently</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => toggleExpanded(question.id)}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? "Collapse details" : "Expand details"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <strong>Correct Answer:</strong>
                {isEditing ? (
                  <Input
                    value={editingQuestion.correctAnswer}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, correctAnswer: e.target.value } : null)}
                    className="mt-1"
                  />
                ) : (
                  <span className="ml-2">{question.correctAnswer}</span>
                )}
              </div>

              {question.options && question.options.length > 0 && (
                <div>
                  <strong>Options:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {question.options.map((option, idx) => (
                      <li key={idx}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Times Used:</strong> {question.timesUsed}
                </div>
                <div>
                  <strong>Success Rate:</strong> {Math.round(question.successRate * 100)}%
                </div>
                <div>
                  <strong>Last Used:</strong> {question.lastUsed ? new Date(question.lastUsed).toLocaleDateString() : "Never"}
                </div>
                <div>
                  <strong>Source:</strong> {question.source}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {new Date(question.createdDate).toLocaleString()}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={filters.questionType || "all"} onValueChange={(value) => handleFilterChange("questionType", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(QuestionType).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.difficulty || "all"} onValueChange={(value) => handleFilterChange("difficulty", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.values(QuestionLevel).map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.isActive || "true"} onValueChange={(value) => handleFilterChange("isActive", value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all filters and reset to defaults</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {pagination.total} questions total
          </span>
          <Select 
            value={pagination.limit.toString()} 
            onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to previous page</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to next page</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions found matching your criteria.
          </div>
        ) : (
          questions.map(renderQuestionCard)
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {questionToDelete?.permanent ? "Permanently Delete Question" : "Deactivate Question"}
            </DialogTitle>
            <DialogDescription>
              {questionToDelete?.permanent 
                ? "This action cannot be undone. The question will be permanently removed from the database."
                : "This will deactivate the question. It can be reactivated later."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={questionToDelete?.permanent ? "destructive" : "default"}
              onClick={handleDelete}
            >
              {questionToDelete?.permanent ? "Delete Permanently" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}