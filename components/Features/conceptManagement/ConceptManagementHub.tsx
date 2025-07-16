"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Network,
  TreePine,
  Wand2,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Merge,
  Split,
} from "lucide-react";

// Import the components we created
import { ConceptMapViewer } from "./ConceptMapViewer";
import { HierarchyBuilder } from "./HierarchyBuilder";
import { BulkOperationsPanel } from "./BulkOperationsPanel";
import { ConceptImporter } from "./ConceptImporter";

// Types for the main hub
interface ConceptSummary {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string;
}

interface ConceptManagementHubProps {
  initialConcepts?: ConceptSummary[];
  onConceptUpdate?: (conceptId: string, updates: any) => void;
  onConceptDelete?: (conceptId: string) => void;
}

export const ConceptManagementHub: React.FC<ConceptManagementHubProps> = ({
  initialConcepts = [],
  onConceptUpdate,
  onConceptDelete,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "map" | "hierarchy" | "bulk" | "import"
  >("overview");
  const [concepts, setConcepts] = useState<ConceptSummary[]>(initialConcepts);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load concepts from API
  const loadConcepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/concepts?limit=1000");
      const data = await response.json();

      if (data.success) {
        setConcepts(data.data);
      }
    } catch (error) {
      console.error("Failed to load concepts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load concepts on mount
  useEffect(() => {
    if (initialConcepts.length === 0) {
      loadConcepts();
    }
  }, [initialConcepts.length, loadConcepts]);

  // Filter concepts based on search and filters
  const filteredConcepts = concepts.filter((concept) => {
    const matchesSearch =
      concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concept.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      !filterCategory || concept.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle concept selection
  const toggleConceptSelection = useCallback((conceptId: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId]
    );
  }, []);

  // Handle bulk concept selection
  const selectAllVisible = useCallback(() => {
    setSelectedConcepts(filteredConcepts.map((c) => c.id));
  }, [filteredConcepts]);

  const clearSelection = useCallback(() => {
    setSelectedConcepts([]);
  }, []);

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
          // Refresh concepts after successful bulk operation
          await loadConcepts();
          clearSelection();
        }

        return result;
      } catch (error) {
        console.error("Bulk operation failed:", error);
        throw error;
      }
    },
    [loadConcepts, clearSelection]
  );

  // Handle concept merge
  const handleConceptMerge = useCallback(async () => {
    if (selectedConcepts.length < 2) return;

    // This would open a merge dialog in a real implementation
    console.log("Merging concepts:", selectedConcepts);
  }, [selectedConcepts]);

  // Handle concept split
  const handleConceptSplit = useCallback(async () => {
    if (selectedConcepts.length !== 1) return;

    // This would open a split dialog in a real implementation
    console.log("Splitting concept:", selectedConcepts[0]);
  }, [selectedConcepts]);

  // Transform data for visualization components
  const mapData = {
    nodes: filteredConcepts.map((concept, index) => ({
      id: concept.id,
      name: concept.name,
      category: concept.category as "grammar" | "vocabulary",
      difficulty: concept.difficulty,
      x: 100 + (index % 10) * 80,
      y: 100 + Math.floor(index / 10) * 80,
      tags: concept.tags,
      isActive: concept.isActive,
    })),
    edges: [], // Would be populated from relationship API
  };

  const hierarchyData = [
    // Mock hierarchy data - would come from ConceptGroup API
    {
      id: "vocab-root",
      name: "Vocabulary",
      type: "group" as const,
      groupType: "vocabulary" as const,
      level: 3,
      difficulty: "A1",
      children: [
        {
          id: "household",
          name: "Household",
          type: "group" as const,
          groupType: "vocabulary" as const,
          level: 2,
          difficulty: "A1",
          children: [],
          conceptCount: 25,
        },
      ],
      conceptCount: 150,
    },
  ];

  const learningPaths = [
    // Mock learning paths
    {
      id: "beginner-path",
      name: "Beginner Polish",
      description: "Essential concepts for Polish beginners",
      steps: [
        {
          nodeId: "greetings",
          nodeName: "Basic Greetings",
          type: "concept" as const,
        },
        {
          nodeId: "numbers",
          nodeName: "Numbers 1-10",
          type: "concept" as const,
        },
      ],
      estimatedDuration: "2 weeks",
      difficulty: "A1",
    },
  ];

  // Render concept overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{concepts.length}</div>
            <div className="text-sm text-gray-600">Total Concepts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {concepts.filter((c) => c.category === "vocabulary").length}
            </div>
            <div className="text-sm text-gray-600">Vocabulary</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {concepts.filter((c) => c.category === "grammar").length}
            </div>
            <div className="text-sm text-gray-600">Grammar</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{selectedConcepts.length}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="grammar">Grammar</option>
            </select>

            <Button variant="outline" onClick={selectAllVisible}>
              Select All
            </Button>

            {selectedConcepts.length > 0 && (
              <>
                <Button variant="outline" onClick={clearSelection}>
                  Clear Selection
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConceptMerge}
                    disabled={selectedConcepts.length < 2}
                  >
                    <Merge className="mr-2 size-4" />
                    Merge
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConceptSplit}
                    disabled={selectedConcepts.length !== 1}
                  >
                    <Split className="mr-2 size-4" />
                    Split
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Concept List */}
      <Card>
        <CardHeader>
          <CardTitle>Concepts ({filteredConcepts.length})</CardTitle>
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
                          concept.category === "grammar"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {concept.category}
                      </Badge>
                      <Badge variant="outline">{concept.difficulty}</Badge>
                    </div>

                    {concept.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {concept.tags.slice(0, 3).map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
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
    </div>
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Concept Management Hub</h1>
            <p className="text-gray-600">
              Comprehensive concept organization, visualization, and management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="mr-2 size-4" />
              Advanced Filters
            </Button>

            <Button>
              <Upload className="mr-2 size-4" />
              Quick Import
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="h-full"
        >
          <div className="border-b bg-gray-50 px-4">
            <TabsList className="h-12">
              <TabsTrigger value="overview" className="gap-2">
                <Search className="size-4" />
                Overview
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

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full overflow-auto p-6">
              {renderOverview()}
            </TabsContent>

            <TabsContent value="map" className="h-full">
              <ConceptMapViewer
                data={mapData}
                onNodeClick={(node) => console.log("Node clicked:", node)}
                onEdgeClick={(edge) => console.log("Edge clicked:", edge)}
                onNodeDrag={(nodeId, x, y) =>
                  console.log("Node dragged:", nodeId, x, y)
                }
              />
            </TabsContent>

            <TabsContent value="hierarchy" className="h-full">
              <HierarchyBuilder
                hierarchy={hierarchyData}
                learningPaths={learningPaths}
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
            </TabsContent>

            <TabsContent value="bulk" className="h-full overflow-auto p-6">
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

            <TabsContent value="import" className="h-full overflow-auto p-6">
              <ConceptImporter
                onImportComplete={(result) => {
                  if (result.success) {
                    loadConcepts(); // Refresh concepts after import
                  }
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
