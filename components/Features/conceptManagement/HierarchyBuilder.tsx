"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
  Users,
  Target,
} from "lucide-react";

// Types for hierarchy management
interface HierarchyNode {
  id: string;
  name: string;
  type: "group" | "concept";
  groupType?: "vocabulary" | "grammar" | "mixed";
  level: number;
  difficulty: string;
  children: HierarchyNode[];
  conceptCount?: number;
  isExpanded?: boolean;
  parentId?: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  steps: {
    nodeId: string;
    nodeName: string;
    type: "prerequisite" | "concept" | "milestone";
    isCompleted?: boolean;
  }[];
  estimatedDuration: string;
  difficulty: string;
}

interface HierarchyBuilderProps {
  hierarchy: HierarchyNode[];
  learningPaths: LearningPath[];
  onNodeMove?: (
    nodeId: string,
    targetParentId: string | null,
    position: number
  ) => void;
  onNodeClick?: (node: HierarchyNode) => void;
  onPathCreate?: (path: Partial<LearningPath>) => void;
  onPathUpdate?: (pathId: string, updates: Partial<LearningPath>) => void;
}

export const HierarchyBuilder: React.FC<HierarchyBuilderProps> = ({
  hierarchy,
  learningPaths,
  onNodeMove,
  onNodeClick,
  onPathCreate,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hierarchy" | "paths">(
    "hierarchy"
  );
  const [newPathName, setNewPathName] = useState("");
  const [pathBuilder, setPathBuilder] = useState<string[]>([]);

  // Toggle node expansion
  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handle drag and drop
  const handleDragStart = useCallback((nodeId: string) => {
    setDraggedNode(nodeId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetNodeId: string, position: number = 0) => {
      if (!draggedNode || draggedNode === targetNodeId) return;

      onNodeMove?.(draggedNode, targetNodeId, position);
      setDraggedNode(null);
    },
    [draggedNode, onNodeMove]
  );

  // Render individual hierarchy node
  const renderHierarchyNode = (
    node: HierarchyNode,
    depth: number = 0
  ): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-gray-50 ${
            isSelected ? "border border-blue-200 bg-blue-50" : ""
          } ${draggedNode === node.id ? "opacity-50" : ""}`}
          style={{ marginLeft: `${depth * 20}px` }}
          draggable
          onDragStart={() => handleDragStart(node.id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(node.id)}
          onClick={() => {
            setSelectedNode(node.id);
            onNodeClick?.(node);
          }}
        >
          {/* Expansion toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              className="rounded p-1 hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          ) : (
            <div className="size-6" />
          )}

          {/* Node icon */}
          <div className="shrink-0">
            {node.type === "group" ? (
              <Users className="size-4 text-blue-500" />
            ) : (
              <BookOpen className="size-4 text-green-500" />
            )}
          </div>

          {/* Node content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{node.name}</span>
              {node.type === "group" && (
                <Badge variant="outline" className="text-xs">
                  {node.groupType}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Level {node.level}</span>
              <span>•</span>
              <span>{node.difficulty}</span>
              {node.conceptCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{node.conceptCount} concepts</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPathBuilder((prev) => [...prev, node.id]);
              }}
              className="h-auto p-1"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) =>
              renderHierarchyNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render learning path
  const renderLearningPath = (path: LearningPath): React.ReactNode => {
    return (
      <Card key={path.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{path.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{path.difficulty}</Badge>
              <Badge variant="secondary">{path.estimatedDuration}</Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">{path.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {path.steps.map((step, index) => (
              <div
                key={`${step.nodeId}-${index}`}
                className="flex items-center gap-3"
              >
                <div className="shrink-0">
                  {step.type === "prerequisite" && (
                    <Target className="size-4 text-orange-500" />
                  )}
                  {step.type === "concept" && (
                    <BookOpen className="size-4 text-blue-500" />
                  )}
                  {step.type === "milestone" && (
                    <div className="size-4 rounded-full bg-green-500" />
                  )}
                </div>

                <span
                  className={`flex-1 ${step.isCompleted ? "text-gray-500 line-through" : ""}`}
                >
                  {step.nodeName}
                </span>

                {step.isCompleted && (
                  <div className="flex size-4 items-center justify-center rounded-full bg-green-500">
                    <div className="size-2 rounded-full bg-white" />
                  </div>
                )}

                {index < path.steps.length - 1 && (
                  <ArrowRight className="size-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit Path
            </Button>
            <Button variant="outline" size="sm">
              Duplicate
            </Button>
            <Button variant="outline" size="sm" className="text-red-600">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "hierarchy"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("hierarchy")}
        >
          Concept Hierarchy
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "paths"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("paths")}
        >
          Learning Paths ({learningPaths.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "hierarchy" && (
          <div className="flex h-full">
            {/* Hierarchy Tree */}
            <div className="flex-1 border-r">
              <ScrollArea className="h-full p-4">
                <div className="mb-4">
                  <h3 className="mb-2 font-medium">
                    Concept Groups & Hierarchy
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Drag and drop to reorganize concepts. Click to select.
                  </p>
                </div>

                <div className="space-y-1">
                  {hierarchy.map((node) => renderHierarchyNode(node))}
                </div>
              </ScrollArea>
            </div>

            {/* Path Builder */}
            <div className="w-80 bg-gray-50">
              <div className="border-b bg-white p-4">
                <h3 className="mb-2 font-medium">Path Builder</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Path name..."
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newPathName && pathBuilder.length > 0) {
                        onPathCreate?.({
                          name: newPathName,
                          steps: pathBuilder.map((nodeId, index) => {
                            const node = findNodeById(hierarchy, nodeId);
                            return {
                              nodeId,
                              nodeName: node?.name || "Unknown",
                              type: index === 0 ? "prerequisite" : "concept",
                            };
                          }),
                        } as Partial<LearningPath>);
                        setNewPathName("");
                        setPathBuilder([]);
                      }
                    }}
                  >
                    Create
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-full p-4">
                <div className="space-y-2">
                  {pathBuilder.map((nodeId, index) => {
                    const node = findNodeById(hierarchy, nodeId);
                    return (
                      <div
                        key={`${nodeId}-${index}`}
                        className="flex items-center gap-2 rounded border bg-white p-2"
                      >
                        <span className="text-sm font-medium">
                          {index + 1}.
                        </span>
                        <span className="flex-1 text-sm">
                          {node?.name || "Unknown"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPathBuilder((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="h-auto p-1"
                        >
                          <Minus className="size-3" />
                        </Button>
                      </div>
                    );
                  })}

                  {pathBuilder.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-500">
                      Click + on concepts to add them to your learning path
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {activeTab === "paths" && (
          <ScrollArea className="h-full p-4">
            <div className="mb-4">
              <h3 className="mb-2 font-medium">Learning Paths</h3>
              <p className="text-sm text-gray-600">
                Prerequisite chains and learning progression pathways.
              </p>
            </div>

            {learningPaths.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Target className="mx-auto mb-4 size-12 text-gray-300" />
                <p>No learning paths created yet.</p>
                <p className="text-sm">
                  Create your first path using the hierarchy tab.
                </p>
              </div>
            ) : (
              <div>{learningPaths.map(renderLearningPath)}</div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

// Helper function to find a node by ID in the hierarchy
function findNodeById(
  nodes: HierarchyNode[],
  id: string
): HierarchyNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}
