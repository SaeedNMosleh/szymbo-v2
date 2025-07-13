"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionType, QuestionLevel, ConceptCategory } from "@/lib/enum";
import { Progress } from "@/components/ui/progress";

interface CoverageData {
  conceptId: string;
  conceptName: string;
  category: ConceptCategory;
  difficulty: QuestionLevel;
  coverage: Record<QuestionType, number>;
  totalQuestions: number;
}

interface CoverageStats {
  totalConcepts: number;
  totalQuestions: number;
  wellCovered: number; // concepts with 5+ questions across types
  needsAttention: number; // concepts with <3 questions total
  coverageByType: Record<QuestionType, number>;
  coverageByCategory: Record<ConceptCategory, number>;
}

interface QuestionCoverageDashboardProps {
  refreshTrigger: number;
}

export default function QuestionCoverageDashboard({
  refreshTrigger,
}: QuestionCoverageDashboardProps) {
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [stats, setStats] = useState<CoverageStats | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ConceptCategory | "all">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoverageData();
  }, [refreshTrigger]);

  const fetchCoverageData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/question-management/coverage");
      if (!response.ok) throw new Error("Failed to fetch coverage data");

      const data = await response.json();
      setCoverageData(data.coverage || []);
      setStats(data.stats || null);
    } catch (err) {
      setError("Failed to load coverage data");
    } finally {
      setIsLoading(false);
    }
  };

  const getCoverageColor = (count: number): string => {
    if (count === 0) return "bg-red-100 border-red-200 text-red-800";
    if (count < 3) return "bg-yellow-100 border-yellow-200 text-yellow-800";
    if (count < 7) return "bg-green-100 border-green-200 text-green-800";
    return "bg-blue-100 border-blue-200 text-blue-800";
  };

  const getCoverageLabel = (count: number): string => {
    if (count === 0) return "None";
    if (count < 3) return "Low";
    if (count < 7) return "Good";
    return "High";
  };

  const filteredData = coverageData.filter(
    (concept) => filterCategory === "all" || concept.category === filterCategory
  );

  const questionTypes = Object.values(QuestionType);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">Loading coverage data...</div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConcepts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Well Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.wellCovered}
              </div>
              <p className="text-xs text-muted-foreground">5+ questions each</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.needsAttention}
              </div>
              <p className="text-xs text-muted-foreground">
                &lt;3 questions total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coverage by Category */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Coverage by Category</CardTitle>
            <CardDescription>
              Question distribution across concept categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.coverageByCategory).map(
                ([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{category}</Badge>
                      <span className="text-sm">{count} questions</span>
                    </div>
                    <Progress
                      value={(count / stats.totalQuestions) * 100}
                      className="w-32"
                    />
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select
          value={filterCategory}
          onValueChange={(value) => setFilterCategory(value as any)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(ConceptCategory).map((category) => (
              <SelectItem key={category} value={category}>
                {category.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          Showing {filteredData.length} concepts
        </span>
      </div>

      {/* Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Question Coverage Matrix</CardTitle>
          <CardDescription>
            Click on cells to view detailed question breakdown. Colors indicate
            coverage level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header */}
              <div className="flex">
                <div className="w-64 border-b border-r bg-gray-50 p-3 font-medium">
                  Concept
                </div>
                {questionTypes.map((type) => (
                  <div
                    key={type}
                    className="w-20 border-b bg-gray-50 p-2 text-center text-xs font-medium"
                  >
                    {type.replace(/_/g, " ").slice(0, 8)}
                  </div>
                ))}
                <div className="w-16 border-b bg-gray-50 p-2 text-center text-xs font-medium">
                  Total
                </div>
              </div>

              {/* Data Rows */}
              <div className="max-h-96 overflow-y-auto">
                {filteredData.map((concept) => (
                  <div
                    key={concept.conceptId}
                    className="flex border-b hover:bg-gray-50"
                  >
                    <div className="w-64 border-r p-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {concept.conceptName}
                        </span>
                        <div className="mt-1 flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {concept.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {concept.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {questionTypes.map((type) => {
                      const count = concept.coverage[type] || 0;
                      return (
                        <div
                          key={type}
                          className={`w-20 cursor-pointer border-r p-2 text-center text-xs ${getCoverageColor(count)}`}
                          onClick={() =>
                            setSelectedConcept(
                              selectedConcept === concept.conceptId
                                ? null
                                : concept.conceptId
                            )
                          }
                        >
                          {count}
                        </div>
                      );
                    })}

                    <div className="w-16 p-2 text-center text-xs font-medium">
                      {concept.totalQuestions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center space-x-4 text-xs">
            <span className="font-medium">Coverage Level:</span>
            <div className="flex items-center space-x-1">
              <div className="size-4 rounded border border-red-200 bg-red-100"></div>
              <span>None (0)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="size-4 rounded border border-yellow-200 bg-yellow-100"></div>
              <span>Low (1-2)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="size-4 rounded border border-green-200 bg-green-100"></div>
              <span>Good (3-6)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="size-4 rounded border border-blue-200 bg-blue-100"></div>
              <span>High (7+)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      {selectedConcept && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Coverage:{" "}
              {
                filteredData.find((c) => c.conceptId === selectedConcept)
                  ?.conceptName
              }
            </CardTitle>
            <CardDescription>
              Question breakdown by type for this concept
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {questionTypes.map((type) => {
                const concept = filteredData.find(
                  (c) => c.conceptId === selectedConcept
                );
                const count = concept?.coverage[type] || 0;
                return (
                  <div key={type} className="text-center">
                    <div
                      className={`rounded-lg border p-4 ${getCoverageColor(count)}`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="mt-1 text-xs">
                        {type.replace(/_/g, " ")}
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {getCoverageLabel(count)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedConcept(null)}
              >
                Close Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {stats && stats.needsAttention > 0 && (
        <Alert>
          <AlertDescription>
            💡 <strong>Recommendation:</strong> {stats.needsAttention} concepts
            need more questions. Consider using the Generation Planner to create
            questions for under-covered concepts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
