// components/Features/practiceNew/PracticeSelector.tsx - ENHANCED VERSION
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PracticeMode } from "@/lib/enum";
import {
  Brain,
  Target,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface PracticeSelectorProps {
  onModeSelect: (mode: PracticeMode, options?: { drillType?: "weakness" | "course"; courseIds?: number[]; conceptIds?: string[] }) => void;
  isLoading: boolean;
}

interface ModeAvailability {
  available: boolean;
  reason?: string;
  fallbackAvailable: boolean;
}

interface SystemStats {
  totalConcepts: number;
  questionBankSize: number;
  dueConcepts: number;
  previouslyUsedQuestions: number;
  totalCourses: number;
}

export function PracticeSelector({
  onModeSelect,
  isLoading,
}: PracticeSelectorProps) {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [modeAvailability, setModeAvailability] = useState<
    Record<PracticeMode, ModeAvailability>
  >({
    [PracticeMode.NORMAL]: { available: true, fallbackAvailable: true },
    [PracticeMode.DRILL]: { available: true, fallbackAvailable: true },
  });

  useEffect(() => {
    checkSystemAvailability();
  }, []);

  const checkSystemAvailability = async () => {
    try {
      // Get basic stats
      const statsResponse = await fetch(
        "/api/practice-new/session?userId=default"
      );
      const statsResult = await statsResponse.json();

      // Get question bank info
      const questionsResponse = await fetch("/api/questions?stats=true");
      const questionsResult = await questionsResponse.json();

      // Get course info
      const coursesResponse = await fetch("/api/courses");
      const coursesResult = await coursesResponse.json();

      if (statsResult.success && questionsResult.success) {
        const stats: SystemStats = {
          totalConcepts: statsResult.data.totalConcepts || 0,
          questionBankSize: questionsResult.data.totalQuestions || 0,
          dueConcepts:
            (statsResult.data.dueConcepts || 0) +
            (statsResult.data.overdueConcepts || 0),
          previouslyUsedQuestions: questionsResult.data.questionsUsed || 0,
          totalCourses: (coursesResult.success && coursesResult.data) ? coursesResult.data.length : 0,
        };

        setSystemStats(stats);

        // Determine mode availability
        setModeAvailability({
          [PracticeMode.NORMAL]: {
            available: stats.totalConcepts > 0,
            reason:
              stats.totalConcepts === 0
                ? "No concepts available. Add courses first."
                : undefined,
            fallbackAvailable: stats.questionBankSize > 0,
          },
          [PracticeMode.DRILL]: {
            available: stats.previouslyUsedQuestions > 2 || stats.totalCourses > 0,
            reason:
              stats.previouslyUsedQuestions <= 2 && stats.totalCourses === 0
                ? "Need more practice history or courses for drilling."
                : undefined,
            fallbackAvailable: stats.questionBankSize > 0,
          },
        });
      }
    } catch (error) {
      console.error("Error checking system availability:", error);
    }
  };

  const practiceOptions = [
    {
      mode: PracticeMode.NORMAL,
      title: "Normal Practice",
      description:
        "AI selects concepts you need to review based on spaced repetition",
      icon: <Brain className="size-8 text-blue-600" />,
      color: "border-blue-200 hover:border-blue-300 bg-blue-50",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      features: [
        "Automatic concept selection",
        "Spaced repetition algorithm",
        "Mixed difficulty levels",
        "Generates questions as needed",
      ],
      fallbackInfo: "Will generate new questions if needed",
    },
    {
      mode: PracticeMode.DRILL,
      title: "Drill Mode",
      description: "Focus on weak concepts or specific courses",
      icon: <Target className="size-8 text-red-600" />,
      color: "border-red-200 hover:border-red-300 bg-red-50",
      buttonColor: "bg-red-600 hover:bg-red-700",
      features: [
        "Target weak concepts",
        "Course-specific drilling",
        "User-controlled selection",
        "Intensive practice",
      ],
      fallbackInfo:
        "Falls back to all questions if insufficient performance data",
    },
  ];

  const getStatusIcon = (mode: PracticeMode) => {
    const availability = modeAvailability[mode];
    if (availability.available) {
      return <CheckCircle className="size-4 text-green-500" />;
    } else if (availability.fallbackAvailable) {
      return <Info className="size-4 text-blue-500" />;
    } else {
      return <AlertTriangle className="size-4 text-red-500" />;
    }
  };

  const getStatusText = (mode: PracticeMode) => {
    const availability = modeAvailability[mode];
    if (availability.available) {
      return "Ready";
    } else if (availability.fallbackAvailable) {
      return "Fallback available";
    } else {
      return "Limited";
    }
  };

  const getModeButtonText = (mode: PracticeMode) => {
    const availability = modeAvailability[mode];
    if (availability.available) {
      return "Start Practice";
    } else if (availability.fallbackAvailable) {
      return "Start with Fallback";
    } else {
      return "Limited Start";
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      {systemStats && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {systemStats.totalConcepts}
                </div>
                <div className="text-sm text-gray-600">Concepts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {systemStats.questionBankSize}
                </div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {systemStats.dueConcepts}
                </div>
                <div className="text-sm text-gray-600">Due</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {systemStats.previouslyUsedQuestions}
                </div>
                <div className="text-sm text-gray-600">Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {systemStats.totalCourses}
                </div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Mode Grid */}
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {practiceOptions.map((option) => {
          const availability = modeAvailability[option.mode];
          const isDisabled =
            !availability.available && !availability.fallbackAvailable;

          return (
            <Card
              key={option.mode}
              className={`transition-all duration-200 ${option.color} ${isDisabled ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-4 text-center">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex flex-1 justify-center">
                    {option.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(option.mode)}
                    <span className="text-xs text-gray-600">
                      {getStatusText(option.mode)}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6 space-y-3">
                  {option.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <div className="mr-3 size-2 rounded-full bg-gray-400"></div>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Availability Info */}
                {!availability.available && (
                  <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-2 text-xs">
                    <div className="flex items-center gap-1 text-yellow-700">
                      <Info className="size-3" />
                      <span>{availability.reason}</span>
                    </div>
                    {availability.fallbackAvailable && (
                      <div className="mt-1 text-blue-600">
                        {option.fallbackInfo}
                      </div>
                    )}
                  </div>
                )}

                {/* Drill Mode Options */}
                {option.mode === PracticeMode.DRILL ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => onModeSelect(option.mode, { drillType: "weakness" })}
                      disabled={isLoading || isDisabled}
                      className={`w-full ${option.buttonColor} text-white disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                          Starting...
                        </div>
                      ) : (
                        "Drill Weak Concepts"
                      )}
                    </Button>
                    <Button
                      onClick={() => onModeSelect(option.mode, { drillType: "course" })}
                      disabled={isLoading || isDisabled}
                      variant="outline"
                      className="w-full"
                    >
                      Drill by Course
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onModeSelect(option.mode)}
                    disabled={isLoading || isDisabled}
                    className={`w-full ${option.buttonColor} text-white disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Starting...
                      </div>
                    ) : (
                      getModeButtonText(option.mode)
                    )}
                  </Button>
                )}

                {/* Fallback explanation */}
                {!availability.available && availability.fallbackAvailable && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    Uses smart fallback to find suitable questions
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <Info className="mx-auto mb-2 size-6 text-blue-600" />
            <h3 className="mb-2 font-medium text-blue-900">
              Smart Fallback System
            </h3>
            <p className="text-sm text-blue-700">
              Our practice system uses intelligent fallback strategies to ensure
              you always have questions to practice with, even when your
              preferred mode doesn&apos;t have enough content yet.
            </p>
            <div className="mt-3 text-xs text-blue-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
