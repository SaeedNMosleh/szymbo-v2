"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  Hash,
  BookOpen,
  Target,
} from "lucide-react";
import { ConceptCategory } from "@/lib/enum";

interface FetchedConcept {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  examples?: string[];
  difficulty: string;
  tags?: string[];
}

interface ConceptWithSelection {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  examples: string[];
  difficulty: string;
  tags: string[];
  selected: boolean;
  questionCount: number;
}

interface CategoryGroup {
  category: ConceptCategory;
  concepts: ConceptWithSelection[];
  selectedCount: number;
  totalCount: number;
  expanded: boolean;
}

interface CoverageItem {
  conceptId: string;
  conceptName: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
}

interface EnhancedConceptSelectorProps {
  selectedConceptIds: string[];
  onSelectionChange: (conceptIds: string[]) => void;
  maxHeight?: string;
  showQuestionCounts?: boolean;
}

export default function EnhancedConceptSelector({
  selectedConceptIds,
  onSelectionChange,
  maxHeight = "600px",
  showQuestionCounts = true,
}: EnhancedConceptSelectorProps) {
  const [concepts, setConcepts] = useState<ConceptWithSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ConceptCategory>
  >(new Set());

  const organizeByCategory = useCallback(
    (conceptList: ConceptWithSelection[]) => {
      const groups: CategoryGroup[] = Object.values(ConceptCategory)
        .map((category) => {
          const categoryConcepts = conceptList.filter(
            (concept) => concept.category === category
          );
          const selectedCount = categoryConcepts.filter((concept) =>
            selectedConceptIds.includes(concept.id)
          ).length;

          return {
            category,
            concepts: categoryConcepts.map((concept) => ({
              ...concept,
              selected: selectedConceptIds.includes(concept.id),
            })),
            selectedCount,
            totalCount: categoryConcepts.length,
            expanded: expandedCategories.has(category) || selectedCount > 0,
          };
        })
        .filter((group) => group.totalCount > 0);

      setCategoryGroups(groups);
    },
    [selectedConceptIds, expandedCategories]
  );

  const fetchConcepts = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch concepts and coverage data in parallel
      const [conceptsResponse, coverageResponse] = await Promise.all([
        fetch("/api/concepts?limit=1000"), // Support up to 1000 concepts
        fetch("/api/question-management/coverage"),
      ]);

      if (!conceptsResponse.ok) throw new Error("Failed to fetch concepts");
      if (!coverageResponse.ok)
        throw new Error("Failed to fetch coverage data");

      const conceptsData = await conceptsResponse.json();
      const coverageData = await coverageResponse.json();

      const fetchedConcepts = conceptsData.data || conceptsData.concepts || [];
      const coverage = coverageData.data?.coverage || [];

      // Create coverage map for quick lookup
      const coverageMap = new Map<string, number>();
      coverage.forEach((item: CoverageItem) => {
        coverageMap.set(item.conceptId, item.totalQuestions || 0);
      });

      // Add initial selection state and real question counts
      const conceptsWithSelection: ConceptWithSelection[] = fetchedConcepts.map(
        (concept: FetchedConcept) => ({
          id: concept.id,
          name: concept.name,
          category: concept.category,
          description: concept.description,
          examples: concept.examples || [],
          difficulty: concept.difficulty,
          tags: concept.tags || [],
          selected: false, // Initial state, will be updated by organizeByCategory
          questionCount: coverageMap.get(concept.id) || 0,
        })
      );

      setConcepts(conceptsWithSelection);
    } catch (error) {
      console.error("Failed to fetch concepts:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies array to fetch only once

  // Fetch concepts only once on mount
  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  // Update organization when selectedConceptIds changes
  useEffect(() => {
    if (concepts.length > 0) {
      organizeByCategory(concepts);
    }
  }, [selectedConceptIds, expandedCategories, concepts, organizeByCategory]);

  // Filter concepts based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return categoryGroups;

    return categoryGroups
      .map((group) => ({
        ...group,
        concepts: group.concepts.filter(
          (concept) =>
            concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            concept.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((group) => group.concepts.length > 0);
  }, [categoryGroups, searchQuery]);

  const toggleCategoryExpansion = (category: ConceptCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);

    setCategoryGroups((prev) =>
      prev.map((group) =>
        group.category === category
          ? { ...group, expanded: newExpanded.has(category) }
          : group
      )
    );
  };

  const toggleConceptSelection = (conceptId: string) => {
    const newSelected = selectedConceptIds.includes(conceptId)
      ? selectedConceptIds.filter((id) => id !== conceptId)
      : [...selectedConceptIds, conceptId];

    onSelectionChange(newSelected);
  };

  const toggleCategorySelection = (
    category: ConceptCategory,
    selectAll: boolean
  ) => {
    const categoryConcepts = concepts.filter((c) => c.category === category);
    const categoryIds = categoryConcepts.map((c) => c.id);

    let newSelected: string[];
    if (selectAll) {
      // Add all concepts in this category
      newSelected = [...new Set([...selectedConceptIds, ...categoryIds])];
    } else {
      // Remove all concepts in this category
      newSelected = selectedConceptIds.filter(
        (id) => !categoryIds.includes(id)
      );
    }

    onSelectionChange(newSelected);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getCategoryIcon = (category: ConceptCategory) => {
    switch (category) {
      case ConceptCategory.GRAMMAR:
        return <BookOpen className="size-4" />;
      case ConceptCategory.VOCABULARY:
        return <Hash className="size-4" />;
      default:
        return <Target className="size-4" />;
    }
  };

  const getCategoryColor = (category: ConceptCategory) => {
    switch (category) {
      case ConceptCategory.GRAMMAR:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case ConceptCategory.VOCABULARY:
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const totalSelected = selectedConceptIds.length;
  const totalAvailable = concepts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading concepts...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Concept Selection</h3>
          <Badge variant="secondary" className="text-xs">
            {totalSelected} of {totalAvailable} selected
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 size-6 -translate-y-1/2 p-0"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Concept List */}
      <ScrollArea style={{ height: maxHeight }}>
        <div className="p-2">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {searchQuery
                ? "No concepts match your search"
                : "No concepts available"}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="mb-2">
                {/* Category Header */}
                <div className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50">
                  <div className="flex flex-1 items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategoryExpansion(group.category)}
                      className="size-6 p-0"
                    >
                      {group.expanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                    </Button>

                    {getCategoryIcon(group.category)}

                    <span className="text-sm font-medium text-gray-900">
                      {group.category}
                    </span>

                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(group.category)}`}
                    >
                      {group.selectedCount}/{group.totalCount}
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleCategorySelection(
                        group.category,
                        group.selectedCount === 0
                      )
                    }
                    className="h-6 px-2 text-xs"
                  >
                    {group.selectedCount === group.totalCount ? (
                      <>
                        <CheckSquare className="mr-1 size-3" />
                        Deselect All
                      </>
                    ) : group.selectedCount === 0 ? (
                      <>
                        <Square className="mr-1 size-3" />
                        Select All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-1 size-3" />
                        Select All
                      </>
                    )}
                  </Button>
                </div>

                {/* Category Concepts */}
                {group.expanded && (
                  <div className="ml-6 space-y-1">
                    {group.concepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-gray-50 w-full"
                        onClick={() => toggleConceptSelection(concept.id)}
                      >
                        <Checkbox
                          checked={concept.selected}
                          onCheckedChange={() =>
                            toggleConceptSelection(concept.id)
                          }
                        />

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-gray-900 flex-1 min-w-0">
                              {concept.name}
                            </span>
                            {showQuestionCounts && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex-shrink-0"
                              >
                                {concept.questionCount}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-2 overflow-hidden">
                            <Badge
                              variant="outline"
                              className={`text-xs flex-shrink-0 ${getCategoryColor(concept.category)}`}
                            >
                              {concept.difficulty}
                            </Badge>
                            {concept.tags && concept.tags.length > 0 && (
                              <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                                <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                                  {concept.tags.map((tag, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="px-1 py-0 text-xs whitespace-nowrap flex-shrink-0"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {concept.description && (
                            <div className="mt-1 text-xs text-gray-500 line-clamp-2 max-w-full overflow-hidden">
                              {concept.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {group !== filteredGroups[filteredGroups.length - 1] && (
                  <div className="my-2 border-t border-gray-100" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {totalSelected > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalSelected} concept{totalSelected !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
