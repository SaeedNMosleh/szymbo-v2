"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Network,
  TreePine,
  Wand2,
  Upload,
  Search,
  Filter,
  BarChart3,
  Brain,
  Tags,
  Eye,
  Layers,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Zap,
  Globe,
  Star,
  ArrowRight,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Merge,
  Split,
} from "lucide-react";

// Import the components we created
import { ConceptMapViewer } from "@/components/Features/conceptManagement/ConceptMapViewer";
import { HierarchyBuilder } from "@/components/Features/conceptManagement/HierarchyBuilder";
import { BulkOperationsPanel } from "@/components/Features/conceptManagement/BulkOperationsPanel";
import { ConceptImporter } from "@/components/Features/conceptManagement/ConceptImporter";

// Types for the concept management page
interface ConceptData {
  id: string;
  name: string;
  category: "grammar" | "vocabulary";
  description: string;
  difficulty: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string;
  examples: string[];
  confidence: number;
  sourceType: "course" | "document" | "manual" | "import";
  vocabularyData?: {
    word: string;
    translation: string;
    partOfSpeech: string;
    gender?: string;
    pluralForm?: string;
    pronunciation?: string;
  };
}

interface ConceptStats {
  total: number;
  vocabulary: number;
  grammar: number;
  byDifficulty: Record<string, number>;
  bySource: Record<string, number>;
  recentlyAdded: number;
  topTags: Array<{ tag: string; count: number }>;
}

interface LLMExplorationResult {
  relatedConcepts: Array<{
    id: string;
    name: string;
    similarity: number;
    reasoning: string;
  }>;
  suggestedTags: string[];
  categoryAnalysis: string;
  difficultyAnalysis: string;
}

export default function ConceptManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "explorer" | "map" | "hierarchy" | "bulk" | "import"
  >("dashboard");
  const [concepts, setConcepts] = useState<ConceptData[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ConceptStats | null>(null);

  // LLM Exploration State
  const [llmQuery, setLlmQuery] = useState("");
  const [llmResults, setLlmResults] = useState<LLMExplorationResult | null>(
    null
  );
  const [selectedConcept, setSelectedConcept] = useState<ConceptData | null>(
    null
  );

  // Tag-based Category Creation
  const [categoryCreationMode, setCategoryCreationMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedTagsForCategory, setSelectedTagsForCategory] = useState<
    string[]
  >([]);

  // Load concepts from API
  const loadConcepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts?limit=2000");
      const data = await response.json();

      if (data.success) {
        setConcepts(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load concepts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  // Calculate statistics
  const calculateStats = useCallback((conceptData: ConceptData[]) => {
    const stats: ConceptStats = {
      total: conceptData.length,
      vocabulary: conceptData.filter((c) => c.category === "vocabulary").length,
      grammar: conceptData.filter((c) => c.category === "grammar").length,
      byDifficulty: {},
      bySource: {},
      recentlyAdded: conceptData.filter((c) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(c.lastUpdated) > oneWeekAgo;
      }).length,
      topTags: [],
    };

    // Count by difficulty
    conceptData.forEach((c) => {
      stats.byDifficulty[c.difficulty] =
        (stats.byDifficulty[c.difficulty] || 0) + 1;
      stats.bySource[c.sourceType] = (stats.bySource[c.sourceType] || 0) + 1;
    });

    // Count tags
    const tagCounts: Record<string, number> = {};
    conceptData.forEach((c) => {
      c.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    stats.topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    setStats(stats);
  }, []);

  // Filter concepts based on current filters
  const filteredConcepts = useMemo(() => {
    return concepts.filter((concept) => {
      const matchesSearch =
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        !categoryFilter ||
        categoryFilter === "all" ||
        concept.category === categoryFilter;
      const matchesDifficulty =
        !difficultyFilter ||
        difficultyFilter === "all" ||
        concept.difficulty === difficultyFilter;
      const matchesTag =
        !tagFilter || tagFilter === "all" || concept.tags.includes(tagFilter);

      return (
        matchesSearch && matchesCategory && matchesDifficulty && matchesTag
      );
    });
  }, [concepts, searchTerm, categoryFilter, difficultyFilter, tagFilter]);

  // Get unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    concepts.forEach((concept) => {
      concept.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [concepts]);

  // Load concepts on mount
  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  // Handle concept selection
  const toggleConceptSelection = useCallback((conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId]
    );
  }, []);

  // Handle LLM exploration
  const handleLLMExploration = useCallback(async () => {
    if (!llmQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: llmQuery,
          mode: "similarity",
          includeAnalysis: true,
          maxResults: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result: LLMExplorationResult = {
          relatedConcepts: data.data.relatedConcepts || [],
          suggestedTags: data.data.suggestedTags || [],
          categoryAnalysis: data.data.categoryAnalysis || "",
          difficultyAnalysis: data.data.difficultyAnalysis || "",
        };

        setLlmResults(result);
      } else {
        console.error("LLM exploration failed:", data.error);
      }
    } catch (error) {
      console.error("LLM exploration failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [llmQuery]);

  // Handle category creation from tags
  const handleCreateCategoryFromTags = useCallback(async () => {
    if (!newCategoryName || selectedTagsForCategory.length === 0) return;

    try {
      const response = await fetch("/api/concept-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: `Category created from tags: ${selectedTagsForCategory.join(", ")}`,
          groupType: "mixed",
          level: 2,
          difficulty: "A1",
        }),
      });

      if (response.ok) {
        // Add concepts with matching tags to the new category
        const conceptsToAdd = concepts
          .filter((c) =>
            c.tags.some((tag) => selectedTagsForCategory.includes(tag))
          )
          .map((c) => c.id);

        if (conceptsToAdd.length > 0) {
          const groupData = await response.json();
          await fetch(`/api/concept-groups/${groupData.data.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conceptIds: conceptsToAdd }),
          });
        }

        // Reset form
        setNewCategoryName("");
        setSelectedTagsForCategory([]);
        setCategoryCreationMode(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }, [newCategoryName, selectedTagsForCategory, concepts]);

  // Handle bulk operations
  const handleBulkOperation = useCallback(
    async (operation: any) => {
      try {
        const response = await fetch("/api/concepts/bulk-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operation),
        });

        const result = await response.json();

        if (result.success && !operation.preview) {
          await loadConcepts();
          setSelectedConcepts([]);
        }

        return result;
      } catch (error) {
        console.error("Bulk operation failed:", error);
        throw error;
      }
    },
    [loadConcepts]
  );

  // Transform data for visualization components
  const mapData = {
    nodes: filteredConcepts.map((concept, index) => ({
      id: concept.id,
      name: concept.name,
      category: concept.category,
      difficulty: concept.difficulty,
      x: 100 + (index % 15) * 60,
      y: 100 + Math.floor(index / 15) * 60,
      tags: concept.tags,
      isActive: concept.isActive,
    })),
    edges: [], // Would be populated from relationship API
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h1 className="mb-2 text-3xl font-bold">Concept Management Hub</h1>
        <p className="text-blue-100">
          Comprehensive concept organization, visualization, and intelligent
          management system
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <BookOpen className="mr-3 size-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Concepts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Users className="mr-3 size-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.vocabulary}</div>
                <div className="text-sm text-gray-600">Vocabulary</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <Target className="mr-3 size-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.grammar}</div>
                <div className="text-sm text-gray-600">Grammar</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <TrendingUp className="mr-3 size-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
                <div className="text-sm text-gray-600">Added This Week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Advanced Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vocabulary">Vocabulary</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setDifficultyFilter("all");
                setTagFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredConcepts.length} of {concepts.length} concepts
          </div>
        </CardContent>
      </Card>

      {/* Tag-based Category Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="size-5" />
            Create Categories from Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!categoryCreationMode ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Group concepts into meaningful categories based on their tags.
                This helps organize related concepts automatically.
              </p>

              {stats && stats.topTags.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">Most Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.map(({ tag, count }) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          setSelectedTagsForCategory([tag]);
                          setCategoryCreationMode(true);
                        }}
                      >
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setCategoryCreationMode(true)}>
                <Plus className="mr-2 size-4" />
                Create Category
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category Name
                </label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Tags
                </label>
                <div className="grid max-h-32 grid-cols-3 gap-2 overflow-y-auto">
                  {allTags.map((tag) => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTagsForCategory.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTagsForCategory([
                              ...selectedTagsForCategory,
                              tag,
                            ]);
                          } else {
                            setSelectedTagsForCategory(
                              selectedTagsForCategory.filter((t) => t !== tag)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedTagsForCategory.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Concepts that will be included (
                    {
                      concepts.filter((c) =>
                        c.tags.some((tag) =>
                          selectedTagsForCategory.includes(tag)
                        )
                      ).length
                    }
                    )
                  </label>
                  <div className="max-h-24 overflow-y-auto text-sm text-gray-600">
                    {concepts
                      .filter((c) =>
                        c.tags.some((tag) =>
                          selectedTagsForCategory.includes(tag)
                        )
                      )
                      .slice(0, 10)
                      .map((c) => c.name)
                      .join(", ")}
                    {concepts.filter((c) =>
                      c.tags.some((tag) =>
                        selectedTagsForCategory.includes(tag)
                      )
                    ).length > 10 && "..."}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCategoryFromTags}
                  disabled={
                    !newCategoryName || selectedTagsForCategory.length === 0
                  }
                >
                  Create Category
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategoryCreationMode(false);
                    setNewCategoryName("");
                    setSelectedTagsForCategory([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Visualization */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byDifficulty).map(([level, count]) => (
                  <div
                    key={level}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{level}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-blue-200"
                        style={{ width: `${(count / stats.total) * 100}px` }}
                      />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-green-200"
                        style={{ width: `${(count / stats.total) * 100}px` }}
                      />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Render LLM Explorer
  const renderLLMExplorer = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI-Powered Concept Explorer
          </CardTitle>
          <p className="text-gray-600">
            Use natural language to explore concepts beyond just tags. Ask about
            relationships, similarities, or get recommendations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Exploration Query
              </label>
              <Textarea
                value={llmQuery}
                onChange={(e) => setLlmQuery(e.target.value)}
                placeholder="e.g., 'Find concepts related to daily conversations', 'What grammar concepts should I learn before past tense?', 'Show me vocabulary about food and cooking'"
                rows={3}
              />
            </div>

            <Button
              onClick={handleLLMExploration}
              disabled={isLoading || !llmQuery.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Exploring...
                </>
              ) : (
                <>
                  <Zap className="mr-2 size-4" />
                  Explore with AI
                </>
              )}
            </Button>
          </div>

          {llmResults && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-800">
                  Analysis Summary
                </h4>
                <p className="mb-2 text-sm text-blue-700">
                  {llmResults.categoryAnalysis}
                </p>
                <p className="text-sm text-blue-700">
                  {llmResults.difficultyAnalysis}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Related Concepts</h4>
                <div className="space-y-2">
                  {llmResults.relatedConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                      <div>
                        <span className="font-medium">{concept.name}</span>
                        <p className="text-sm text-gray-600">
                          {concept.reasoning}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(concept.similarity * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Suggested Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {llmResults.suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concept Detail View */}
      {selectedConcept && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Concept Details: {selectedConcept.name}</span>
              <Button
                variant="outline"
                onClick={() => setSelectedConcept(null)}
              >
                <Eye className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <Badge
                      variant={
                        selectedConcept.category === "grammar"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedConcept.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <Badge variant="outline">
                      {selectedConcept.difficulty}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="capitalize">
                      {selectedConcept.sourceType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span>{Math.round(selectedConcept.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Description</h4>
                <p className="text-gray-700">{selectedConcept.description}</p>

                {selectedConcept.examples.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Examples</h4>
                    <ul className="list-inside list-disc space-y-1">
                      {selectedConcept.examples.map((example, idx) => (
                        <li key={idx} className="text-gray-700">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedConcept.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedConcept.vocabularyData && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Vocabulary Data</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Word:</span>{" "}
                        {selectedConcept.vocabularyData.word}
                      </div>
                      <div>
                        <span className="font-medium">Translation:</span>{" "}
                        {selectedConcept.vocabularyData.translation}
                      </div>
                      <div>
                        <span className="font-medium">Part of Speech:</span>{" "}
                        {selectedConcept.vocabularyData.partOfSpeech}
                      </div>
                      {selectedConcept.vocabularyData.gender && (
                        <div>
                          <span className="font-medium">Gender:</span>{" "}
                          {selectedConcept.vocabularyData.gender}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render concept list with selection
  const renderConceptList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Concepts ({filteredConcepts.length})</span>
          <div className="flex gap-2">
            {selectedConcepts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConcepts([])}
                >
                  Clear ({selectedConcepts.length})
                </Button>
                <Button variant="outline" size="sm">
                  <Merge className="mr-2 size-4" />
                  Merge
                </Button>
                <Button variant="outline" size="sm">
                  <Split className="mr-2 size-4" />
                  Split
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors hover:bg-gray-50 ${
                  selectedConcepts.includes(concept.id)
                    ? "border-blue-200 bg-blue-50"
                    : ""
                }`}
                onClick={() => toggleConceptSelection(concept.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedConcepts.includes(concept.id)}
                  onChange={() => toggleConceptSelection(concept.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{concept.name}</h4>
                    <Badge
                      variant={
                        concept.category === "grammar" ? "default" : "secondary"
                      }
                    >
                      {concept.category}
                    </Badge>
                    <Badge variant="outline">{concept.difficulty}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(concept.confidence * 100)}%
                    </Badge>
                  </div>

                  <p className="truncate text-sm text-gray-600">
                    {concept.description}
                  </p>

                  {concept.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {concept.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {concept.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{concept.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConcept(concept);
                      setActiveTab("explorer");
                    }}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="space-y-6"
        >
          {/* Tab Navigation */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="size-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="explorer" className="gap-2">
                <Brain className="size-4" />
                AI Explorer
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Network className="size-4" />
                Concept Map
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="gap-2">
                <TreePine className="size-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="bulk" className="gap-2">
                <Wand2 className="size-4" />
                Bulk Operations
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="size-4" />
                Import
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            {renderDashboard()}
            {renderConceptList()}
          </TabsContent>

          <TabsContent value="explorer">{renderLLMExplorer()}</TabsContent>

          <TabsContent value="map">
            <div className="rounded-lg bg-white shadow-sm">
              <ConceptMapViewer
                data={mapData}
                onNodeClick={(node) => {
                  const concept = concepts.find((c) => c.id === node.id);
                  if (concept) {
                    setSelectedConcept(concept);
                    setActiveTab("explorer");
                  }
                }}
                onEdgeClick={(edge) => console.log("Edge clicked:", edge)}
                onNodeDrag={(nodeId, x, y) =>
                  console.log("Node dragged:", nodeId, x, y)
                }
                width={1200}
                height={700}
              />
            </div>
          </TabsContent>

          <TabsContent value="hierarchy">
            <div className="h-[700px] rounded-lg bg-white shadow-sm">
              <HierarchyBuilder
                hierarchy={[]} // Would be populated from ConceptGroup API
                learningPaths={[]} // Would be populated from learning paths API
                onNodeMove={(nodeId, targetParentId, position) =>
                  console.log("Node moved:", nodeId, targetParentId, position)
                }
                onNodeClick={(node) =>
                  console.log("Hierarchy node clicked:", node)
                }
                onPathCreate={(path) => console.log("Path created:", path)}
                onPathUpdate={(pathId, updates) =>
                  console.log("Path updated:", pathId, updates)
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <BulkOperationsPanel
              selectedConcepts={
                selectedConcepts
                  .map((id) => {
                    const concept = concepts.find((c) => c.id === id);
                    return concept
                      ? {
                          id: concept.id,
                          name: concept.name,
                          category: concept.category,
                          difficulty: concept.difficulty,
                          tags: concept.tags,
                        }
                      : null;
                  })
                  .filter(Boolean) as any
              }
              onExecuteOperation={handleBulkOperation}
              onConceptSelect={setSelectedConcepts}
            />
          </TabsContent>

          <TabsContent value="import">
            <ConceptImporter
              onImportComplete={(result) => {
                if (result.success) {
                  loadConcepts();
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
