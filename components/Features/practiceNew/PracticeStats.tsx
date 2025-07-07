// components/Features/practiceNew/PracticeStats.tsx - ENHANCED VERSION
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Info,
} from "lucide-react";

interface PracticeStatsData {
  totalConcepts: number;
  dueConcepts: number;
  overdueConcepts: number;
  averageMastery: number;
  questionBankSize: number;
}

export function PracticeStats() {
  const [stats, setStats] = useState<PracticeStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("📊 Fetching practice stats...");
      const response = await fetch("/api/practice-new/session?userId=default");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Stats response:", result);

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || "Failed to load statistics");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to server"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Loading statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-center text-yellow-800">
            <AlertTriangle className="mx-auto mb-2 size-8" />
            <p className="font-medium">Statistics unavailable</p>
            <p className="text-sm">{error}</p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={fetchStats}
                className="text-sm underline hover:no-underline"
              >
                Try again
              </button>
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-sm underline hover:no-underline"
              >
                {showDebugInfo ? "Hide" : "Show"} debug info
              </button>
            </div>
            {showDebugInfo && (
              <div className="mt-3 rounded bg-yellow-100 p-2 text-left text-xs">
                <p>
                  <strong>This usually means:</strong>
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>No courses have been added yet</li>
                  <li>No concepts have been extracted from courses</li>
                  <li>Database connection issues</li>
                </ul>
                <p className="mt-2">
                  <strong>To fix:</strong> Add courses via &quot;Add
                  Course&quot; and extract concepts
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="mb-8 border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">
            <BookOpen className="mx-auto mb-2 size-8" />
            <p className="font-medium">No practice data available</p>
            <p className="text-sm">Add some courses to get started!</p>
            <div className="mt-3">
              <a
                href="/course"
                className="text-sm text-blue-600 underline hover:no-underline"
              >
                Go to Add Course →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Due Today",
      value: stats.dueConcepts,
      icon: <Clock className="size-5 text-blue-600" />,
      color: "text-blue-600",
      urgent: stats.dueConcepts > 0,
    },
    {
      label: "Overdue",
      value: stats.overdueConcepts,
      icon: <Target className="size-5 text-red-600" />,
      color: "text-red-600",
      urgent: stats.overdueConcepts > 0,
    },
    {
      label: "Mastery Level",
      value: `${Math.round(stats.averageMastery * 100)}%`,
      icon: <TrendingUp className="size-5 text-green-600" />,
      color: "text-green-600",
      urgent: false,
    },
    {
      label: "Total Concepts",
      value: stats.totalConcepts,
      icon: <BookOpen className="size-5 text-purple-600" />,
      color: "text-purple-600",
      urgent: false,
    },
  ];

  const totalDue = stats.dueConcepts + stats.overdueConcepts;

  // Determine system readiness
  const systemReady = stats.totalConcepts > 0 && stats.questionBankSize > 0;
  const hasMinimumData =
    stats.totalConcepts >= 3 && stats.questionBankSize >= 1;

  return (
    <div className="mb-8">
      {/* System Status Alert */}
      {!systemReady && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Info className="mx-auto mb-2 size-6 text-orange-600" />
              <div className="text-orange-800">
                <p className="font-medium">System Setup Required</p>
                <p className="mt-1 text-sm">
                  {stats.totalConcepts === 0
                    ? "No concepts found. Add courses and extract concepts to enable practice."
                    : "Limited question bank. The system will generate questions as you practice."}
                </p>
                <div className="mt-2 text-xs">
                  <a href="/course" className="underline hover:no-underline">
                    Add Course
                  </a>
                  {" • "}
                  <a
                    href="/concept-review"
                    className="underline hover:no-underline"
                  >
                    Review Concepts
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Ready Alert */}
      {systemReady && totalDue > 0 && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-1 text-2xl font-bold text-blue-800">
                {totalDue} concept{totalDue !== 1 ? "s" : ""} ready for practice
              </div>
              <p className="text-blue-600">
                {stats.overdueConcepts > 0 &&
                  `${stats.overdueConcepts} overdue${stats.dueConcepts > 0 ? ", " : ""}`}
                {stats.dueConcepts > 0 && `${stats.dueConcepts} due today`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statItems.map((item, index) => (
          <Card
            key={index}
            className={`${item.urgent ? "border-orange-200 bg-orange-50" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {item.label}
                  </p>
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
                <div className="shrink-0">{item.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                <BookOpen className="size-4" />
                <span>{stats.questionBankSize} questions in bank</span>
              </div>
              {hasMinimumData && (
                <span className="text-green-600">
                  • System ready for practice
                </span>
              )}
              {!hasMinimumData && stats.totalConcepts > 0 && (
                <span className="text-orange-600">
                  • Limited content - fallback strategies enabled
                </span>
              )}
            </div>
            {stats.questionBankSize > 0 && (
              <p className="mt-1 text-xs">
                Smart fallback system ensures questions are always available for
                practice
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
