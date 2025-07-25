"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  Tags,
  CheckCircle,
  AlertCircle,
  Eye,
  Play,
  RotateCcw,
} from "lucide-react";
import { QuestionLevel } from "@/lib/enum";

// Types for bulk operations
interface BulkOperation {
  type: "tag-assignment" | "category-change" | "difficulty-change";
  conceptIds: string[];
  parameters: Record<string, unknown>;
  preview: boolean;
}

interface OperationChange {
  conceptName: string;
  oldValue: unknown;
  newValue: unknown;
  applied: boolean;
  error?: string;
}

interface BulkOperationResult {
  operation: string;
  conceptsProcessed: number;
  preview: boolean;
  changes?: OperationChange[];
  summary: Record<string, unknown>;
}

interface OperationParams {
  tags?: string[];
  newCategory?: string;
  newDifficulty?: string;
  analysisPrompt?: string;
  autoApprove?: boolean;
  [key: string]: unknown;
}

interface ConceptSummary {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  tags: string[];
}

interface BulkOperationsPanelProps {
  selectedConcepts: ConceptSummary[];
  onExecuteOperation?: (
    operation: BulkOperation
  ) => Promise<BulkOperationResult>;
  onConceptSelect?: (conceptIds: string[]) => void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedConcepts,
  onExecuteOperation,
}) => {
  const [activeOperation, setActiveOperation] =
    useState<BulkOperation["type"]>("tag-assignment");
  const [operationParams, setOperationParams] = useState<OperationParams>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<BulkOperationResult | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState(true);

  // Handle operation execution
  const executeOperation = useCallback(async () => {
    if (selectedConcepts.length === 0) return;

    const operation: BulkOperation = {
      type: activeOperation,
      conceptIds: selectedConcepts.map((c) => c.id),
      parameters: operationParams,
      preview: previewMode,
    };

    setIsLoading(true);
    try {
      const result = await onExecuteOperation?.(operation);
      if (result) {
        setLastResult(result);
      }
    } catch (error) {
      console.error("Bulk operation failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeOperation,
    selectedConcepts,
    operationParams,
    previewMode,
    onExecuteOperation,
  ]);

  // Render tag assignment interface
  const RenderTagAssignment = () => {
    const [newTag, setNewTag] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>(
      operationParams.tags || []
    );

    const addTag = () => {
      if (newTag && !selectedTags.includes(newTag)) {
        const updatedTags = [...selectedTags, newTag];
        setSelectedTags(updatedTags);
        setOperationParams({ ...operationParams, tags: updatedTags });
        setNewTag("");
      }
    };

    const removeTag = (tag: string) => {
      const updatedTags = selectedTags.filter((t) => t !== tag);
      setSelectedTags(updatedTags);
      setOperationParams({ ...operationParams, tags: updatedTags });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Add Tags</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTag()}
            />
            <Button onClick={addTag} disabled={!newTag}>
              <Tags className="mr-2 size-4" />
              Add
            </Button>
          </div>
        </div>

        {selectedTags.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Selected Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render category change interface
  const renderCategoryChange = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">New Category</label>
          <Select
            value={operationParams.newCategory || ""}
            onValueChange={(value) =>
              setOperationParams({ ...operationParams, newCategory: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grammar">Grammar</SelectItem>
              <SelectItem value="vocabulary">Vocabulary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Render difficulty change interface
  const renderDifficultyChange = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            New Difficulty Level
          </label>
          <Select
            value={operationParams.newDifficulty || ""}
            onValueChange={(value) =>
              setOperationParams({ ...operationParams, newDifficulty: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
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
    );
  };

  // Render operation results
  const renderResults = () => {
    if (!lastResult) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {lastResult.preview ? (
              <Eye className="size-5" />
            ) : (
              <CheckCircle className="size-5" />
            )}
            {lastResult.preview ? "Preview Results" : "Operation Complete"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded bg-gray-50 p-3">
              <h4 className="mb-2 font-medium">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Concepts Processed:</span>
                  <span className="ml-2 font-medium">
                    {lastResult.conceptsProcessed}
                  </span>
                </div>
                {Object.entries(lastResult.summary).map(([key, value]) => (
                  <div key={key}>
                    <span className="capitalize text-gray-600">
                      {key.replace(/([A-Z])/g, " $1")}:
                    </span>
                    <span className="ml-2 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Changes */}
            {lastResult.changes && lastResult.changes.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">Changes</h4>
                <ScrollArea className="h-48 rounded border">
                  <div className="space-y-2 p-2">
                    {lastResult.changes.map((change, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded bg-gray-50 p-2 text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {change.conceptName}
                          </div>
                          <div className="text-gray-600">
                            {String(change.oldValue)} →{" "}
                            {String(change.newValue)}
                          </div>
                        </div>
                        {change.applied ? (
                          <CheckCircle className="size-4 text-green-500" />
                        ) : change.error ? (
                          <AlertCircle className="size-4 text-red-500" />
                        ) : (
                          <Eye className="size-4 text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            {lastResult.preview && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPreviewMode(false);
                    executeOperation();
                  }}
                  disabled={isLoading}
                >
                  <Play className="mr-2 size-4" />
                  Apply Changes
                </Button>
                <Button variant="outline" onClick={() => setLastResult(null)}>
                  <RotateCcw className="mr-2 size-4" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Selected Concepts Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Operations</CardTitle>
          <p className="text-sm text-gray-600">
            Perform batch operations on {selectedConcepts.length} selected
            concepts
          </p>
        </CardHeader>
        <CardContent>
          {selectedConcepts.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No concepts selected. Select concepts to perform bulk operations.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected concepts preview */}
              <div>
                <h4 className="mb-2 font-medium">
                  Selected Concepts ({selectedConcepts.length})
                </h4>
                <ScrollArea className="h-24 rounded border">
                  <div className="space-y-1 p-2">
                    {selectedConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{concept.name}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {concept.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {concept.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Operation Selection */}
              <Tabs
                value={activeOperation}
                onValueChange={(value) =>
                  setActiveOperation(value as BulkOperation["type"])
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tag-assignment">Tags</TabsTrigger>
                  <TabsTrigger value="category-change">Category</TabsTrigger>
                  <TabsTrigger value="difficulty-change">
                    Difficulty
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tag-assignment">
                  <RenderTagAssignment />
                </TabsContent>

                <TabsContent value="category-change">
                  {renderCategoryChange()}
                </TabsContent>

                <TabsContent value="difficulty-change">
                  {renderDifficultyChange()}
                </TabsContent>
              </Tabs>

              {/* Preview Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="previewMode"
                  checked={previewMode}
                  onCheckedChange={setPreviewMode}
                />
                <label htmlFor="previewMode" className="text-sm font-medium">
                  Preview changes before applying
                </label>
              </div>

              {/* Execute Button */}
              <Button
                onClick={executeOperation}
                disabled={isLoading || selectedConcepts.length === 0}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 size-4" />
                    {previewMode ? "Preview" : "Execute"} Operation
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {renderResults()}
    </div>
  );
};
