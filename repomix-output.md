This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.github/instruction/instruction.md
.gitignore
.npmrc
app/api/addDateQuestion/route.ts
app/api/addTimeQuestion/route.ts
app/api/concepts/[id]/route.ts
app/api/concepts/extract/route.ts
app/api/concepts/review/route.ts
app/api/concepts/route.ts
app/api/courses/route.ts
app/api/debug/concepts/route.ts
app/api/practice-new/concept-due/route.ts
app/api/practice-new/progress/route.ts
app/api/practice-new/session/route.ts
app/api/practice-new/start/route.ts
app/api/practice-sessions/route.ts
app/api/questions/route.ts
app/concept-review/page.tsx
app/course/page.tsx
app/globals.css
app/layout.tsx
app/page.tsx
app/practice-new/page.tsx
app/practice/page.tsx
components.json
components/Features/addCourse/AddCourse.tsx
components/Features/conceptReview/ConceptReview.tsx
components/Features/datecheck/PolishDateQuiz.tsx
components/Features/practice/Practice.tsx
components/Features/practiceNew/PracticeSelector.tsx
components/Features/practiceNew/PracticeSession.tsx
components/Features/practiceNew/PracticeStats.tsx
components/Features/practiceSummary/PracticeSummary.tsx
components/Features/timecheck/PolishTimeQuiz.tsx
components/ui/badge.tsx
components/ui/button.tsx
components/ui/card.tsx
components/ui/form.tsx
components/ui/input.tsx
components/ui/label.tsx
components/ui/progress.tsx
components/ui/scroll-area.tsx
components/ui/select.tsx
components/ui/textarea.tsx
data/importantDates.json
data/polishDateQuizDB.json
data/polishDayMonth.ts
data/polishTimeQuizDB.json
datamodels/concept.model.ts
datamodels/conceptIndex.model.ts
datamodels/conceptPracticeSession.model.ts
datamodels/conceptProgress.model.ts
datamodels/course.model.ts
datamodels/courseConcept.model.ts
datamodels/practice.model.ts
datamodels/questionAnswer.model.ts
datamodels/questionBank.model.ts
eslint.config.mjs
hooks/useConceptExtraction.ts
jsconfig.json
lib/conceptExtraction/conceptExtractor.ts
lib/conceptExtraction/conceptLLM.ts
lib/conceptExtraction/conceptManager.ts
lib/conceptExtraction/conceptManagerExtensions.ts
lib/conceptExtraction/index.ts
lib/conceptExtraction/types.ts
lib/dbConnect.ts
lib/enum.ts
lib/LLMCheckDate/validateDate.ts
lib/LLMCheckDate/validateDatesOpenAI.ts
lib/LLMCheckTime/actions.ts
lib/LLMCheckTime/actionsOpenAI-JSON.ts
lib/LLMCheckTime/actionsOpenAI.ts
lib/LLMCourseValidation/courseValidation.ts
lib/LLMPracticeValidation/generateQuestion.ts
lib/LLMPracticeValidation/practiceValidation.ts
lib/LLMPracticeValidation/validateAnswer.ts
lib/practiceEngine/conceptPracticeEngine.ts
lib/practiceEngine/contextBuilder.ts
lib/practiceEngine/srsCalculator.ts
lib/practiceEngine/types.ts
lib/services/questionBankService.ts
lib/utils.ts
next.config.ts
package.json
postcss.config.mjs
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
README.md
tailwind.config.ts
tsconfig.json
```

# Files

## File: .github/instruction/instruction.md
````markdown
SOFTWARE ENGINEERING PRINCIPLES:
- Extensibility: Design enums for future growth without breaking changes
- Type Safety: Comprehensive TypeScript usage with strict validation
- Maintainability: Clear, descriptive naming conventions
- Documentation: JSDoc comments for all public enums
- Consistency: Follow existing codebase patterns and naming

ARCHITECTURE GUIDELINES:
- Single Responsibility: Each enum serves one specific domain purpose
- Open/Closed Principle: Enums should be closed for modification, open for extension
- Interface Segregation: Separate concerns into focused enum groups
- Dependency Management: Minimal coupling between enum definitions

REQUIREMENTS:
Add ConceptCategory enum (GRAMMAR, VOCABULARY only - extensible design)
Add PracticeMode enum (NORMAL, PREVIOUS, DRILL)
Maintain backward compatibility with all existing enums
Follow snake_case for enum values, PascalCase for enum names

QUALITY STANDARDS:
- Add comprehensive JSDoc documentation
- Include usage examples in comments
- Validate enum value consistency across the application
- Ensure TypeScript strict mode compliance
- Add runtime validation helpers if needed

PERFORMANCE CONSIDERATIONS:
- Use string enums for better debugging and serialization
- Avoid complex enum computations
- Consider tree-shaking implications

Follow existing enum patterns in the codebase, maintain consistency with current naming conventions, and ensure all new enums integrate seamlessly with existing type system.
````

## File: .npmrc
````
legacy-peer-deps=true
````

## File: app/api/addDateQuestion/route.ts
````typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const newEntry = await request.json();

  const filePath = path.resolve(process.cwd(), 'data/polishDateQuizDB.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(fileData);

  jsonData.push(newEntry);

  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

  return NextResponse.json({ message: 'Question added successfully' }, { status: 200 });
}
````

## File: app/api/addTimeQuestion/route.ts
````typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const newEntry = await request.json();

  const filePath = path.resolve(process.cwd(), 'data/polishTimeQuizDB.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(fileData);

  jsonData.push(newEntry);

  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

  return NextResponse.json({ message: 'Question added successfully' }, { status: 200 });
}
````

## File: app/api/concepts/route.ts
````typescript
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Request validation schemas
const createConceptSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
  description: z.string().min(1).max(500),
  examples: z.array(z.string()).max(10),
  prerequisites: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
  difficulty: z.enum([
    QuestionLevel.A1,
    QuestionLevel.A2,
    QuestionLevel.B1,
    QuestionLevel.B2,
    QuestionLevel.C1,
    QuestionLevel.C2,
  ]),
});

// GET /api/concepts - Fetch all active concepts with pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // Extract query parameters with validation
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const category = searchParams.get("category") as ConceptCategory | null;
    const isActive = searchParams.get("isActive") !== "false"; // Default to true

    const conceptManager = new ConceptManager();

    // Use the new pagination method
    const concepts = await conceptManager.getConceptsPaginated({
      page,
      limit,
      category,
      isActive,
    });

    if (!concepts.success) {
      return NextResponse.json(
        {
          success: false,
          error: concepts.error || "Failed to fetch concepts",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: concepts.data,
        pagination: {
          page,
          limit,
          total: concepts.total,
          pages: Math.ceil(concepts.total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concepts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/concepts - Create new concept
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const validatedData = createConceptSchema.parse(body);

    const conceptManager = new ConceptManager();

    // Check for duplicates
    const isUnique = await conceptManager.validateConceptUniqueness(
      validatedData.name,
      validatedData.category
    );

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept with this name already exists in the category",
        },
        { status: 409 }
      );
    }

    const concept = await conceptManager.createConcept(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: concept,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error creating concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/courses/route.ts
````typescript
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import Course from "@/datamodels/course.model";

export async function GET() {
  try {
    await connectToDatabase();
    const courses = await Course.find({}).sort({ date: 1 });
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
````

## File: app/api/practice-new/concept-due/route.ts
````typescript
// app/api/practice-new/concepts-due/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import Concept from "@/datamodels/concept.model";

// GET /api/practice-new/concepts-due - Get concepts due for practice
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const includeDetails = searchParams.get("includeDetails") === "true";

    // Get concepts due for review
    const [dueProgress, overdueProgress] = await Promise.all([
      SRSCalculator.getConceptsDueForReview(userId),
      SRSCalculator.getOverdueConcepts(userId)
    ]);

    const allDueProgress = [...overdueProgress, ...dueProgress];

    if (!includeDetails) {
      // Return just concept IDs for lightweight requests
      return NextResponse.json({
        success: true,
        data: {
          conceptIds: allDueProgress.map(p => p.conceptId),
          dueConcepts: dueProgress.length,
          overdueConcepts: overdueProgress.length,
          totalDue: allDueProgress.length
        }
      }, { status: 200 });
    }

    // Get full concept details
    const conceptIds = allDueProgress.map(p => p.conceptId);
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true
    });

    // Combine progress data with concept details
    const conceptsWithProgress = concepts.map(concept => {
      const progress = allDueProgress.find(p => p.conceptId === concept.id);
      const priority = progress ? SRSCalculator.calculatePriority(progress) : 0;
      const isOverdue = overdueProgress.some(p => p.conceptId === concept.id);

      return {
        concept: {
          id: concept.id,
          name: concept.name,
          category: concept.category,
          description: concept.description,
          difficulty: concept.difficulty
        },
        progress: progress ? {
          masteryLevel: progress.masteryLevel,
          successRate: progress.successRate,
          consecutiveCorrect: progress.consecutiveCorrect,
          lastPracticed: progress.lastPracticed,
          nextReview: progress.nextReview,
          intervalDays: progress.intervalDays
        } : null,
        priority,
        isOverdue,
        daysSinceReview: progress ? Math.floor(
          (new Date().getTime() - progress.nextReview.getTime()) / (1000 * 60 * 60 * 24)
        ) : 0
      };
    });

    // Sort by priority (highest first)
    conceptsWithProgress.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      success: true,
      data: {
        concepts: conceptsWithProgress,
        summary: {
          totalDue: allDueProgress.length,
          dueConcepts: dueProgress.length,
          overdueConcepts: overdueProgress.length,
          averagePriority: conceptsWithProgress.length > 0 
            ? conceptsWithProgress.reduce((sum, c) => sum + c.priority, 0) / conceptsWithProgress.length 
            : 0
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching due concepts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch due concepts",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
````

## File: app/api/practice-new/session/route.ts
````typescript
// app/api/practice-new/session/route.ts - UPDATED with enhanced error handling and fallback messaging
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { PracticeMode } from "@/lib/enum";
import { z } from "zod";

const sessionRequestSchema = z.object({
  mode: z.enum([
    PracticeMode.NORMAL,
    PracticeMode.PREVIOUS,
    PracticeMode.DRILL,
  ]),
  userId: z.string().optional().default("default"),
  maxQuestions: z.number().optional().default(10),
  maxConcepts: z.number().optional().default(5),
  targetConceptIds: z.array(z.string()).optional(),
});

// POST /api/practice-new/session - Start new practice session
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { mode, userId, maxQuestions, maxConcepts, targetConceptIds } =
      sessionRequestSchema.parse(body);

    console.log(
      `🎯 Starting practice session: mode=${mode}, userId=${userId}, maxQuestions=${maxQuestions}, maxConcepts=${maxConcepts}`
    );

    const practiceEngine = new ConceptPracticeEngine();

    // Select concepts for practice
    let conceptIds: string[];
    let rationale: string;
    let fallbackUsed = false;

    if (targetConceptIds && targetConceptIds.length > 0) {
      // Manual concept selection
      conceptIds = targetConceptIds.slice(0, maxConcepts);
      rationale = "Manually selected concepts";
      console.log(`Using manually selected concepts: ${conceptIds.join(", ")}`);
    } else {
      // Smart concept selection
      const selection = await practiceEngine.selectPracticeConceptsForUser(
        userId,
        maxConcepts
      );
      conceptIds = selection.concepts.map((c) => c.id);
      rationale = selection.rationale;
      console.log(
        `Smart selection result: ${conceptIds.length} concepts selected`
      );
    }

    // Get questions for selected concepts with enhanced fallback
    console.log(`🔍 Attempting to get questions for ${conceptIds.length} concepts`);
    const questions = await practiceEngine.getQuestionsForConcepts(
      conceptIds,
      mode,
      maxQuestions
    );

    // Enhanced error handling with specific messages
    if (questions.length === 0) {
      console.log(`❌ No questions found even after fallback strategies`);
      
      // Different error messages based on mode
      let errorMessage = "No questions are currently available for practice.";
      let suggestions: string[] = [];

      switch (mode) {
        case PracticeMode.PREVIOUS:
          errorMessage = "No previously practiced questions found.";
          suggestions = [
            "Try practicing in 'Smart Practice' mode first to build up a question history",
            "Add some courses and extract concepts to expand your question bank",
            "Switch to 'Smart Practice' mode to generate new questions"
          ];
          break;
        case PracticeMode.DRILL:
          errorMessage = "No questions with performance data found for drilling.";
          suggestions = [
            "Practice some questions first to build performance history",
            "Try 'Smart Practice' mode to answer questions and create drill material",
            "Add more courses with concept extraction to expand available content"
          ];
          break;
        case PracticeMode.NORMAL:
          errorMessage = "No concepts or questions available for practice.";
          suggestions = [
            "Add some Polish language courses through the 'Add Course' feature",
            "Extract concepts from your courses using the concept extraction system",
            "Ensure your courses have sufficient content (notes, practice text, keywords)"
          ];
          break;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          suggestions,
          debug: {
            mode,
            conceptsFound: conceptIds.length,
            questionsAttempted: true,
            fallbacksUsed: true
          }
        },
        { status: 400 }
      );
    }

    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log successful session creation with details
    console.log(
      `✅ Session created successfully: ${sessionId} with ${questions.length} questions`
    );

    // Check if we're using fallback questions (questions without matching target concepts)
    const conceptSet = new Set(conceptIds);
    const questionsWithMatchingConcepts = questions.filter(q => 
      q.targetConcepts.some(tc => conceptSet.has(tc))
    );
    
    if (questionsWithMatchingConcepts.length < questions.length) {
      fallbackUsed = true;
      console.log(`⚠️ Using ${questions.length - questionsWithMatchingConcepts.length} fallback questions`);
    }

    // Enhanced rationale with fallback information
    let enhancedRationale = rationale;
    if (fallbackUsed) {
      enhancedRationale += ` (Used fallback strategy to ensure questions are available)`;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          conceptIds,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            questionType: q.questionType,
            difficulty: q.difficulty,
            targetConcepts: q.targetConcepts,
          })),
          metadata: {
            mode,
            totalQuestions: questions.length,
            conceptCount: conceptIds.length,
            rationale: enhancedRationale,
            fallbackUsed,
            questionsWithMatchingConcepts: questionsWithMatchingConcepts.length,
            fallbackQuestions: questions.length - questionsWithMatchingConcepts.length
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating practice session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create practice session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/practice-new/session - Get practice statistics
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";

    console.log(`📊 Getting practice stats for user: ${userId}`);

    const practiceEngine = new ConceptPracticeEngine();
    const stats = await practiceEngine.getPracticeStats(userId);

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching practice stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch practice statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/practice-new/start/route.ts
````typescript
// app/api/practice-new/session/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";

// GET /api/practice-new/session/stats - Get practice statistics  
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";

    const practiceEngine = new ConceptPracticeEngine();
    
    // Get practice statistics
    const stats = await practiceEngine.getPracticeStats(userId);

    return NextResponse.json({
      success: true,
      data: stats
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching practice stats:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch practice statistics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
````

## File: app/practice/page.tsx
````typescript
import { Practice } from "@/components/Features/practice/Practice"

const PracticeCourses = () => {
  return (
    <div>
        <h1>Practice</h1>
        <Practice/>
    </div>
  )
}

export default PracticeCourses
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
````

## File: components/Features/conceptReview/ConceptReview.tsx
````typescript
// components/Features/conceptReview/ConceptReview.tsx
"use client"

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConceptExtraction } from "@/hooks/useConceptExtraction";
import {
  ReviewDecision,
  ExtractedConcept,
} from "@/lib/conceptExtraction/types";

interface ConceptReviewProps {
  courseId: number;
  onReviewComplete?: () => void;
}

/**
 * Component for reviewing and approving extracted concepts
 * Provides human-in-the-loop concept validation workflow
 */
export function ConceptReview({
  courseId,
  onReviewComplete,
}: ConceptReviewProps) {
  const {
    isExtracting,
    isProcessingReview,
    extractionData,
    error,
    extractConcepts,
    processReviewDecisions,
    clearError,
    resetExtraction,
  } = useConceptExtraction();

  const [reviewDecisions, setReviewDecisions] = useState<ReviewDecision[]>([]);

  /**
   * Handle concept extraction trigger
   */
  const handleExtractConcepts = useCallback(async () => {
    const success = await extractConcepts(courseId);
    if (success) {
      // Reset review decisions when new extraction completes
      setReviewDecisions([]);
    }
  }, [courseId, extractConcepts]);

  /**
   * Handle individual concept decision
   */
  const handleConceptDecision = useCallback(
    (concept: ExtractedConcept, action: "approve" | "reject") => {
      const decision: ReviewDecision = {
        action,
        extractedConcept: concept,
        courseId,
      };

      setReviewDecisions((prev) => {
        // Remove any existing decision for this concept
        const filtered = prev.filter(
          (d) => d.extractedConcept.name !== concept.name
        );
        // Add new decision if not rejecting
        if (action === "approve") {
          return [...filtered, decision];
        }
        return filtered;
      });
    },
    [courseId]
  );

  /**
   * Handle review submission - FIXED
   */
  const handleSubmitReview = useCallback(async () => {
    if (reviewDecisions.length === 0) {
      return;
    }

    const success = await processReviewDecisions(reviewDecisions);
    if (success) {
      setReviewDecisions([]);
      // Force reset extraction data to clear the UI
      resetExtraction();
      onReviewComplete?.();
    }
  }, [reviewDecisions, processReviewDecisions, onReviewComplete, resetExtraction]);

  /**
   * Check if concept has a decision
   */
  const getConceptDecision = useCallback(
    (conceptName: string) => {
      return reviewDecisions.find(
        (d) => d.extractedConcept.name === conceptName
      );
    },
    [reviewDecisions]
  );

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-red-600">{error}</p>
          <div className="flex gap-2">
            <Button onClick={clearError} variant="outline">
              Clear Error
            </Button>
            <Button onClick={resetExtraction}>Reset</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Concept Review - Course {courseId}</CardTitle>
      </CardHeader>
      <CardContent>
        {!extractionData ? (
          <div className="py-8 text-center">
            <p className="mb-4">
              Extract concepts from this course to begin review process.
            </p>
            <Button
              onClick={handleExtractConcepts}
              disabled={isExtracting}
              className="w-48"
            >
              {isExtracting ? "Extracting..." : "Extract Concepts"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Extraction Summary */}
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold">Extraction Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Concepts: {extractionData.totalExtracted}</div>
                <div>High Confidence: {extractionData.highConfidenceCount}</div>
              </div>
            </div>

            {/* Concept Review List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {extractionData.extractedConcepts.map((concept, index) => {
                  const decision = getConceptDecision(concept.name);
                  const isApproved = decision?.action === "approve";

                  return (
                    <Card
                      key={index}
                      className={`p-4 ${isApproved ? "border-green-500 bg-green-50" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              {concept.name}
                            </h4>
                            <p className="text-sm capitalize text-gray-600">
                              {concept.category} • Confidence:{" "}
                              {(concept.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isApproved ? "default" : "outline"}
                              onClick={() =>
                                handleConceptDecision(concept, "approve")
                              }
                            >
                              {isApproved ? "✓ Approved" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleConceptDecision(concept, "reject")
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-700">{concept.description}</p>

                        {concept.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Examples:
                            </p>
                            <ul className="list-inside list-disc text-sm text-gray-600">
                              {concept.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Source: {concept.sourceContent}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Review Actions */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                {reviewDecisions.length} concept(s) approved for creation
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetExtraction}
                  variant="outline"
                  disabled={isProcessingReview}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewDecisions.length === 0 || isProcessingReview}
                >
                  {isProcessingReview ? "Processing..." : "Create Concepts"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
````

## File: components/Features/practiceNew/PracticeSelector.tsx
````typescript
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
  RotateCcw,
  Target,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface PracticeSelectorProps {
  onModeSelect: (mode: PracticeMode) => void;
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
    [PracticeMode.PREVIOUS]: { available: true, fallbackAvailable: true },
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

      if (statsResult.success && questionsResult.success) {
        const stats: SystemStats = {
          totalConcepts: statsResult.data.totalConcepts || 0,
          questionBankSize: questionsResult.data.totalQuestions || 0,
          dueConcepts:
            (statsResult.data.dueConcepts || 0) +
            (statsResult.data.overdueConcepts || 0),
          previouslyUsedQuestions: questionsResult.data.questionsUsed || 0,
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
          [PracticeMode.PREVIOUS]: {
            available: stats.previouslyUsedQuestions > 0,
            reason:
              stats.previouslyUsedQuestions === 0
                ? "No previously answered questions found."
                : undefined,
            fallbackAvailable: stats.questionBankSize > 0,
          },
          [PracticeMode.DRILL]: {
            available: stats.previouslyUsedQuestions > 2,
            reason:
              stats.previouslyUsedQuestions <= 2
                ? "Need more practice history for drilling."
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
      title: "Smart Practice",
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
      mode: PracticeMode.PREVIOUS,
      title: "Review Previous",
      description:
        "Practice with questions you've seen before to reinforce learning",
      icon: <RotateCcw className="size-8 text-green-600" />,
      color: "border-green-200 hover:border-green-300 bg-green-50",
      buttonColor: "bg-green-600 hover:bg-green-700",
      features: [
        "Familiar questions only",
        "Build confidence",
        "No new question generation",
        "Quick review sessions",
      ],
      fallbackInfo:
        "Falls back to any available questions if no previous questions found",
    },
    {
      mode: PracticeMode.DRILL,
      title: "Drill Weak Areas",
      description: "Focus on concepts and questions where you struggled before",
      icon: <Target className="size-8 text-red-600" />,
      color: "border-red-200 hover:border-red-300 bg-red-50",
      buttonColor: "bg-red-600 hover:bg-red-700",
      features: [
        "Target weak concepts",
        "Failed questions focus",
        "Difficulty adjustment",
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
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Mode Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
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
              {" • "}
              <a href="/practice" className="underline hover:no-underline">
                Legacy Practice
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
````

## File: components/Features/practiceNew/PracticeStats.tsx
````typescript
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
````

## File: components/Features/practiceSummary/PracticeSummary.tsx
````typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IPracticeSession } from "@/datamodels/practice.model";

interface PracticeSummaryProps {
  session: IPracticeSession;
}

export function PracticeSummary({ session }: PracticeSummaryProps) {
  const totalQuestions = session.questionAnswers.length;
  const correctAnswers = session.questionAnswers.filter(
    (qa) => qa.userAnswers[qa.userAnswers.length - 1] === qa.correctAnswer
  ).length;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const averageResponseTime =
    session.questionAnswers.reduce(
      (sum, qa) => sum + qa.analysisDetails.responseTime,
      0
    ) / totalQuestions;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Practice Session Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Overall Metrics</h3>
            <p>Total Questions: {totalQuestions}</p>
            <p>Correct Answers: {correctAnswers}</p>
            <p>Accuracy: {accuracy.toFixed(2)}%</p>
            <p>Average Response Time: {averageResponseTime.toFixed(2)}ms</p>
          </div>
          <ScrollArea className="h-[400px]">
            <h3 className="mb-2 text-lg font-semibold">Question Details</h3>
            {session.questionAnswers.map((qa, index) => (
              <div key={index} className="mb-4 rounded border p-4">
                <p>
                  <strong>Question {index + 1}:</strong> {qa.question}
                </p>
                <p>
                  <strong>Correct Answer:</strong> {qa.correctAnswer}
                </p>
                <p>
                  <strong>User Answers:</strong> {qa.userAnswers.join(", ")}
                </p>
                <p>
                  <strong>Category:</strong> {qa.category}
                </p>
                <p>
                  <strong>Question Type:</strong> {qa.questionType}
                </p>
                <p>
                  <strong>Mistake Type:</strong>{" "}
                  {qa.analysisDetails.mistakeType || "None"}
                </p>
                <p>
                  <strong>Confidence:</strong> {qa.analysisDetails.confidence}
                </p>
                <p>
                  <strong>Question Level:</strong>{" "}
                  {qa.analysisDetails.questionLevel}
                </p>
                <p>
                  <strong>Response Time:</strong>{" "}
                  {qa.analysisDetails.responseTime}ms
                </p>
              </div>
            ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
````

## File: components/Features/timecheck/PolishTimeQuiz.tsx
````typescript
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { validateAnswer } from "../actions";
// import { validateAnswer } from "@/lib/LLMCheckTime/actionsOpenAI";
import { validateAnswer } from "@/lib/LLMCheckTime/actionsOpenAI-JSON";

import { FaPlusCircle } from "react-icons/fa";

export default function PolishTimeQuiz() {
  const [time, setTime] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<{
    correct: boolean;
    correctForm: { formal: string; informal: string };
    comment: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the current time in "HH:mm" format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Generate a random time in "HH:mm" format
  const generateRandomTime = () => {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Generate a new time and reset the quiz
  const handleNewQuestion = () => {
    setTime(generateRandomTime());
    setUserAnswer("");
    setResult(null);
  };

  // Add question and answer to the JSON file
  const handleAddToDB = async () => {
    const newEntry = {
      question: `Write this time in Polish:`,
      time,
      answer: {
        formal: result?.correctForm.formal || "",
        informal: result?.correctForm.informal || "",
        comment: result?.comment || "",
      },
    };

    try {
      const response = await fetch("/api/addTimeQuestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
  
      if (!response.ok) {
        const message = `Error: ${response.status}`;
        throw new Error(message);
      }
  
      const data = await response.json();
      console.log("Success:", data);
      // Further actions after successful DB addition
    } catch (error) {
      console.error("Error adding to DB:", error);
      // Handle errors appropriately, e.g., display an error message to the user.
    }
  }

  useEffect(() => {
    setTime(getCurrentTime());
  }, []);

  // Submit user's answer for validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;

    setIsLoading(true);
    try {
      const validationResult = await validateAnswer(time, userAnswer);
      setResult(validationResult);
    } catch (error) {
      console.error("Error validating answer:", error);
      setResult({
        correct: false,
        correctForm: { formal: "", informal: "" },
        comment:
          "An error occurred while validating the answer. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-20 mr-6 mt-10 max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h1 className="mb-4 text-center text-2xl font-bold">Polish Time Quiz</h1>
      <Button onClick={handleNewQuestion} className="mb-4 w-full">
        Generate New Time
      </Button>
      {time && (
        <div className="mb-4 text-center">
          <p className="text-lg font-semibold">Write this time in Polish:</p>
          <p className="text-3xl font-bold text-blue-600">{time}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer in Polish"
          className="w-full"
        />
        <Button type="submit" disabled={isLoading || !time} className="w-full">
          {isLoading ? "Checking..." : "Submit"}
        </Button>
      </form>
      {result && (
        <div className="mt-4 space-y-2">
          <p
            className={`text-lg font-semibold ${
              result.correct ? "text-green-600" : "text-red-600"
            }`}
          >
            {result.correct ? "Correct!" : "Incorrect. Try again."}
          </p>
          <div className="text-base">
            <p>
              <span className="font-semibold">Formal:</span>{" "}
              {result.correctForm.formal || "Not provided"}
            </p>
            <p>
              <span className="font-semibold">Informal:</span>{" "}
              {result.correctForm.informal || "Not provided"}
            </p>
          </div>
          <p className="text-base">
            <span className="font-semibold">Comment:</span> {result.comment}
          </p>
        </div>
      )}
      <FaPlusCircle
        className="mt-5 cursor-pointer text-blue-600"
        size={20}
        onClick={handleAddToDB}
      />
    </div>
  );
}
````

## File: components/ui/badge.tsx
````typescript
// components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
````

## File: components/ui/card.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
````

## File: components/ui/form.tsx
````typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
````

## File: components/ui/input.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
````

## File: components/ui/label.tsx
````typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
````

## File: components/ui/textarea.tsx
````typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
````

## File: data/importantDates.json
````json
[
  {
    "question": "Kiedy Polska dołączyła do Unii Europejskiej?",
    "date": "01/05/2004",
    "year": "dwa tysiące czwartego roku"
  },
  {
    "question": "Kiedy odbyły się pierwsze wolne wybory w Polsce?",
    "date": "04/06/1989",
    "year": "tysiąc dziewięćset osiemdziesiątego dziewiątego roku"
  },
  {
    "question": "Kiedy urodził się Mikołaj Kopernik?",
    "date": "19/02/1473",
    "year": "tysiąc czterysta siedemdziesiątego trzeciego roku"
  },
  {
    "question": "Kiedy Polska odzyskała niepodległość?",
    "date": "11/11/1918",
    "year": "tysiąc dziewięćset osiemnastego roku"
  },
  {
    "question": "Kiedy wybuchło Powstanie Warszawskie?",
    "date": "01/08/1944",
    "year": "tysiąc dziewięćset czterdziestego czwartego roku"
  },
  {
    "question": "Kiedy Jan Paweł II został papieżem?",
    "date": "16/10/1978",
    "year": "tysiąc dziewięćset siedemdziesiątego ósmego roku"
  },
  {
    "question": "Kiedy zakończyła się II wojna światowa?",
    "date": "08/05/1945",
    "year": "tysiąc dziewięćset czterdziestego piątego roku"
  },
  {
    "question": "Kiedy Polska przystąpiła do NATO?",
    "date": "12/03/1999",
    "year": "tysiąc dziewięćset dziewięćdziesiątego dziewiątego roku"
  },
  {
    "question": "Kiedy odbyły się pierwsze mistrzostwa świata w siatkówce w Polsce?",
    "date": "30/08/2014",
    "year": "dwa tysiące czternastego roku"
  },
  {
    "question": "Kiedy odbyły się mistrzostwa Europy w piłce nożnej w Polsce?",
    "date": "08/06/2012",
    "year": "dwa tysiące dwunastego roku"
  },
  {
    "question": "Kiedy odbyła się bitwa pod Grunwaldem?",
    "date": "15/07/1410",
    "year": "tysiąc czterysta dziesiątego roku"
  },
  {
    "question": "Kiedy uchwalono Konstytucję 3 maja?",
    "date": "03/05/1791",
    "year": "tysiąc siedemset dziewięćdziesiątego pierwszego roku"
  },
  {
    "question": "Kiedy odbyło się Powstanie Listopadowe?",
    "date": "29/11/1830",
    "year": "tysiąc osiemset trzydziestego roku"
  },
  {
    "question": "Kiedy odbyło się Powstanie Styczniowe?",
    "date": "22/01/1863",
    "year": "tysiąc osiemset sześćdziesiątego trzeciego roku"
  },
  {
    "question": "Kiedy Maria Skłodowska-Curie otrzymała pierwszą Nagrodę Nobla?",
    "date": "10/12/1903",
    "year": "tysiąc dziewięćset trzeciego roku"
  },
  {
    "question": "Kiedy Maria Skłodowska-Curie otrzymała drugą Nagrodę Nobla?",
    "date": "10/12/1911",
    "year": "tysiąc dziewięćset jedenastego roku"
  },
  {
    "question": "Kiedy odbył się chrzest Polski?",
    "date": "14/04/966",
    "year": "dziewięćset sześćdziesiątego szóstego roku"
  },
  {
    "question": "Kiedy rozpoczęła się II wojna światowa?",
    "date": "01/09/1939",
    "year": "tysiąc dziewięćset trzydziestego dziewiątego roku"
  },
  {
    "question": "Kiedy Polska wstąpiła do ONZ?",
    "date": "24/10/1945",
    "year": "tysiąc dziewięćset czterdziestego piątego roku"
  },
  {
    "question": "Kiedy odbyły się wybory do Sejmu Wielkiego?",
    "date": "06/10/1788",
    "year": "tysiąc siedemset osiemdziesiątego ósmego roku"
  },
  {
    "question": "Kiedy zmarł Fryderyk Chopin?",
    "date": "17/10/1849",
    "year": "tysiąc osiemset czterdziestego dziewiątego roku"
  },
  {
    "question": "Kiedy powstało Solidarność?",
    "date": "31/08/1980",
    "year": "tysiąc dziewięćset osiemdziesiątego roku"
  },
  {
    "question": "Kiedy Władysław Jagiełło został królem Polski?",
    "date": "02/02/1386",
    "year": "tysiąc trzysta osiemdziesiątego szóstego roku"
  },
  {
    "question": "Kiedy odbyła się pierwsza pielgrzymka Jana Pawła II do Polski?",
    "date": "02/06/1979",
    "year": "tysiąc dziewięćset siedemdziesiątego dziewiątego roku"
  },
  {
    "question": "Kiedy Polska zorganizowała Expo w Łodzi?",
    "date": "16/06/2022",
    "year": "dwa tysiące dwudziestego drugiego roku"
  },
  {
    "question": "Kiedy urodził się Adam Mickiewicz?",
    "date": "24/12/1798",
    "year": "tysiąc siedemset dziewięćdziesiątego ósmego roku"
  },
  {
    "question": "Kiedy Polska podpisała traktat lizboński?",
    "date": "13/12/2007",
    "year": "dwa tysiące siódmego roku"
  },
  {
    "question": "Kiedy odbyła się bitwa pod Wiedniem?",
    "date": "12/09/1683",
    "year": "tysiąc sześćset osiemdziesiątego trzeciego roku"
  },
  {
    "question": "Kiedy zmarła Maria Skłodowska-Curie?",
    "date": "04/07/1934",
    "year": "tysiąc dziewięćset trzydziestego czwartego roku"
  },
  {
    "question": "Kiedy Polska zorganizowała mistrzostwa świata w piłce ręcznej?",
    "date": "11/01/2023",
    "year": "dwa tysiące dwudziestego trzeciego roku"
  }
]
````

## File: data/polishDateQuizDB.json
````json
[
  {
    "question": "Który dzisiaj jest?",
    "date": "16/1/2025",
    "answer": {
      "day": "szesnasty",
      "month": "stycznia",
      "year": "dwa tysiące dwudziestego piątego roku",
      "comment": "All parts of the answer are correct. The day \"szesnasty,\" the month \"stycznia,\" and the year \"dwa tysiące dwudziestego piątego roku\" are all correctly written and grammatically accurate. Great job!"
    }
  },
  {
    "question": "Kiedy Polska zorganizowała mistrzostwa świata w piłce ręcznej?",
    "date": "11/01/2023",
    "answer": {
      "day": "jedenasty",
      "month": "stycznia",
      "year": "dwa tysiące dwudziestego trzeciego roku",
      "comment": "The user's response correctly represents the date 11/01/2023 in Polish. All parts—day, month, and year—are accurately written with no grammatical or spelling errors. Great job!"
    }
  }
]
````

## File: data/polishDayMonth.ts
````typescript
export const polishDay = [
  "pierwszy",
  "drugi",
  "trzeci",
  "czwarty",
  "piąty",
  "szósty",
  "siódmy",
  "ósmy",
  "dziewiąty",
  "dziesiąty",
  "jedenasty",
  "dwunasty",
  "trzynasty",
  "czternasty",
  "piętnasty",
  "szesnasty",
  "siedemnasty",
  "osiemnasty",
  "dziewiętnasty",
  "dwudziesty",
  "dwudziesty pierwszy",
  "dwudziesty drugi",
  "dwudziesty trzeci",
  "dwudziesty czwarty",
  "dwudziesty piąty",
  "dwudziesty szósty",
  "dwudziesty siódmy",
  "dwudziesty ósmy",
  "dwudziesty dziewiąty",
  "trzydziesty",
  "trzydziesty pierwszy",
];

export const polishMonth = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];
````

## File: datamodels/conceptPracticeSession.model.ts
````typescript
import { Schema, model, models } from "mongoose";
import { PracticeMode } from "@/lib/enum";

/**
 * Interface representing a concept-based practice session
 * @interface IConceptPracticeSession
 */
export interface IConceptPracticeSession {
  sessionId: string;
  userId: string; // for future multi-user support
  mode: PracticeMode;
  selectedConcepts: string[]; // concept IDs chosen for this session
  questionsUsed: string[]; // question bank IDs used in session
  startedAt: Date;
  completedAt: Date;
  sessionMetrics: {
    totalQuestions: number;
    correctAnswers: number;
    averageResponseTime: number;
    conceptsReviewed: number;
    newQuestionsGenerated: number;
    bankQuestionsUsed: number;
  };
  isActive: boolean;
}

const ConceptPracticeSessionSchema = new Schema<IConceptPracticeSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      default: "default", // single user for now
    },
    mode: {
      type: String,
      enum: Object.values(PracticeMode),
      required: true,
    },
    selectedConcepts: {
      type: [String],
      required: true,
      ref: "Concept",
    },
    questionsUsed: {
      type: [String],
      ref: "QuestionBank",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    sessionMetrics: {
      totalQuestions: {
        type: Number,
        default: 0,
      },
      correctAnswers: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      conceptsReviewed: {
        type: Number,
        default: 0,
      },
      newQuestionsGenerated: {
        type: Number,
        default: 0,
      },
      bankQuestionsUsed: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
ConceptPracticeSessionSchema.index({ userId: 1, startedAt: -1 });
ConceptPracticeSessionSchema.index({ mode: 1 });
ConceptPracticeSessionSchema.index({ selectedConcepts: 1 });
ConceptPracticeSessionSchema.index({ isActive: 1 });

const ConceptPracticeSession =
  models?.ConceptPracticeSession ||
  model<IConceptPracticeSession>(
    "ConceptPracticeSession",
    ConceptPracticeSessionSchema
  );

export default ConceptPracticeSession;
````

## File: hooks/useConceptExtraction.ts
````typescript
// hooks/useConceptExtraction.ts - FIXED VERSION
import { useState, useCallback } from "react";
import { ConceptReviewData, ReviewDecision } from "@/lib/conceptExtraction/types";

interface UseConceptExtractionReturn {
  isExtracting: boolean;
  isProcessingReview: boolean;
  extractionData: ConceptReviewData | null;
  error: string | null;
  extractConcepts: (courseId: number) => Promise<boolean>;
  processReviewDecisions: (decisions: ReviewDecision[]) => Promise<boolean>;
  clearError: () => void;
  resetExtraction: () => void;
}

/**
 * Custom hook for managing concept extraction workflow
 * Handles extraction, review data, and processing review decisions
 */
export function useConceptExtraction(): UseConceptExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [extractionData, setExtractionData] = useState<ConceptReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract concepts from a course
   * @param courseId ID of the course to extract concepts from
   * @returns Success status
   */
  const extractConcepts = useCallback(async (courseId: number): Promise<boolean> => {
    setIsExtracting(true);
    setError(null);

    try {
      console.log(`Starting concept extraction for course ${courseId}`);
      
      const response = await fetch("/api/concepts/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Concept extraction failed");
      }

      if (result.success) {
        console.log(`Successfully extracted ${result.data?.totalExtracted || 0} concepts`);
        setExtractionData(result.data);
        return true;
      } else {
        throw new Error(result.error || "Unknown extraction error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to extract concepts";
      console.error("Concept extraction error:", err);
      setError(errorMessage);
      return false;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Process human review decisions
   * @param decisions Array of review decisions
   * @returns Success status
   */
  const processReviewDecisions = useCallback(
    async (decisions: ReviewDecision[]): Promise<boolean> => {
      setIsProcessingReview(true);
      setError(null);

      try {
        console.log(`Processing ${decisions.length} review decisions`);
        
        const response = await fetch("/api/concepts/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decisions }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Review processing failed");
        }

        if (result.success) {
          console.log(`Successfully processed ${result.processedCount} decisions, created ${result.createdCount} concepts`);
          // IMPORTANT: Clear extraction data immediately after successful processing
          setExtractionData(null);
          return true;
        } else {
          throw new Error(result.error || "Unknown review processing error");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process review decisions";
        console.error("Review processing error:", err);
        setError(errorMessage);
        return false;
      } finally {
        setIsProcessingReview(false);
      }
    },
    []
  );

  /**
   * Clear current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset extraction state - ENHANCED
   */
  const resetExtraction = useCallback(() => {
    console.log("Resetting extraction state");
    setExtractionData(null);
    setError(null);
    setIsExtracting(false);
    setIsProcessingReview(false);
  }, []);

  return {
    isExtracting,
    isProcessingReview,
    extractionData,
    error,
    extractConcepts,
    processReviewDecisions,
    clearError,
    resetExtraction,
  };
}
````

## File: jsconfig.json
````json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
````

## File: lib/conceptExtraction/index.ts
````typescript
// Import the classes for the factory function
import { ConceptLLMService, safeConceptExtraction } from "./conceptLLM";
import { ConceptManager, createConceptManager } from "./conceptManager";
import { ConceptExtractor, createConceptExtractor } from "./conceptExtractor";

// Export types
export * from "./types";

// Re-export services
export { ConceptLLMService, safeConceptExtraction };
export { ConceptManager, createConceptManager };
export { ConceptExtractor, createConceptExtractor };

// Factory function to create the complete concept extraction system
export function createConceptExtractionSystem() {
  const llmService = new ConceptLLMService();
  const conceptManager = createConceptManager(llmService);
  const conceptExtractor = createConceptExtractor(conceptManager, llmService);

  return {
    llmService,
    conceptManager,
    conceptExtractor,
  };
}
````

## File: lib/LLMCheckTime/actionsOpenAI.ts
````typescript
"use server";

import OpenAI from "openai";

import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file using

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from environment variables
});

export async function validateAnswer(time: string, answer: string) {

  const prompt = `
You are a Polish language expert validating time expressions. Your task is to evaluate a student's response to the question "Jaka jest godzina?" by ensuring it follows Polish formal or informal time formats.

## INPUTS: 
- Time: ${time}
- Student's Answer: ${answer}

### RULES:

#### FORMAL TIME FORMAT:
1. Structure: [hour in feminine ordinal form] + [minutes in cardinal form].
   - Example: 8:28 = "ósma dwadzieścia osiem", 21:40 = "dwudziesta pierwsza czterdzieści".
2. Errors to catch:
   - Incorrect hour form (e.g., "siedemnaście" instead of "siedemnasta").
   - Incorrect minute form (e.g., "trzydzieści szesnaście" instead of "trzydzieści sześć").

#### INFORMAL TIME FORMAT:
1. Structures:
   - **Minutes 1–29**: "[minutes in cardinal] po [hour in locative feminine ordinal]".
     - Example: 8:28 = "dwadzieścia osiem po ósmej".
   - **Minutes 31–59**: "za [remaining minutes to next hour in cardinal] [next hour in nominative feminine ordinal]".
     - Example: 8:45 = "za piętnaście dziewiąta".
   - **Minute 15**: "kwadrans po [hour in locative feminine ordinal]".
     - Example: 8:15 = "kwadrans po ósmej".
   - **Minute 30**: "wpół do [next hour in genitive feminine ordinal]".
     - Example: 8:30 = "wpół do dziewiątej".
  - Time expression in written form in case of informal siutation is in 12-hour format even if the format of input time in digits is in 24-hour format.
    - Example : 16:57 = "za trzy piąta".
2. Errors to catch:
   - Incorrect use of "po" or "za".
   - Incorrect locative/nominative/genitive forms.
   - Missing or extra words.

### TASK:
1. Detect if the user's answer is in formal or informal format. 
2. Validate against the rules for the identified format. 
3. Response is correct if the answer is correct in identified format. User must enter correct formal OR informal format.
  - Example : Identifed foramt is informal and the answer is correct in informal format = "correct"
  - Example : Identifed foramt is informal and the answer is incorrect in informal format = "incorrect"
  - Example : Identifed foramt is formal and the answer is correct in formal format = "correct"
  - Example : Identifed foramt is formal and the answer is incorrect in formal format = "incorrect"
4. Validation process requires checking the answer in indentified format not in both. 
4. Provide detailed feedback if there are errors.
5. Respond with the correct formal and informal formats if answer is incorrect.

### RESPONSE FORMAT:
Respond strictly in JSON. Do not include any additional text or explanations. Do not include "\`\`\`json" or any other header or footer. 
The correct key is true if the answer is correct in identified format otherwise false.

{
  "correct": <true/false>,
  "correctForm": {
    "formal": "EXPECTED FORMAL FORMAT",
    "informal": "EXPECTED INFORMAL FORMAT"
  },
  "comment": "Detailed feedback on errors. Explain why corrections are needed."
}`;


  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            'You are a Polish language assistant who validates user responses to "Jaka jest godzina?" by checking time expressions, grammar, and spelling.',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const response = completion.choices[0]?.message?.content || "";
    console.log("Response:", response);
    // Parse JSON response
    const result = JSON.parse(response);

    return {
      correct: result.correct || false,
      correctForm: result.correctForm || { formal: "", informal: "" },
      comment: result.comment || "No comment provided.",
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      correct: false,
      correctForm: { formal: "", informal: "" },
      comment:
        "An error occurred while processing the response. Please try again.",
    };
  }
}
````

## File: lib/LLMCourseValidation/courseValidation.ts
````typescript
"use server"

import OpenAI from "openai"
import { z } from "zod"
import { connectToDatabase } from "@/lib/dbConnect"
import Course from "@/datamodels/course.model"



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const courseSchema = z.object({
  courseId: z.number().int().positive(),
  date: z.string(),
  keywords: z.string(),
  mainSubjects: z.string().optional(),
  courseType: z.enum(["new", "review", "mixed"]),
  newSubjects: z.string().optional(),
  reviewSubjects: z.string().optional(),
  weaknesses: z.string().optional(),
  strengths: z.string().optional(),
  notes: z.string(),
  practice: z.string(),
  homework: z.string().optional(),
})




export async function validateAndSaveCourse(data: z.infer<typeof courseSchema>, finalSubmission = false) {
  try {
    // Validate data with Zod
    courseSchema.parse(data)

    const prompt = `Please review this course information and suggest any improvements or corrections in terms of typo, grammar issues or any suggestion to clarify. There is no need for exaplanation , you must only return the revised version in JSON format. Please keep the original contetnt of key if there is no suggestion for that key or if the input ar empty.
    The User inputs for course information: 
            ${JSON.stringify(data, null, 2)}`;
    console.log("Prompt:", prompt)

    if (!finalSubmission) {
      // LLM validation
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that helps validate and improve course information. Provide suggestions in a structured JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "validation_feedback",
            schema: {
              type: "object",
              properties: {
                sessionNumber: {
                  type: "number",
                  description: "Indicates whether the input was correct.",
                },
                date: {
                  type: "string",
                  description: "The input is valid input for the date.",
                },
                keywords: {
                  type: "string",
                  description: "The input is valid input for the keywords.",
                },
                mainSubjects: {
                  type: "string",
                  description: "The input is valid input for the main subjects.",
                },
                courseType: {
                  type: "string",
                  description: "The input is valid input for the course type.",
                },
                newSubjects: {
                  type: "string",
                  description: "The input is valid input for the new subjects.",
                },
                reviewSubjects: {
                  type: "string",
                  description: "The input is valid input for the review subjects.",
                },
                weaknesses: {
                  type: "string",
                  description: "The input is valid input for the weaknesses.",
                },
                strengths: {
                  type: "string",
                  description: "The input is valid input for the strengths.",
                },
                notes: {
                  type: "string",
                  description: "The input is valid input for the notes.",
                },
                practice: {
                  type: "string",
                  description: "The input is valid input for the practice.",
                },
                homework: {
                  type: "string",
                  description: "The input is valid input for the homework.",
                },
              },
              required: ["courseId", "date", "keywords", "courseType", "notes", "practice", "homework", "mainSubjects", "newSubjects", "reviewSubjects", "weaknesses", "strengths"],
              additionalProperties: false,        
            strict: true,
          },
        },
      },
      })

      console.log("Completion:",completion.choices[0]?.message?.content);
      const suggestions = JSON.parse(completion.choices[0]?.message?.content || "{}")

      if (Object.keys(suggestions).length > 0) {
        return { success: false, suggestions }
      }
    }

    // Connect to MongoDB
    await connectToDatabase()

    // Save to MongoDB
    const course = new Course(data)
    await course.save()

    return { success: true }
  } catch (error) {
    console.error("Error in validateAndSaveCourse:", error)
    return { success: false, error: "Failed to validate and save course" }
  }
}
````

## File: lib/LLMPracticeValidation/validateAnswer.ts
````typescript
"use server";

import OpenAI from "openai";
import type { ICourse } from "@/datamodels/course.model";
import type { IQuestionAnswer } from "@/datamodels/questionAnswer.model";
import { QuestionType, MistakeType, QuestionLevel } from "@/lib/enum";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function validateAnswer(
  question: string,
  userAnswer: string,
  course: ICourse,
  attemptNumber: number
): Promise<Partial<IQuestionAnswer>> {
  const prompt = `Validate the user's answer to the following question in the context of this course:
    Course: ${JSON.stringify(course, null, 2)}
    Question: ${question}
    User's Answer: ${userAnswer}
    Attempt Number: ${attemptNumber}
    If attempt number is 1 or 2, provide smart and indirect and creative feedback to help the user improve. If attempt number is 3, provide the correct answer. The feddbac should be in simple A1 level polish language. If the answer has typo or it has almost similar form, provide appropriate feedback and ask user the correct typo and form. Give some hint that he is almost correct and need t ocorrect typo or form. Don't be strict and be helpful.
   Provide feedback and determine if the answer is correct. Return the response strictly in JSON format.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that validates answers for language learning practice sessions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "validation_feedback",
        schema: {
          type: "object",
          properties: {
            isCorrect: {
              type: "boolean",
              description: "Indicates whether the user's answer was correct.",
            },
            feedback: {
              type: "string",
              description:
                "Hint for attempts 1-2, short description of the correct answer for attempt 3.",
            },
            correctAnswer: {
              type: "string",
              description: "The correct answer for the given question."
            },
            questionType: {
              type: "string",
              enum: Object.values(QuestionType),
              description: `The type of question, one of: ${Object.values(QuestionType).join(", ")}.`,
            },
            confidenceLevel: {
              type: "number",
              // minimum: 0,
              // maximum: 1,
              description:
                "A confidence score between 0 and 1 indicating how certain the model is about the answer.",
            },
            errorType: {
              type: ["string", "null"],
              enum: [...Object.values(MistakeType), null],
              description: `The type of mistake made by the user, if any. One of: ${Object.values(MistakeType).join(", ")}.`,
            },
            keywords: {
              type: "array",
              items: {
                type: "string",
              },
              // minItems: 2,
              // maxItems: 3,
              description: "A list of 2-3 keywords related to the question.",
            },
            category: {
              type: "string",
              description:
                "The general category of the question, e.g., 'vocabulary', 'grammar', 'listening comprehension'.",
            },
            questionLevel: {
              type: "string",
              enum: Object.values(QuestionLevel),
              description: `The difficulty level of the question, one of: ${Object.values(QuestionLevel).join(", ")}.`,
            },
            responseTime: {
              type: "number",
              description:
                "Time taken by the user to respond, measured in seconds.",
            },
          },
          required: [
            "isCorrect",
            "feedback",
            "correctAnswer",
            "questionType",
            "confidenceLevel",
            "errorType",
            "keywords",
            "category",
            "questionLevel",
            "responseTime",
          ],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

  return {
    isCorrect: Boolean(result.isCorrect),
    feedback:
      result.feedback ||
      (attemptNumber < 3 ? "Keep trying!" : "Here's the correct answer."),
    correctAnswer: result.correctAnswer || "No correct answer provided.",
    questionType: Object.values(QuestionType).includes(
      result.questionType as QuestionType
    )
      ? (result.questionType as QuestionType)
      : QuestionType.Q_AND_A,
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    category: result.category || "general",
    analysisDetails: {
      mistakeType: Object.values(MistakeType).includes(
        result.errorType as MistakeType
      )
        ? (result.errorType as MistakeType)
        : null,
      confidence: Math.max(0, Math.min(1, result.confidenceLevel || 0)),
      questionLevel: Object.values(QuestionLevel).includes(
        result.questionLevel as QuestionLevel
      )
        ? (result.questionLevel as QuestionLevel)
        : QuestionLevel.A2,
      responseTime: result.responseTime || 0,
    },
  };
}
````

## File: lib/practiceEngine/conceptPracticeEngine.ts
````typescript
// lib/practiceEngine/conceptPracticeEngine.ts - ENHANCED VERSION WITH FALLBACK STRATEGY
import Concept, { IConcept } from "@/datamodels/concept.model";
import ConceptProgress, {
  IConceptProgress,
} from "@/datamodels/conceptProgress.model";
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { SRSCalculator } from "./srsCalculator";
import { ContextBuilder } from "./contextBuilder";
import { generateQuestion } from "@/lib/LLMPracticeValidation/generateQuestion";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { v4 as uuidv4 } from "uuid";

export interface ConceptSelection {
  concepts: IConcept[];
  rationale: string;
  priorities: Map<string, number>;
}

export interface PracticeStats {
  totalConcepts: number;
  dueConcepts: number;
  overdueConcepts: number;
  averageMastery: number;
  questionBankSize: number;
  conceptsWithProgress: number;
  recentActivity: {
    practiceSessionsThisWeek: number;
    conceptsPracticedThisWeek: number;
    averageAccuracy: number;
  };
}

interface FallbackResult {
  questions: IQuestionBank[];
  fallbackLevel: string;
  reason: string;
}

export class ConceptPracticeEngine {
  private contextBuilder: ContextBuilder;

  constructor() {
    this.contextBuilder = new ContextBuilder();
  }

  /**
   * Get comprehensive practice statistics for a user
   */
  async getPracticeStats(userId: string = "default"): Promise<PracticeStats> {
    try {
      console.log(`📊 Getting practice stats for user: ${userId}`);

      // Get all active concepts
      const totalConcepts = await Concept.countDocuments({ isActive: true });

      // Get due and overdue concepts
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      // Get all progress records for this user
      const allProgress = await ConceptProgress.find({
        userId,
        isActive: true,
      });

      // Calculate average mastery
      const averageMastery =
        allProgress.length > 0
          ? allProgress.reduce((sum, p) => sum + p.masteryLevel, 0) /
            allProgress.length
          : 0;

      // Get question bank size
      const questionBankSize = await QuestionBank.countDocuments({
        isActive: true,
      });

      // Calculate recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentProgress = await ConceptProgress.find({
        userId,
        lastPracticed: { $gte: weekAgo },
        isActive: true,
      });

      const recentActivity = {
        practiceSessionsThisWeek: 0, // Would need practice session tracking
        conceptsPracticedThisWeek: recentProgress.length,
        averageAccuracy:
          recentProgress.length > 0
            ? recentProgress.reduce((sum, p) => sum + p.successRate, 0) /
              recentProgress.length
            : 0,
      };

      const stats: PracticeStats = {
        totalConcepts,
        dueConcepts: dueProgress.length,
        overdueConcepts: overdueProgress.length,
        averageMastery,
        questionBankSize,
        conceptsWithProgress: allProgress.length,
        recentActivity,
      };

      console.log(`✅ Practice stats calculated:`, {
        totalConcepts: stats.totalConcepts,
        dueConcepts: stats.dueConcepts,
        overdueConcepts: stats.overdueConcepts,
        questionBankSize: stats.questionBankSize,
      });

      return stats;
    } catch (error) {
      console.error(
        `❌ Error calculating practice stats for user ${userId}:`,
        error
      );

      // Return default stats in case of error
      return {
        totalConcepts: 0,
        dueConcepts: 0,
        overdueConcepts: 0,
        averageMastery: 0,
        questionBankSize: 0,
        conceptsWithProgress: 0,
        recentActivity: {
          practiceSessionsThisWeek: 0,
          conceptsPracticedThisWeek: 0,
          averageAccuracy: 0,
        },
      };
    }
  }

  /**
   * Select concepts for practice based on SRS algorithm and user performance
   */
  async selectPracticeConceptsForUser(
    userId: string = "default",
    maxConcepts: number = 5
  ): Promise<ConceptSelection> {
    try {
      console.log(
        `🎯 Selecting practice concepts for user: ${userId}, max: ${maxConcepts}`
      );

      // Get due and overdue concepts
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      const allDueProgress = [...overdueProgress, ...dueProgress];
      console.log(`Found ${allDueProgress.length} concepts due for practice`);

      // If no due concepts, initialize some basic concepts for new users
      if (allDueProgress.length === 0) {
        console.log(
          "No due concepts found, initializing basic concepts for new user"
        );
        return await this.initializeNewUserPractice(userId, maxConcepts);
      }

      // Calculate priorities and select top concepts
      const priorities = new Map<string, number>();

      for (const progress of allDueProgress) {
        const priority = SRSCalculator.calculatePriority(progress);
        priorities.set(progress.conceptId, priority);
      }

      // Sort by priority and take top concepts
      const sortedProgress = allDueProgress
        .sort(
          (a, b) => priorities.get(b.conceptId)! - priorities.get(a.conceptId)!
        )
        .slice(0, maxConcepts);

      const conceptIds = sortedProgress.map((p) => p.conceptId);

      // Get full concept details
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      // Generate rationale
      const rationale = this.generateSelectionRationale(
        sortedProgress,
        overdueProgress.length
      );

      console.log(`✅ Selected ${concepts.length} concepts for practice`);

      return {
        concepts,
        rationale,
        priorities,
      };
    } catch (error) {
      console.error("❌ Error selecting practice concepts:", error);

      // Fallback to basic concept selection
      return await this.initializeNewUserPractice(userId, maxConcepts);
    }
  }

  /**
   * Initialize practice for new users with basic concepts
   */
  private async initializeNewUserPractice(
    userId: string,
    maxConcepts: number
  ): Promise<ConceptSelection> {
    try {
      console.log(`🆕 Initializing practice for new user: ${userId}`);

      // Get some basic concepts (A1 level, most fundamental)
      const basicConcepts = await Concept.find({
        isActive: true,
        difficulty: QuestionLevel.A1,
      })
        .sort({ name: 1 })
        .limit(maxConcepts);

      // If no A1 concepts, get any concepts
      if (basicConcepts.length === 0) {
        const anyConcepts = await Concept.find({ isActive: true })
          .sort({ name: 1 })
          .limit(maxConcepts);

        // Initialize progress for these concepts
        for (const concept of anyConcepts) {
          await SRSCalculator.initializeConceptProgress(concept.id, userId);
        }

        return {
          concepts: anyConcepts,
          rationale:
            "Starting with available concepts to begin your learning journey",
          priorities: new Map(),
        };
      }

      // Initialize progress for basic concepts
      for (const concept of basicConcepts) {
        await SRSCalculator.initializeConceptProgress(concept.id, userId);
      }

      console.log(
        `✅ Initialized progress for ${basicConcepts.length} basic concepts`
      );

      return {
        concepts: basicConcepts,
        rationale:
          "Starting with fundamental A1-level concepts to build your foundation",
        priorities: new Map(),
      };
    } catch (error) {
      console.error("❌ Error initializing new user practice:", error);
      return {
        concepts: [],
        rationale: "Unable to initialize practice concepts",
        priorities: new Map(),
      };
    }
  }

  /**
   * Generate human-readable rationale for concept selection
   */
  private generateSelectionRationale(
    selectedProgress: IConceptProgress[],
    overdueCount: number
  ): string {
    if (selectedProgress.length === 0) {
      return "No concepts are currently due for practice. Great job keeping up!";
    }

    const parts: string[] = [];

    if (overdueCount > 0) {
      parts.push(
        `${overdueCount} overdue concept${overdueCount > 1 ? "s" : ""}`
      );
    }

    const dueCount = selectedProgress.length - overdueCount;
    if (dueCount > 0) {
      parts.push(`${dueCount} concept${dueCount > 1 ? "s" : ""} due today`);
    }

    const lowMasteryCount = selectedProgress.filter(
      (p) => p.masteryLevel < 0.5
    ).length;
    if (lowMasteryCount > 0) {
      parts.push(
        `focusing on ${lowMasteryCount} concept${lowMasteryCount > 1 ? "s" : ""} that need more practice`
      );
    }

    if (parts.length === 0) {
      return "Selected concepts based on spaced repetition schedule";
    }

    return `Selected ${parts.join(", ")} for optimal learning`;
  }

  /**
   * Get questions for selected concepts with comprehensive fallback strategy
   */
  async getQuestionsForConcepts(
    conceptIds: string[],
    mode: PracticeMode,
    maxQuestions: number = 10
  ): Promise<IQuestionBank[]> {
    try {
      console.log(
        `🎯 Getting questions for concepts: ${conceptIds.join(", ")}, mode: ${mode}`
      );

      if (conceptIds.length === 0) {
        console.log("No concepts provided, using fallback strategy");
        return await this.getFallbackQuestions([], mode, maxQuestions);
      }

      let questions: IQuestionBank[] = [];

      switch (mode) {
        case PracticeMode.NORMAL:
          questions = await this.getNormalPracticeQuestions(
            conceptIds,
            maxQuestions
          );
          break;
        case PracticeMode.PREVIOUS:
          questions = await this.getPreviousQuestionsWithFallback(
            conceptIds,
            maxQuestions
          );
          break;
        case PracticeMode.DRILL:
          questions = await this.getDrillQuestions(conceptIds, maxQuestions);
          break;
        default:
          questions = await this.getNormalPracticeQuestions(
            conceptIds,
            maxQuestions
          );
      }

      console.log(`✅ Retrieved ${questions.length} questions for practice`);
      return questions;
    } catch (error) {
      console.error("❌ Error getting questions for concepts:", error);
      return [];
    }
  }

  /**
   * Enhanced Previous Questions with comprehensive fallback strategy
   */
  private async getPreviousQuestionsWithFallback(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    console.log(`🔄 Implementing fallback strategy for previous questions`);

    // 1. Try: SRS due concepts → previous questions
    let result = await this.tryGetPreviousQuestions(
      conceptIds,
      maxQuestions,
      "SRS due concepts"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 2. Fallback 1: Any concepts with progress → previous questions
    console.log(
      `⚠️ ${result.reason}, trying fallback 1: concepts with progress`
    );
    const conceptsWithProgress = await this.getConceptsWithProgress();
    result = await this.tryGetPreviousQuestions(
      conceptsWithProgress.map((c) => c.conceptId),
      maxQuestions,
      "concepts with progress"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 3. Fallback 2: Any concepts → previous questions
    console.log(`⚠️ ${result.reason}, trying fallback 2: any concepts`);
    const allConcepts = await Concept.find({ isActive: true }).limit(20); // Limit to prevent huge queries
    result = await this.tryGetPreviousQuestions(
      allConcepts.map((c) => c.id),
      maxQuestions,
      "any available concepts"
    );
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 4. Fallback 3: All previous questions (ignore concepts)
    console.log(
      `⚠️ ${result.reason}, trying fallback 3: all previous questions`
    );
    result = await this.tryGetAllPreviousQuestions(maxQuestions);
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    // 5. Final: All available questions
    console.log(
      `⚠️ ${result.reason}, trying final fallback: all available questions`
    );
    result = await this.tryGetAllAvailableQuestions(maxQuestions);
    if (result.questions.length > 0) {
      console.log(
        `✅ Success with ${result.fallbackLevel}: ${result.questions.length} questions`
      );
      return result.questions;
    }

    console.log(`❌ All fallback strategies exhausted, no questions available`);
    return [];
  }

  /**
   * Try to get previous questions for specific concepts
   */
  private async tryGetPreviousQuestions(
    conceptIds: string[],
    maxQuestions: number,
    fallbackLevel: string
  ): Promise<FallbackResult> {
    if (conceptIds.length === 0) {
      return {
        questions: [],
        fallbackLevel,
        reason: `No concepts available for ${fallbackLevel}`,
      };
    }

    try {
      const questions = await QuestionBank.find({
        targetConcepts: { $in: conceptIds },
        timesUsed: { $gt: 0 },
        isActive: true,
      })
        .sort({ lastUsed: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel,
        reason:
          questions.length === 0
            ? `No previous questions found for ${fallbackLevel}`
            : `Found questions using ${fallbackLevel}`,
      };
    } catch (error) {
      console.error(
        `Error in tryGetPreviousQuestions for ${fallbackLevel}:`,
        error
      );
      return {
        questions: [],
        fallbackLevel,
        reason: `Error querying ${fallbackLevel}`,
      };
    }
  }

  /**
   * Try to get all previous questions regardless of concepts
   */
  private async tryGetAllPreviousQuestions(
    maxQuestions: number
  ): Promise<FallbackResult> {
    try {
      const questions = await QuestionBank.find({
        timesUsed: { $gt: 0 },
        isActive: true,
      })
        .sort({ lastUsed: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel: "all previous questions",
        reason:
          questions.length === 0
            ? "No previously used questions found"
            : "Found previously used questions",
      };
    } catch (error) {
      console.error("Error in tryGetAllPreviousQuestions:", error);
      return {
        questions: [],
        fallbackLevel: "all previous questions",
        reason: "Error querying all previous questions",
      };
    }
  }

  /**
   * Final fallback: get any available questions
   */
  private async tryGetAllAvailableQuestions(
    maxQuestions: number
  ): Promise<FallbackResult> {
    try {
      const questions = await QuestionBank.find({
        isActive: true,
      })
        .sort({ createdDate: -1 })
        .limit(maxQuestions);

      return {
        questions,
        fallbackLevel: "all available questions",
        reason:
          questions.length === 0
            ? "No questions available in database"
            : "Using any available questions",
      };
    } catch (error) {
      console.error("Error in tryGetAllAvailableQuestions:", error);
      return {
        questions: [],
        fallbackLevel: "all available questions",
        reason: "Error querying all available questions",
      };
    }
  }

  /**
   * Get concepts that have progress records
   */
  private async getConceptsWithProgress(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    try {
      return await ConceptProgress.find({
        userId,
        isActive: true,
      });
    } catch (error) {
      console.error("Error getting concepts with progress:", error);
      return [];
    }
  }

  /**
   * Fallback questions when no concepts are provided
   */
  private async getFallbackQuestions(
    conceptIds: string[],
    mode: PracticeMode,
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    console.log(`🔄 Using fallback questions for mode: ${mode}`);

    switch (mode) {
      case PracticeMode.PREVIOUS: {
        const result = await this.tryGetAllPreviousQuestions(maxQuestions);
        return result.questions;
      }
      case PracticeMode.DRILL:
        return await this.tryGetAllAvailableQuestions(maxQuestions).then(
          (r) => r.questions
        );
      default:
        return await this.tryGetAllAvailableQuestions(maxQuestions).then(
          (r) => r.questions
        );
    }
  }

  /**
   * Get normal practice questions (mix of existing and new)
   */
  private async getNormalPracticeQuestions(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    // Get existing questions (50% of total)
    const existingCount = Math.floor(maxQuestions * 0.5);
    const existingQuestions = await QuestionBank.find({
      targetConcepts: { $in: conceptIds },
      isActive: true,
    })
      .sort({ timesUsed: 1, successRate: -1 }) // Prefer less used, higher success rate
      .limit(existingCount);

    // Generate new questions for remaining slots
    const newCount = maxQuestions - existingQuestions.length;
    const newQuestions = await this.generateNewQuestions(conceptIds, newCount);

    return [...existingQuestions, ...newQuestions];
  }

  /**
   * Get drill questions (focus on poor performance)
   */
  private async getDrillQuestions(
    conceptIds: string[],
    maxQuestions: number
  ): Promise<IQuestionBank[]> {
    const poorQuestions = await QuestionBank.find({
      targetConcepts: { $in: conceptIds },
      successRate: { $lt: 0.6 },
      timesUsed: { $gt: 2 },
      isActive: true,
    })
      .sort({ successRate: 1 }) // Worst performing first
      .limit(Math.floor(maxQuestions * 0.7));

    // Fill remaining with new questions
    const remainingCount = maxQuestions - poorQuestions.length;
    const newQuestions = await this.generateNewQuestions(
      conceptIds,
      remainingCount
    );

    return [...poorQuestions, ...newQuestions];
  }

  /**
   * Generate new questions for concepts
   */
  private async generateNewQuestions(
    conceptIds: string[],
    count: number
  ): Promise<IQuestionBank[]> {
    if (count <= 0) return [];

    console.log(
      `🎯 Generating ${count} new questions for concepts: ${conceptIds.join(", ")}`
    );

    try {
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      if (concepts.length === 0) {
        console.log("No concepts found, cannot generate questions");
        return [];
      }

      const context = concepts
        .map(
          (c) =>
            `${c.name}: ${c.description}. Examples: ${c.examples.join(", ")}`
        )
        .join("\n");

      const savedQuestions: IQuestionBank[] = [];

      // Generate questions one by one
      for (let i = 0; i < Math.min(count, 3); i++) {
        try {
          const mockCourse = {
            courseId: 0,
            date: new Date(),
            courseType: CourseType.NEW,
            notes: context,
            practice: context,
            keywords: concepts.flatMap((c) => [c.name]),
            newWords: concepts.flatMap((c) => c.examples.slice(0, 2)),
          };

          const previousQuestions = savedQuestions.map((q) => q.question);
          const questionText = await generateQuestion(
            mockCourse,
            previousQuestions
          );

          if (!questionText || questionText.includes("Failed to generate")) {
            console.log(`❌ Failed to generate question ${i + 1}, skipping`);
            continue;
          }

          // Create question with valid required fields
          const questionData: IQuestionBank = {
            id: uuidv4(),
            question: questionText,
            correctAnswer: "To be determined during practice",
            questionType: QuestionType.Q_AND_A,
            targetConcepts: conceptIds,
            difficulty: this.inferDifficulty(concepts),
            timesUsed: 0,
            successRate: 0,
            lastUsed: new Date(),
            createdDate: new Date(),
            isActive: true,
            source: "generated",
          };

          // Save directly to database with proper validation
          const savedQuestion = await QuestionBank.create(questionData);
          savedQuestions.push(savedQuestion.toObject());
          console.log(
            `✅ Generated and saved question ${i + 1}: ${questionText.substring(0, 50)}...`
          );
        } catch (error) {
          console.error(`❌ Error generating question ${i + 1}:`, error);

          // Log the specific validation error for debugging
          if (
            error instanceof Error &&
            error.message.includes("validation failed")
          ) {
            console.error(`❌ Validation details:`, error);
          }
        }
      }

      console.log(
        `✅ Successfully generated ${savedQuestions.length} questions`
      );
      return savedQuestions;
    } catch (error) {
      console.error("❌ Error in generateNewQuestions:", error);
      return [];
    }
  }

  /**
   * Infer difficulty level from concepts
   */
  private inferDifficulty(concepts: IConcept[]): QuestionLevel {
    if (concepts.length === 0) return QuestionLevel.A1;

    // Use the highest difficulty among the concepts
    const difficulties = concepts.map((c) => c.difficulty);

    // Simple priority order
    const priorityOrder = [
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ];

    for (const level of priorityOrder.reverse()) {
      if (difficulties.includes(level)) {
        return level;
      }
    }

    return QuestionLevel.A1;
  }

  /**
   * Update question performance after use
   */
  async updateQuestionPerformance(
    questionId: string,
    isCorrect: boolean
  ): Promise<void> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(`Question ${questionId} not found for performance update`);
        return;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newCorrect / newTimesUsed;

      await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date(),
          },
        }
      );

      console.log(
        `✅ Updated question ${questionId} performance: ${(newSuccessRate * 100).toFixed(1)}% success rate`
      );
    } catch (error) {
      console.error(`❌ Error updating question performance:`, error);
    }
  }
}
````

## File: lib/practiceEngine/srsCalculator.ts
````typescript
// lib/practiceEngine/srsCalculator.ts
import ConceptProgress, { IConceptProgress } from "@/datamodels/conceptProgress.model";

export interface SRSParameters {
  easinessFactor: number;
  intervalDays: number;
  consecutiveCorrect: number;
  isCorrect: boolean;
  responseTime: number;
  difficultyRating?: number; // user-provided difficulty (1-5)
}

export interface SRSResult {
  nextReview: Date;
  newEasinessFactor: number;
  newIntervalDays: number;
  masteryLevelChange: number;
}

export class SRSCalculator {
  private static readonly MIN_EASINESS_FACTOR = 1.3;
  private static readonly MAX_EASINESS_FACTOR = 2.5;
  private static readonly INITIAL_INTERVAL = 1;
  private static readonly MAX_INTERVAL = 365; // 1 year max

  /**
   * Calculate next review date based on performance
   */
  static calculateNextReview(
    conceptProgress: IConceptProgress,
    isCorrect: boolean,
    responseTime: number = 0,
    difficultyRating?: number
  ): SRSResult {
    const params: SRSParameters = {
      easinessFactor: conceptProgress.easinessFactor,
      intervalDays: conceptProgress.intervalDays,
      consecutiveCorrect: conceptProgress.consecutiveCorrect,
      isCorrect,
      responseTime,
      difficultyRating,
    };

    return this.calculateSRS(params);
  }

  /**
   * SM-2 Algorithm implementation with modifications
   */
  private static calculateSRS(params: SRSParameters): SRSResult {
    let newEasinessFactor = params.easinessFactor;
    let newIntervalDays = params.intervalDays;
    let consecutiveCorrect = params.consecutiveCorrect;
    let masteryLevelChange = 0;

    if (params.isCorrect) {
      consecutiveCorrect++;
      masteryLevelChange = 0.1; // Increase mastery

      // Calculate new interval based on SM-2
      if (consecutiveCorrect === 1) {
        newIntervalDays = 1;
      } else if (consecutiveCorrect === 2) {
        newIntervalDays = 6;
      } else {
        newIntervalDays = Math.round(params.intervalDays * newEasinessFactor);
      }

      // Adjust easiness factor slightly upward for good performance
      if (params.responseTime < 5000) {
        // Fast response
        newEasinessFactor += 0.05;
      }

      // User difficulty rating adjustment
      if (params.difficultyRating) {
        const adjustment = (3 - params.difficultyRating) * 0.05; // Rating 1=hard, 5=easy
        newEasinessFactor += adjustment;
      }
    } else {
      consecutiveCorrect = 0;
      masteryLevelChange = -0.2; // Decrease mastery
      newIntervalDays = 1; // Reset to beginning

      // Decrease easiness factor for wrong answers
      newEasinessFactor -= 0.2;

      // Additional penalty for slow wrong answers
      if (params.responseTime > 15000) {
        newEasinessFactor -= 0.1;
      }
    }

    // Clamp easiness factor
    newEasinessFactor = Math.max(
      this.MIN_EASINESS_FACTOR,
      Math.min(this.MAX_EASINESS_FACTOR, newEasinessFactor)
    );

    // Clamp interval
    newIntervalDays = Math.max(1, Math.min(this.MAX_INTERVAL, newIntervalDays));

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newIntervalDays);

    return {
      nextReview,
      newEasinessFactor,
      newIntervalDays,
      masteryLevelChange,
    };
  }

  /**
   * Get concepts due for review today
   */
  static async getConceptsDueForReview(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await ConceptProgress.find({
      userId,
      nextReview: { $lte: today },
      isActive: true,
    }).sort({ nextReview: 1 }); // Oldest due first
  }

  /**
   * Get overdue concepts (past due date)
   */
  static async getOverdueConcepts(
    userId: string = "default"
  ): Promise<IConceptProgress[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    return await ConceptProgress.find({
      userId,
      nextReview: { $lt: yesterday },
      isActive: true,
    }).sort({ nextReview: 1 });
  }

  /**
   * Calculate concept priority score for practice selection
   */
  static calculatePriority(conceptProgress: IConceptProgress): number {
    const now = new Date();
    const daysSinceReview = Math.floor(
      (now.getTime() - conceptProgress.nextReview.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let priority = 0;

    // Overdue concepts get highest priority
    if (daysSinceReview > 0) {
      priority += daysSinceReview * 2; // 2 points per overdue day
    }

    // Low mastery concepts get higher priority
    priority += (1 - conceptProgress.masteryLevel) * 10;

    // Low success rate concepts get higher priority
    priority += (1 - conceptProgress.successRate) * 5;

    // Concepts with low easiness factor (hard concepts) get slight priority
    priority += (2.5 - conceptProgress.easinessFactor) * 2;

    return Math.max(0, priority);
  }

  /**
   * Initialize concept progress for new concept
   */
  static async initializeConceptProgress(
    conceptId: string,
    userId: string = "default"
  ): Promise<IConceptProgress> {
    const existing = await ConceptProgress.findOne({ userId, conceptId });
    if (existing) {
      return existing;
    }

    const newProgress = new ConceptProgress({
      userId,
      conceptId,
      masteryLevel: 0,
      lastPracticed: null,
      nextReview: new Date(), // Due immediately
      successRate: 0,
      totalAttempts: 0,
      consecutiveCorrect: 0,
      easinessFactor: 2.5, // SM-2 default
      intervalDays: 1,
      isActive: true,
    });

    return await newProgress.save();
  }

  /**
   * Update concept progress after practice
   */
  static async updateConceptProgress(
    conceptId: string,
    isCorrect: boolean,
    responseTime: number,
    userId: string = "default",
    difficultyRating?: number
  ): Promise<IConceptProgress> {
    let progress = await ConceptProgress.findOne({ userId, conceptId });

    if (!progress) {
      progress = await this.initializeConceptProgress(conceptId, userId);
    }

    // Calculate SRS updates
    const srsResult = this.calculateNextReview(
      progress,
      isCorrect,
      responseTime,
      difficultyRating
    );

    // Update progress
    progress.lastPracticed = new Date();
    progress.nextReview = srsResult.nextReview;
    progress.easinessFactor = srsResult.newEasinessFactor;
    progress.intervalDays = srsResult.newIntervalDays;
    progress.totalAttempts += 1;

    if (isCorrect) {
      progress.consecutiveCorrect += 1;
    } else {
      progress.consecutiveCorrect = 0;
    }

    // Update mastery level (0-1 scale)
    progress.masteryLevel = Math.max(
      0,
      Math.min(1, progress.masteryLevel + srsResult.masteryLevelChange)
    );

    // Update success rate
    const correctAnswers = isCorrect
      ? progress.successRate * (progress.totalAttempts - 1) + 1
      : progress.successRate * (progress.totalAttempts - 1);
    progress.successRate = correctAnswers / progress.totalAttempts;

    return await progress.save();
  }
}
````

## File: lib/services/questionBankService.ts
````typescript
// lib/services/questionBankService.ts
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { v4 as uuidv4 } from "uuid";

export class QuestionBankService {
  /**
   * Save question to bank with retry logic
   */
  static async saveQuestion(questionData: Partial<IQuestionBank>): Promise<IQuestionBank | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Saving question attempt ${attempt}:`, questionData.question?.substring(0, 50));
        
        // Ensure required fields
        const completeQuestionData: IQuestionBank = {
          id: questionData.id || uuidv4(),
          question: questionData.question || "",
          correctAnswer: questionData.correctAnswer || "",
          questionType: questionData.questionType!,
          targetConcepts: questionData.targetConcepts || [],
          difficulty: questionData.difficulty!,
          timesUsed: 0,
          successRate: 0,
          lastUsed: new Date(),
          createdDate: new Date(),
          isActive: true,
          source: questionData.source || "generated"
        };

        const savedQuestion = await QuestionBank.create(completeQuestionData);
        console.log(`✅ Question saved successfully: ${savedQuestion.id}`);
        return savedQuestion;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Save attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`Failed to save question after ${maxRetries} attempts:`, lastError);
    return null;
  }

  /**
   * Update question with correct answer
   */
  static async updateQuestionAnswer(questionId: string, correctAnswer: string): Promise<boolean> {
    try {
      const result = await QuestionBank.updateOne(
        { id: questionId },
        { 
          $set: { 
            correctAnswer,
            lastUsed: new Date()
          } 
        }
      );
      
      console.log(`✅ Question ${questionId} updated with correct answer`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Failed to update question ${questionId}:`, error);
      return false;
    }
  }

  /**
   * Update question performance metrics
   */
  static async updateQuestionPerformance(questionId: string, isCorrect: boolean): Promise<boolean> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(`Question ${questionId} not found for performance update`);
        return false;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newCorrect / newTimesUsed;

      const result = await QuestionBank.updateOne(
        { id: questionId },
        { 
          $set: { 
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date()
          } 
        }
      );

      console.log(`✅ Question ${questionId} performance updated: ${(newSuccessRate * 100).toFixed(1)}% success rate`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Failed to update question performance ${questionId}:`, error);
      return false;
    }
  }

  /**
   * Check if question exists in bank
   */
  static async questionExists(questionId: string): Promise<boolean> {
    try {
      const count = await QuestionBank.countDocuments({ id: questionId });
      return count > 0;
    } catch (error) {
      console.error(`Error checking question existence ${questionId}:`, error);
      return false;
    }
  }
}
````

## File: lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: next.config.ts
````typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
````

## File: postcss.config.mjs
````
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
````

## File: public/file.svg
````
<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
````

## File: public/globe.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
````

## File: public/next.svg
````
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
````

## File: public/vercel.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
````

## File: public/window.svg
````
<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
````

## File: README.md
````markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

## File: .gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

repomix-output.txt
````

## File: app/api/concepts/[id]/route.ts
````typescript
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Update concept schema (partial)
const updateConceptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z
    .enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY])
    .optional(),
  description: z.string().min(1).max(500).optional(),
  examples: z.array(z.string()).max(10).optional(),
  prerequisites: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
  difficulty: z
    .enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

// GET /api/concepts/[id] - Fetch specific concept
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const conceptManager = new ConceptManager();
    
    // Await the params
    const { id } = await params;

    const concept = await conceptManager.getConcept(id);

    if (!concept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    // Include related data
    const relatedCourses = await conceptManager.getCoursesForConcept(id);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...concept,
          relatedCourses,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/concepts/[id] - Update concept
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Await the params
    const { id } = await params;

    // Validate partial update data
    const validatedData = updateConceptSchema.parse(body);

    const conceptManager = new ConceptManager();

    // Check if concept exists
    const existingConcept = await conceptManager.getConcept(id);
    if (!existingConcept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    const updatedConcept = await conceptManager.updateConcept(
      id,
      validatedData
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedConcept,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error updating concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/concepts/[id] - Soft delete concept
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const conceptManager = new ConceptManager();
    
    // Await the params
    const { id } = await params;

    // Check if concept exists
    const existingConcept = await conceptManager.getConcept(id);
    if (!existingConcept) {
      return NextResponse.json(
        {
          success: false,
          error: "Concept not found",
        },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await conceptManager.updateConcept(id, { isActive: false });

    return NextResponse.json(
      {
        success: true,
        message: "Concept deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting concept:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete concept",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/concepts/extract/route.ts
````typescript
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptExtractor } from "@/lib/conceptExtraction/conceptExtractor";
import { z } from "zod";

const extractRequestSchema = z.object({
  courseId: z.number().int().positive(),
});

// POST /api/concepts/extract - Extract concepts from course
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate request body
    const { courseId } = extractRequestSchema.parse(body);

    const extractor = new ConceptExtractor();
    const result = await extractor.extractConceptsFromCourse(courseId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Concept extraction failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        extractionId: result.extractionId,
        message: `Extracted ${result.data?.totalExtracted || 0} concepts`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Concept extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Concept extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/concepts/extract - Get extraction status or results
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // Extract query parameters with validation
    const courseId = parseInt(searchParams.get("courseId") || "");

    if (isNaN(courseId) || courseId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid courseId parameter",
        },
        { status: 400 }
      );
    }

    const extractor = new ConceptExtractor();
    const reviewData = await extractor.prepareReviewData(courseId);

    if (!reviewData) {
      return NextResponse.json(
        {
          success: false,
          error: "No extraction data found for this course",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: reviewData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting extraction data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get extraction data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/debug/concepts/route.ts
````typescript
// app/api/debug/concepts/route.ts - Create this new file for debugging
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import CourseConcept from "@/datamodels/courseConcept.model";
import ConceptProgress from "@/datamodels/conceptProgress.model";
import Course from "@/datamodels/course.model";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";

// GET /api/debug/concepts - Debug concept system
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId") || "default";

    switch (action) {
      case "system-overview":
        return await getSystemOverview();

      case "course-concepts":
        if (!courseId) {
          return NextResponse.json(
            { error: "courseId required" },
            { status: 400 }
          );
        }
        return await getCourseConceptsDebug(parseInt(courseId));

      case "practice-ready":
        return await getPracticeReadyConcepts(userId);

      case "fix-progress":
        return await fixConceptProgress(userId);

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            availableActions: [
              "system-overview",
              "course-concepts",
              "practice-ready",
              "fix-progress",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getSystemOverview() {
  const [
    totalConcepts,
    activeConcepts,
    totalCourseLinks,
    totalProgress,
    courses,
  ] = await Promise.all([
    Concept.countDocuments(),
    Concept.countDocuments({ isActive: true }),
    CourseConcept.countDocuments({ isActive: true }),
    ConceptProgress.countDocuments({ isActive: true }),
    Course.find({}, { courseId: 1, conceptExtractionStatus: 1 }).sort({
      courseId: 1,
    }),
  ]);

  return NextResponse.json({
    system: {
      totalConcepts,
      activeConcepts,
      totalCourseLinks,
      totalProgress,
      courses: courses.map((c) => ({
        id: c.courseId,
        status: c.conceptExtractionStatus,
      })),
    },
  });
}

async function getCourseConceptsDebug(courseId: number) {
  const [course, courseLinks, concepts] = await Promise.all([
    Course.findOne({ courseId }),
    CourseConcept.find({ courseId, isActive: true }),
    CourseConcept.aggregate([
      { $match: { courseId, isActive: true } },
      {
        $lookup: {
          from: "concepts",
          localField: "conceptId",
          foreignField: "id",
          as: "concept",
        },
      },
      { $unwind: "$concept" },
      {
        $lookup: {
          from: "conceptprogresses",
          localField: "conceptId",
          foreignField: "conceptId",
          as: "progress",
        },
      },
    ]),
  ]);

  return NextResponse.json({
    course: {
      id: courseId,
      status: course?.conceptExtractionStatus,
      extractedConcepts: course?.extractedConcepts?.length || 0,
    },
    links: {
      total: courseLinks.length,
      concepts: concepts.map((link) => ({
        id: link.conceptId,
        name: link.concept?.name,
        category: link.concept?.category,
        confidence: link.confidence,
        hasProgress: link.progress.length > 0,
        progressDetails: link.progress[0] || null,
      })),
    },
  });
}

async function getPracticeReadyConcepts(userId: string) {
  // Get concepts due for practice
  const [dueProgress, overdueProgress, allProgress] = await Promise.all([
    SRSCalculator.getConceptsDueForReview(userId),
    SRSCalculator.getOverdueConcepts(userId),
    ConceptProgress.find({ userId, isActive: true }),
  ]);

  // Get concepts without progress
  const conceptsWithProgress = allProgress.map((p) => p.conceptId);
  const conceptsWithoutProgress = await Concept.find({
    isActive: true,
    id: { $nin: conceptsWithProgress },
  });

  return NextResponse.json({
    practice: {
      dueCount: dueProgress.length,
      overdueCount: overdueProgress.length,
      totalProgressRecords: allProgress.length,
      conceptsWithoutProgress: conceptsWithoutProgress.length,
      due: dueProgress.map((p) => ({
        conceptId: p.conceptId,
        masteryLevel: p.masteryLevel,
        nextReview: p.nextReview,
      })),
      overdue: overdueProgress.map((p) => ({
        conceptId: p.conceptId,
        masteryLevel: p.masteryLevel,
        nextReview: p.nextReview,
        daysPastDue: Math.floor(
          (Date.now() - p.nextReview.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      missingProgress: conceptsWithoutProgress.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
      })),
    },
  });
}

async function fixConceptProgress(userId: string) {
  // Find concepts without progress records
  const allConcepts = await Concept.find({ isActive: true });
  const existingProgress = await ConceptProgress.find({
    userId,
    isActive: true,
  });
  const existingConceptIds = new Set(existingProgress.map((p) => p.conceptId));

  const conceptsNeedingProgress = allConcepts.filter(
    (c) => !existingConceptIds.has(c.id)
  );

  let created = 0;
  const errors = [];

  for (const concept of conceptsNeedingProgress) {
    try {
      await SRSCalculator.initializeConceptProgress(concept.id, userId);
      created++;
    } catch (error) {
      errors.push(
        `Failed to init progress for ${concept.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return NextResponse.json({
    fix: {
      conceptsFound: conceptsNeedingProgress.length,
      progressCreated: created,
      errors,
    },
  });
}
````

## File: app/api/practice-new/progress/route.ts
````typescript
// app/api/practice-new/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";
import { z } from "zod";

const progressUpdateSchema = z.object({
  conceptId: z.string(),
  questionId: z.string().optional(),
  isCorrect: z.boolean(),
  responseTime: z.number().min(0),
  userId: z.string().optional().default("default"),
  difficultyRating: z.number().min(1).max(5).optional(),
  userAnswer: z.string().optional(),
  sessionId: z.string().optional(),
});

// POST /api/practice-new/progress - Update concept progress
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      conceptId,
      questionId,
      isCorrect,
      responseTime,
      userId,
      difficultyRating,
      // userAnswer, - removed unused variable
      sessionId,
    } = progressUpdateSchema.parse(body);

    // Update concept progress using SRS
    const updatedProgress = await SRSCalculator.updateConceptProgress(
      conceptId,
      isCorrect,
      responseTime,
      userId,
      difficultyRating
    );

    // Update question performance if questionId provided
    if (questionId) {
      const practiceEngine = new ConceptPracticeEngine();
      await practiceEngine.updateQuestionPerformance(questionId, isCorrect);
    }

    // Log practice activity (optional - for analytics)
    if (sessionId) {
      // Could save to practice session log here
      console.log(
        `Session ${sessionId}: Concept ${conceptId} - ${isCorrect ? "Correct" : "Incorrect"}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          conceptId,
          nextReview: updatedProgress.nextReview,
          masteryLevel: updatedProgress.masteryLevel,
          successRate: updatedProgress.successRate,
          consecutiveCorrect: updatedProgress.consecutiveCorrect,
          intervalDays: updatedProgress.intervalDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid progress data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Error updating progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update progress",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/practice-new/progress - Get user progress summary
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";
    const conceptId = searchParams.get("conceptId");

    if (conceptId) {
      // Get specific concept progress
      const progress = await SRSCalculator.initializeConceptProgress(
        conceptId,
        userId
      );

      return NextResponse.json(
        {
          success: true,
          data: progress,
        },
        { status: 200 }
      );
    } else {
      // Get due concepts summary
      const [dueProgress, overdueProgress] = await Promise.all([
        SRSCalculator.getConceptsDueForReview(userId),
        SRSCalculator.getOverdueConcepts(userId),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            dueConcepts: dueProgress.length,
            overdueConcepts: overdueProgress.length,
            dueConceptIds: dueProgress.map((p) => p.conceptId),
            overdueConceptIds: overdueProgress.map((p) => p.conceptId),
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch progress data",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/questions/route.ts
````typescript
// app/api/questions/route.ts - ENHANCED VERSION WITH FIXED QUESTION BANK PERSISTENCE
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { PracticeMode, QuestionType, QuestionLevel } from "@/lib/enum";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Enhanced Question Bank Service for robust database operations
class QuestionBankService {
  /**
   * Save question to bank with retry logic and validation
   */
  static async saveQuestion(
    questionData: Partial<IQuestionBank>
  ): Promise<IQuestionBank | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `💾 Saving question attempt ${attempt}:`,
          questionData.question?.substring(0, 50)
        );

        // Ensure all required fields are present
        const completeQuestionData: IQuestionBank = {
          id: questionData.id || uuidv4(),
          question: questionData.question || "",
          correctAnswer: questionData.correctAnswer || "",
          questionType: questionData.questionType || QuestionType.Q_AND_A,
          targetConcepts: questionData.targetConcepts || [],
          difficulty: questionData.difficulty || QuestionLevel.A1,
          timesUsed: questionData.timesUsed || 0,
          successRate: questionData.successRate || 0,
          lastUsed: questionData.lastUsed || new Date(),
          createdDate: questionData.createdDate || new Date(),
          isActive:
            questionData.isActive !== undefined ? questionData.isActive : true,
          source: questionData.source || "generated",
        };

        // Validate required fields
        if (!completeQuestionData.question.trim()) {
          throw new Error("Question text is required");
        }
        if (!completeQuestionData.targetConcepts.length) {
          throw new Error("At least one target concept is required");
        }

        const savedQuestion = await QuestionBank.create(completeQuestionData);
        console.log(`✅ Question saved successfully: ${savedQuestion.id}`);
        return savedQuestion.toObject();
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Save attempt ${attempt} failed:`, error);

        // Handle duplicate key errors
        if (error instanceof Error && error.message.includes("duplicate key")) {
          console.log(
            `Question ${questionData.id} already exists, fetching existing...`
          );
          try {
            const existing = await QuestionBank.findOne({
              id: questionData.id,
            });
            return existing ? existing.toObject() : null;
          } catch (fetchError) {
            console.error("Failed to fetch existing question:", fetchError);
          }
        }

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(
      `❌ Failed to save question after ${maxRetries} attempts:`,
      lastError?.message
    );
    return null;
  }

  /**
   * Update question with correct answer
   */
  static async updateQuestionAnswer(
    questionId: string,
    correctAnswer: string
  ): Promise<boolean> {
    try {
      if (!correctAnswer.trim()) {
        console.warn(
          `Empty correct answer provided for question ${questionId}`
        );
        return false;
      }

      const result = await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            correctAnswer: correctAnswer.trim(),
            lastUsed: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Question ${questionId} updated with correct answer`);
        return true;
      } else {
        console.warn(`⚠️ Question ${questionId} not found for answer update`);
        return false;
      }
    } catch (error) {
      console.error(
        `❌ Failed to update question ${questionId} answer:`,
        error
      );
      return false;
    }
  }

  /**
   * Update question performance metrics
   */
  static async updateQuestionPerformance(
    questionId: string,
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(
          `⚠️ Question ${questionId} not found for performance update`
        );
        return false;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newTimesUsed > 0 ? newCorrect / newTimesUsed : 0;

      const result = await QuestionBank.updateOne(
        { id: questionId },
        {
          $set: {
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ Question ${questionId} performance updated: ${(newSuccessRate * 100).toFixed(1)}% success rate (${newTimesUsed} uses)`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `❌ Failed to update question performance ${questionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if question exists in bank
   */
  static async questionExists(questionId: string): Promise<boolean> {
    try {
      const count = await QuestionBank.countDocuments({
        id: questionId,
        isActive: true,
      });
      return count > 0;
    } catch (error) {
      console.error(
        `❌ Error checking question existence ${questionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get question statistics
   */
  static async getQuestionStats(): Promise<{
    totalQuestions: number;
    questionsWithAnswers: number;
    averageSuccessRate: number;
    answerPercentage: number;
  }> {
    try {
      const stats = await QuestionBank.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: 1 },
            questionsWithAnswers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$correctAnswer", ""] },
                      {
                        $ne: [
                          "$correctAnswer",
                          "To be determined during practice",
                        ],
                      },
                      { $ne: ["$correctAnswer", null] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            questionsUsed: {
              $sum: { $cond: [{ $gt: ["$timesUsed", 0] }, 1, 0] },
            },
            avgSuccessRate: { $avg: "$successRate" },
            generatedQuestions: {
              $sum: { $cond: [{ $eq: ["$source", "generated"] }, 1, 0] },
            },
            manualQuestions: {
              $sum: { $cond: [{ $eq: ["$source", "manual"] }, 1, 0] },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          totalQuestions: 0,
          questionsWithAnswers: 0,
          questionsUsed: 0,
          avgSuccessRate: 0,
          generatedQuestions: 0,
          manualQuestions: 0,
        }
      );
    } catch (error) {
      console.error("Error getting question stats:", error);
      return {
        totalQuestions: 0,
        questionsWithAnswers: 0,
        averageSuccessRate: 0,
        answerPercentage: 0,
      };
    }
  }
}

// Validation schemas
const questionQuerySchema = z.object({
  conceptIds: z.string().optional(),
  mode: z
    .enum([PracticeMode.NORMAL, PracticeMode.PREVIOUS, PracticeMode.DRILL])
    .optional(),
  limit: z.string().optional(),
  difficulty: z.string().optional(),
  questionType: z.string().optional(),
  questionId: z.string().optional(), // For single question lookup
  stats: z.string().optional(), // For getting statistics
});

const createQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  questionType: z.enum(
    Object.values(QuestionType) as [QuestionType, ...QuestionType[]]
  ),
  targetConcepts: z
    .array(z.string())
    .min(1, "At least one target concept is required"),
  difficulty: z.enum(
    Object.values(QuestionLevel) as [QuestionLevel, ...QuestionLevel[]]
  ),
  source: z.enum(["generated", "manual"]).default("manual"),
});

const updateQuestionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  correctAnswer: z.string().optional(),
  timesUsed: z.number().min(0).optional(),
  successRate: z.number().min(0).max(1).optional(),
  lastUsed: z.string().optional(),
  isCorrect: z.boolean().optional(),
  performanceOnly: z.boolean().optional(), // Flag to only update performance
});

// GET /api/questions - Fetch questions by various criteria
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const {
      conceptIds,
      mode,
      limit,
      difficulty,
      questionType,
      questionId,
      stats,
    } = questionQuerySchema.parse(queryParams);

    // Handle statistics request
    if (stats === "true") {
      const statistics = await QuestionBankService.getQuestionStats();
      return NextResponse.json(
        {
          success: true,
          data: statistics,
        },
        { status: 200 }
      );
    }

    // Handle single question lookup
    if (questionId) {
      const question = await QuestionBank.findOne({
        id: questionId,
        isActive: true,
      });
      if (!question) {
        return NextResponse.json(
          {
            success: false,
            error: "Question not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id: question.id,
            question: question.question,
            correctAnswer: question.correctAnswer,
            questionType: question.questionType,
            targetConcepts: question.targetConcepts,
            difficulty: question.difficulty,
            timesUsed: question.timesUsed,
            successRate: question.successRate,
            lastUsed: question.lastUsed,
            source: question.source,
          },
        },
        { status: 200 }
      );
    }

    // Build query for multiple questions
    interface QuestionQuery {
      isActive: boolean;
      targetConcepts?: { $in: string[] };
      questionType?: string;
      difficulty?: string;
      timesUsed?: { $gt: number };
      successRate?: { $lt: number };
    }

    const query: QuestionQuery = { isActive: true };

    if (conceptIds) {
      const conceptIdArray = conceptIds.split(",").filter((id) => id.trim());
      if (conceptIdArray.length > 0) {
        query.targetConcepts = { $in: conceptIdArray };
      }
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (questionType) {
      query.questionType = questionType;
    }

    // Mode-specific filters
    if (mode === PracticeMode.PREVIOUS) {
      query.timesUsed = { $gt: 0 }; // Only previously used questions
    } else if (mode === PracticeMode.DRILL) {
      query.successRate = { $lt: 0.6 }; // Low success rate questions
      query.timesUsed = { $gt: 2 }; // Must have been tried multiple times
    }

    // Build sort criteria
    let sortCriteria = {};
    if (mode === PracticeMode.PREVIOUS) {
      sortCriteria = { lastUsed: -1 }; // Most recently used first
    } else if (mode === PracticeMode.DRILL) {
      sortCriteria = { successRate: 1, timesUsed: -1 }; // Worst performing first
    } else {
      sortCriteria = { timesUsed: 1, successRate: -1, createdDate: -1 }; // Prefer less used, higher success, newer
    }

    // Execute query
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit))) : 20;
    const questions = await QuestionBank.find(query)
      .sort(sortCriteria)
      .limit(limitNum);

    // Format response
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question,
      correctAnswer: q.correctAnswer,
      questionType: q.questionType,
      targetConcepts: q.targetConcepts,
      difficulty: q.difficulty,
      timesUsed: q.timesUsed,
      successRate: q.successRate,
      lastUsed: q.lastUsed,
      source: q.source,
      createdDate: q.createdDate,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          questions: formattedQuestions,
          total: formattedQuestions.length,
          query: {
            conceptIds: conceptIds || null,
            mode: mode || null,
            filters: { difficulty, questionType },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/questions - Save new question (manual or generated)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    console.log("📝 Creating new question:", body.question?.substring(0, 50));
    const validatedData = createQuestionSchema.parse(body);

    // Use the enhanced service to save
    const savedQuestion = await QuestionBankService.saveQuestion({
      ...validatedData,
      id: uuidv4(), // Generate new ID for manual questions
    });

    if (!savedQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save question to database after multiple attempts",
        },
        { status: 500 }
      );
    }

    console.log("✅ Question created successfully:", savedQuestion.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedQuestion.id,
          question: savedQuestion.question,
          questionType: savedQuestion.questionType,
          targetConcepts: savedQuestion.targetConcepts,
          difficulty: savedQuestion.difficulty,
          source: savedQuestion.source,
          createdDate: savedQuestion.createdDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid question data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error creating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/questions - Update question (answer, performance, or both)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    console.log("🔄 Updating question:", body.id);
    const {
      id,
      correctAnswer,
      timesUsed,
      successRate,
      lastUsed,
      isCorrect,
      performanceOnly,
    } = updateQuestionSchema.parse(body);

    // Check if question exists
    const questionExists = await QuestionBankService.questionExists(id);
    if (!questionExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    let updateSuccess = false;
    const operations: string[] = [];

    // Update correct answer if provided and not performance-only update
    if (correctAnswer !== undefined && !performanceOnly) {
      const answerUpdateSuccess =
        await QuestionBankService.updateQuestionAnswer(id, correctAnswer);
      if (answerUpdateSuccess) {
        updateSuccess = true;
        operations.push("answer");
      }
    }

    // Handle performance updates
    if (isCorrect !== undefined) {
      // New way: update performance using isCorrect flag
      const perfUpdateSuccess =
        await QuestionBankService.updateQuestionPerformance(id, isCorrect);
      if (perfUpdateSuccess) {
        updateSuccess = true;
        operations.push("performance");
      }
    } else if (
      timesUsed !== undefined ||
      successRate !== undefined ||
      lastUsed !== undefined
    ) {
      // Legacy way: direct field updates
      try {
        interface UpdateFields {
          timesUsed?: number;
          successRate?: number;
          lastUsed?: Date;
        }

        const updateFields: UpdateFields = {};
        if (timesUsed !== undefined) updateFields.timesUsed = timesUsed;
        if (successRate !== undefined) updateFields.successRate = successRate;
        if (lastUsed !== undefined) updateFields.lastUsed = new Date(lastUsed);

        const result = await QuestionBank.updateOne(
          { id },
          { $set: updateFields }
        );

        if (result.modifiedCount > 0) {
          updateSuccess = true;
          operations.push("legacy-performance");
          console.log(`✅ Legacy performance update for question ${id}`);
        }
      } catch (error) {
        console.error(
          `❌ Legacy performance update failed for question ${id}:`,
          error
        );
      }
    }

    if (!updateSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "No updates were applied to the question",
        },
        { status: 400 }
      );
    }

    // Fetch updated question data
    const updatedQuestion = await QuestionBank.findOne({ id });
    if (!updatedQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found after update",
        },
        { status: 404 }
      );
    }

    console.log(
      `✅ Question ${id} updated successfully. Operations: ${operations.join(", ")}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedQuestion.id,
          timesUsed: updatedQuestion.timesUsed,
          successRate: updatedQuestion.successRate,
          lastUsed: updatedQuestion.lastUsed,
          correctAnswer: updatedQuestion.correctAnswer,
          operations,
        },
        message: `Question updated: ${operations.join(", ")}`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("❌ Error updating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/questions - Soft delete question (set isActive to false)
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Question ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🗑️ Soft deleting question:", id);

    const result = await QuestionBank.updateOne(
      { id },
      { $set: { isActive: false } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Question was already inactive",
        },
        { status: 400 }
      );
    }

    console.log(`✅ Question ${id} soft deleted successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Question deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete question",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/course/page.tsx
````typescript
// app/course/page.tsx (Updated with concept extraction)
"use client";

import { useState, useEffect } from "react";
import { AddCourse } from "@/components/Features/addCourse/AddCourse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Brain, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Course {
  courseId: number;
  date: string;
  keywords: string[];
  courseType: string;
  conceptExtractionStatus?: string;
  extractedConcepts?: string[];
}

const Course = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [extractingCourse, setExtractingCourse] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractConcepts = async (courseId: number) => {
    setExtractingCourse(courseId);
    try {
      const response = await fetch("/api/concepts/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh courses to show updated status
        await fetchCourses();
        // Optionally redirect to review page
        // window.location.href = `/concept-review?courseId=${courseId}`;
      } else {
        alert(`Failed to extract concepts: ${result.error}`);
      }
    } catch (error) {
      console.error("Error extracting concepts:", error);
      alert("Failed to extract concepts");
    } finally {
      setExtractingCourse(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="border-blue-600 text-blue-600">
            Ready for Review
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="default" className="bg-green-600">
            Concepts Added
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <Clock className="size-4 text-blue-600" />;
      case "reviewed":
        return <CheckCircle className="size-4 text-green-600" />;
      default:
        return <AlertCircle className="size-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Course Management
        </h1>
        <p className="text-center text-gray-600">
          Add courses and extract concepts for intelligent practice
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Add Course Section */}
        <div>
          <AddCourse />
        </div>

        {/* Existing Courses Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 size-5" />
                Existing Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p>Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Brain className="mx-auto mb-4 size-12 text-gray-300" />
                  <p>No courses yet. Add your first course to get started!</p>
                </div>
              ) : (
                <div className="max-h-96 space-y-4 overflow-y-auto">
                  {courses.map((course) => (
                    <Card
                      key={course.courseId}
                      className="border border-gray-200"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center">
                              <h3 className="font-semibold">
                                Course #{course.courseId}
                              </h3>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-sm text-gray-600">
                                {new Date(course.date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-3">
                              <p className="mb-1 text-sm text-gray-600">
                                Keywords:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {course.keywords
                                  .slice(0, 3)
                                  .map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                {course.keywords.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{course.keywords.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="mb-3 flex items-center space-x-2">
                              {getStatusIcon(course.conceptExtractionStatus)}
                              {getStatusBadge(course.conceptExtractionStatus)}
                              {course.extractedConcepts &&
                                course.extractedConcepts.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({course.extractedConcepts.length} concepts)
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {course.conceptExtractionStatus === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleExtractConcepts(course.courseId)
                              }
                              disabled={extractingCourse === course.courseId}
                              className="flex-1"
                            >
                              {extractingCourse === course.courseId ? (
                                <div className="flex items-center">
                                  <div className="mr-2 size-3 animate-spin rounded-full border-b-2 border-white"></div>
                                  Extracting...
                                </div>
                              ) : (
                                <>
                                  <Brain className="mr-1 size-3" />
                                  Extract Concepts
                                </>
                              )}
                            </Button>
                          )}

                          {course.conceptExtractionStatus === "completed" && (
                            <Link
                              href={`/concept-review?courseId=${course.courseId}`}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                Review Concepts
                              </Button>
                            </Link>
                          )}

                          {course.conceptExtractionStatus === "reviewed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="flex-1"
                            >
                              <CheckCircle className="mr-1 size-3" />
                              Completed
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {courses.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <Link href="/concept-review">
                    <Button variant="outline" className="w-full">
                      <Brain className="mr-2 size-4" />
                      Manage All Concepts
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Course;
````

## File: app/globals.css
````css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --gradient-background: linear-gradient(to bottom right, #121C84, #8278DA); /* Define the gradient */
    --gradient-bakground-card: linear-gradient(to bottom right, #FF3E9D, #0E1F40);
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;    
  }
}

.bg-gradient-custom {
  background-image: var(--gradient-background);
}

.bg-gradient-card {
  background-image: var(--gradient-background-card);
}
````

## File: app/practice-new/page.tsx
````typescript
// app/practice-new/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PracticeSelector } from "@/components/Features/practiceNew/PracticeSelector";
import { PracticeSession } from "@/components/Features/practiceNew/PracticeSession";
import { PracticeStats } from "@/components/Features/practiceNew/PracticeStats";
import { PracticeMode, QuestionType, QuestionLevel } from "@/lib/enum";

// Interface definitions matching what's expected in PracticeSession
interface Question {
  id: string;
  question: string;
  questionType: QuestionType;
  difficulty: QuestionLevel;
  targetConcepts: string[];
  options?: string[];
  correctAnswer?: string;
  context?: string;
  additionalInfo?: string;
}

interface SessionData {
  sessionId: string;
  conceptIds: string[];
  questions: Question[];
  metadata: {
    mode: PracticeMode;
    totalQuestions: number;
    conceptCount: number;
    rationale: string;
  };
}

export default function PracticeNewPage() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = async (mode: PracticeMode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/practice-new/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          userId: "default",
          maxQuestions: 10,
          maxConcepts: 5,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to start practice session");
        return;
      }

      setSelectedMode(mode);
      setSessionData(result.data);
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error starting practice session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionComplete = () => {
    setSelectedMode(null);
    setSessionData(null);
  };

  const handleBackToModes = () => {
    setSelectedMode(null);
    setSessionData(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          Polish Practice System
        </h1>
        <p className="text-gray-600">
          Intelligent concept-based learning with spaced repetition
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
              <button
                onClick={handleBackToModes}
                className="ml-4 text-sm underline"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedMode && !isLoading && (
        <>
          <PracticeStats />
          <PracticeSelector
            onModeSelect={handleModeSelect}
            isLoading={isLoading}
          />
        </>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p>Starting practice session...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMode && sessionData && !isLoading && (
        <PracticeSession
          mode={selectedMode}
          sessionData={sessionData}
          onComplete={handleSessionComplete}
          onBack={handleBackToModes}
        />
      )}
    </div>
  );
}
````

## File: components/Features/addCourse/AddCourse.tsx
````typescript
"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { validateAndSaveCourse } from "@/lib/LLMCourseValidation/courseValidation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CourseType } from "@/lib/enum"

const courseSchema = z.object({
  courseId: z.number().int().positive(),
  date: z.string(),
  keywords: z.string().min(1, "Keywords are required"),
  mainSubjects: z.string().optional(),
  courseType: z.nativeEnum(CourseType),
  newSubjects: z.string().optional(),
  reviewSubjects: z.string().optional(),
  weaknesses: z.string().optional(),
  strengths: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
  practice: z.string().min(1, "Practice is required"),
  homework: z.string().optional(),
  newWords: z.string().min(1, "New words are required"),
})

type CourseData = z.infer<typeof courseSchema>

export function AddCourse() {
  const [step, setStep] = useState(1)
  const [llmSuggestions, setLlmSuggestions] = useState<Partial<CourseData> | null>(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<keyof CourseData>>(new Set())

  const form = useForm<CourseData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseId: 1,
      date: new Date().toISOString().split("T")[0],
      keywords: "",
      courseType: CourseType.NEW,
      notes: "",
      practice: "",
      mainSubjects: "",
      newSubjects: "",
      reviewSubjects: "",
      weaknesses: "",
      strengths: "",
      homework: "",
      newWords: "",
    },
  })

  const onSubmit = async (data: CourseData) => {
    console.log("Submitting", data)
    if (step < 3) {
      setStep(step + 1)
    } else if (step === 3 && !llmSuggestions) {
      const result = await validateAndSaveCourse(data)
      if (result.suggestions) {
        setLlmSuggestions(result.suggestions)
      } else if (result.success) {
        form.reset()
        setStep(1)
        alert("Course added successfully!")
      } else {
        alert("Failed to add course. Please try again.")
      }
    } else {
      const result = await validateAndSaveCourse(data, true)
      if (result.success) {
        form.reset()
        setStep(1)
        setLlmSuggestions(null)
        setAcceptedSuggestions(new Set())
        alert("Course added successfully!")
      } else {
        alert("Failed to add course. Please try again.")
      }
    }
  }

  const goBack = () => {
    if (step === 3) {
      setLlmSuggestions(null)
      console.log("Resetting suggestions")
    }
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const applySuggestion = (key: keyof CourseData, value: string) => {
    form.setValue(key, value)
    setAcceptedSuggestions((prev) => {
      const newSet = new Set(prev)
      newSet.add(key)
      return newSet
    })
  }

  const ignoreSuggestion = (key: keyof CourseData) => {
    setAcceptedSuggestions((prev) => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
    })
  }

  const renderFormField = (name: keyof CourseData, label: string, required = false, type = "text") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea {...field} className="min-h-[100px]" />
            ) : type === "select" ? (
              <Controller
                name={name}
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CourseType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                type={type}
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  if (name === "courseId") {
                    field.onChange(Number.parseInt(e.target.value, 10))
                  } else {
                    field.onChange(e.target.value)
                  }
                }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CourseData)[] = []

    if (step === 1) {
      fieldsToValidate = [
        "courseId",
        "date",
        "keywords",
        "mainSubjects",
        "courseType",
        "newSubjects",
        "reviewSubjects",
        "weaknesses",
        "strengths",
      ]
    } else if (step === 2) {
      fieldsToValidate = ["notes", "practice", "homework", "newWords"]
    }

    if (step < 3) {
      const isValid = await form.trigger(fieldsToValidate)
      console.log("isValid", isValid)
      console.log("Form values:", form.getValues())
      console.log("Form errors:", form.formState.errors)
      if (isValid) {
        setStep(step + 1)
      }
    } else {
      form.handleSubmit(onSubmit)()
    }
  }

  return (
    <Card className="mx-auto mt-8 w-[800px]">
      <CardHeader>
        <CardTitle>Add New Course</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              {step === 1 && (
                <>
                  {renderFormField("courseId", "Course ID", true, "number")}
                  {renderFormField("date", "Date", true, "date")}
                  {renderFormField("keywords", "Keywords (comma-separated)", true)}
                  {renderFormField("mainSubjects", "Main Subjects (comma-separated)")}
                  {renderFormField("courseType", "Course Type", true, "select")}
                  {renderFormField("newSubjects", "New Subjects (comma-separated)")}
                  {renderFormField("reviewSubjects", "Review Subjects (comma-separated)")}
                  {renderFormField("weaknesses", "Weaknesses (comma-separated)")}
                  {renderFormField("strengths", "Strengths (comma-separated)")}
                </>
              )}

              {step === 2 && (
                <>
                  {renderFormField("notes", "Notes", true, "textarea")}
                  {renderFormField("practice", "Practice", true, "textarea")}
                  {renderFormField("homework", "Homework", false, "textarea")}
                  {renderFormField("newWords", "New Words (comma-separated)", true)}
                </>
              )}

              {step === 3 && (
                <div>
                  <h2 className="mb-4 text-xl font-bold">Review and Confirm</h2>
                  {Object.entries(form.getValues()).map(([key, value]) => {
                    const suggestion = llmSuggestions?.[key as keyof CourseData]
                    const isAccepted = acceptedSuggestions.has(key as keyof CourseData)
                    return (
                      <div key={key} className="mb-4 border-b pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <strong>{key}:</strong>
                            <div>{isAccepted ? suggestion : value}</div>
                          </div>
                          {suggestion && suggestion !== value && (
                            <div className="ml-4 flex flex-col items-end">
                              <div className="mb-1 text-sm text-gray-600">
                                {isAccepted ? "Original" : "Suggestion"}:
                              </div>
                              <div>{isAccepted ? value : suggestion}</div>
                              <div className="mt-2">
                                {isAccepted ? (
                                  <Button
                                    onClick={() => ignoreSuggestion(key as keyof CourseData)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Ignore
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => applySuggestion(key as keyof CourseData, String(suggestion))}
                                    size="sm"
                                  >
                                    Accept
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button type="button" onClick={goBack} variant="outline">
                  Previous
                </Button>
              )}
              <Button type="button" onClick={handleNextStep}>
                {step < 3 ? "Next" : llmSuggestions ? "Apply and Finalize" : "Finalize"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
````

## File: components/Features/practice/Practice.tsx
````typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateQuestion } from "@/lib/LLMPracticeValidation/generateQuestion";
import { validateAnswer } from "@/lib/LLMPracticeValidation/validateAnswer";
import type { ICourse } from "@/datamodels/course.model";
import type { IPracticeSession } from "@/datamodels/practice.model";
import type { IQuestionAnswer } from "@/datamodels/questionAnswer.model";
import { PracticeSummary } from "@/components/Features/practiceSummary/PracticeSummary";
import { QuestionLevel } from "@/lib/enum";

export function Practice() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [practiceSession, setPracticeSession] =
    useState<IPracticeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const generateNewQuestion = useCallback(async () => {
    if (!selectedCourse) return;
    const previousQuestions = practiceSession
      ? practiceSession.questionAnswers.map((qa) => qa.question)
      : [];
    const question = await generateQuestion(selectedCourse, previousQuestions);
    setCurrentQuestion(question);
    setUserAnswer("");
    setFeedback("");
    setShowAnswer(false);
    setAttempts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceSession]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      generateNewQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(
        data.sort(
          (a: ICourse, b: ICourse) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    } catch (err) {
      setError("Failed to load courses. Please try again later.");
      console.error("Error fetching courses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPracticeSession = async (course: ICourse) => {
    setSelectedCourse(course);
    const newSession: IPracticeSession = {
      courseId: course.courseId,
      startedAt: new Date(),
      completedAt: new Date(),
      questionAnswers: [],
      metrics: {
        vocabulary: { newWords: { attempted: 0, correct: 0, weakItems: [] } },
        grammar: { concepts: [] },
        accuracy: 0,
        avgResponseTime: 0,
      },
    };
    setPracticeSession(newSession);
  };

  const handleAnswerSubmit = async () => {
    if (!practiceSession || !selectedCourse) return;
    const startTime = Date.now();
    const result = await validateAnswer(
      currentQuestion,
      userAnswer,
      selectedCourse,
      attempts + 1
    );
    const endTime = Date.now();

    const newQuestionAnswer: IQuestionAnswer = {
      question: currentQuestion,
      correctAnswer: result.correctAnswer || "",
      userAnswers: [
        ...(practiceSession.questionAnswers.find(
          (qa) => qa.question === currentQuestion
        )?.userAnswers || []),
        userAnswer,
      ],
      keywords: result.keywords || [],
      category: result.category || "",
      questionType: result.questionType!,
      courseId: selectedCourse.courseId,
      analysisDetails: {
        mistakeType: result.analysisDetails?.mistakeType || null,
        confidence: result.analysisDetails?.confidence || 0,
        questionLevel:
          result.analysisDetails?.questionLevel ?? QuestionLevel.A1,
        responseTime: endTime - startTime,
      },
      isCorrect: result.isCorrect || false,
      feedback: result.feedback || "",
    };

    setPracticeSession((prev) => {
      if (!prev) return null;
      const updatedQuestionAnswers = [...prev.questionAnswers];
      const existingIndex = updatedQuestionAnswers.findIndex(
        (qa) => qa.question === currentQuestion
      );
      if (existingIndex !== -1) {
        updatedQuestionAnswers[existingIndex] = newQuestionAnswer;
      } else {
        updatedQuestionAnswers.push(newQuestionAnswer);
      }
      return {
        ...prev,
        questionAnswers: updatedQuestionAnswers,
      };
    });

    setFeedback(result.feedback || "");
    setAttempts((prev) => prev + 1);
    setShowAnswer(true);
  };

  const endPracticeSession = async () => {
    if (!practiceSession || !selectedCourse) return;
    const completedSession = {
      ...practiceSession,
      completedAt: new Date(),
    };
    const updatedSession = await calculateMetrics(completedSession);
    console.log("Updated session:", updatedSession);
    const saveResult = await savePracticeSession(updatedSession);
    setShowSummary(true);
    setSaveStatus(
      saveResult.success
        ? "Practice session saved successfully!"
        : "Failed to save practice session."
    );
  };

  const calculateMetrics = async (session: IPracticeSession) => {
    const updatedSession = { ...session };
    updatedSession.metrics.accuracy =
      session.questionAnswers.filter((qa) => qa.isCorrect).length /
      session.questionAnswers.length;
    updatedSession.metrics.avgResponseTime =
      session.questionAnswers.reduce(
        (sum, qa) => sum + qa.analysisDetails.responseTime,
        0
      ) / session.questionAnswers.length;
    return updatedSession;
  };

  const savePracticeSession = async (session: IPracticeSession) => {
    try {
      const response = await fetch("/api/practice-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error("Failed to save practice session");
      }

      const data = await response.json();
      console.log("Practice session saved:", data);
      return { success: true };
    } catch (error) {
      console.error("Error saving practice session:", error);
      return { success: false };
    }
  };

  const goToCourses =async () => {
    setSelectedCourse(null);
    setPracticeSession(null);
    setShowSummary(false);
    setSaveStatus(null);
    await fetchCourses();
  };

  return (
    <Card className="mx-auto mt-8 w-[800px]">
      <CardHeader>
        <CardTitle>
          {selectedCourse ? "Practice Session" : "Course Dashboard"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          {showSummary ? (
            <>
              <PracticeSummary session={practiceSession!} />
              {saveStatus && (
                <p className="mt-4 text-center font-bold">{saveStatus}</p>
              )}
              <Button onClick={goToCourses} className="mt-4 w-full">
                Go to Courses
              </Button>
            </>
          ) : isLoading ? (
            <div>Loading courses...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !selectedCourse ? (
            courses.length > 0 ? (
              courses.map((course) => (
                <Button
                  key={course.courseId}
                  onClick={() => startPracticeSession(course)}
                  className="mb-2 w-full justify-start"
                >
                  {course.courseType} -{" "}
                  {new Date(course.date).toLocaleDateString()} - Course ID:{" "}
                  {course.courseId} - Fluency: {course.fluency} - Practices:{" "}
                  {course.numberOfPractices}
                </Button>
              ))
            ) : (
              <div>
                No courses available. Add some courses to start practicing!
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="my-4 rounded border border-blue-300 bg-blue-100 p-4 text-center text-2xl text-gray-800 shadow-md">
                {currentQuestion}
              </div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full rounded border p-2"
                rows={4}
              />
              <div>{feedback}</div>
              <div>Attempts: {attempts}/3</div>
              {showAnswer && attempts === 3 && (
                <div>
                  <strong>Correct Answer:</strong>{" "}
                  {
                    practiceSession?.questionAnswers[
                      practiceSession.questionAnswers.length - 1
                    ].correctAnswer
                  }
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswer || attempts >= 3}
                >
                  Submit Answer
                </Button>
                <Button onClick={generateNewQuestion}>Next Question</Button>
              </div>
            </div>
          )}
        </ScrollArea>
        {selectedCourse && !showSummary && (
          <Button onClick={endPracticeSession} className="mt-4 w-full">
            End Practice Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
````

## File: components/Features/practiceNew/PracticeSession.tsx
````typescript
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  PracticeMode,
  QuestionType,
  QuestionLevel,
  CourseType,
} from "@/lib/enum";
import { validateAnswer } from "@/lib/LLMPracticeValidation/validateAnswer";
import { IQuestionBank } from "@/datamodels/questionBank.model";
import { ICourse } from "@/datamodels/course.model";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  questionType: string;
  difficulty: string;
  targetConcepts: string[];
  correctAnswer?: string; // This might be empty for newly generated questions
}

interface SessionData {
  sessionId: string;
  conceptIds: string[];
  questions: Question[];
  metadata: {
    mode: PracticeMode;
    totalQuestions: number;
    conceptCount: number;
    rationale: string;
  };
}

interface PracticeSessionProps {
  mode: PracticeMode;
  sessionData: SessionData;
  onComplete: () => void;
  onBack: () => void;
}

interface QuestionResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  attempts: number;
  responseTime: number;
}

export function PracticeSession({
  mode,
  sessionData,
  onComplete,
  onBack,
}: PracticeSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [sessionResults, setSessionResults] = useState<QuestionResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now()
  );
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentQuestion = sessionData.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + (questionResult ? 1 : 0)) /
      sessionData.questions.length) *
    100;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setValidationError(null);
  }, [currentQuestionIndex]);

  // Enhanced Question Bank Service
  class QuestionBankService {
    static async saveQuestion(
      questionData: Partial<IQuestionBank>
    ): Promise<IQuestionBank | null> {
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `Saving question attempt ${attempt}:`,
            questionData.question?.substring(0, 50)
          );

          const response = await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          if (result.success) {
            console.log(`✅ Question saved successfully: ${result.data.id}`);
            return result.data;
          } else {
            throw new Error(result.error || "Failed to save question");
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Save attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      console.error(
        `Failed to save question after ${maxRetries} attempts:`,
        lastError
      );
      return null;
    }

    static async updateQuestionAnswer(
      questionId: string,
      correctAnswer: string
    ): Promise<boolean> {
      try {
        const response = await fetch("/api/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: questionId,
            correctAnswer,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update question: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ Question ${questionId} updated with correct answer`);
        return result.success;
      } catch (error) {
        console.error(`❌ Failed to update question ${questionId}:`, error);
        return false;
      }
    }

    static async updateQuestionPerformance(
      questionId: string,
      isCorrect: boolean
    ): Promise<boolean> {
      try {
        const response = await fetch("/api/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: questionId,
            isCorrect,
            performanceOnly: true,
          }),
        });

        if (!response.ok) {
          console.error(
            `Failed to update question performance: ${response.status}`
          );
          return false;
        }

        const result = await response.json();
        if (result.success) {
          console.log(`✅ Question ${questionId} performance updated`);
          return true;
        }
        return false;
      } catch (error) {
        console.error(`❌ Error updating question performance:`, error);
        return false;
      }
    }

    static async questionExists(questionId: string): Promise<boolean> {
      try {
        const response = await fetch(`/api/questions?questionId=${questionId}`);
        if (!response.ok) {
          return false;
        }
        const result = await response.json();
        return result.success;
      } catch (error) {
        console.error(`❌ Error checking question existence:`, error);
        return false;
      }
    }
  }

  const updateConceptProgress = async (
    conceptId: string,
    isCorrect: boolean,
    responseTime: number
  ) => {
    try {
      const response = await fetch("/api/practice-new/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          questionId: currentQuestion.id,
          isCorrect,
          responseTime,
          userId: "default",
          sessionId: sessionData.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating concept progress:", error);
      throw error;
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isValidating) return;

    setIsValidating(true);
    setValidationError(null);
    const responseTime = Date.now() - questionStartTime;

    try {
      const mockCourse: ICourse = {
        courseId: 0,
        date: new Date(),
        courseType: CourseType.NEW,
        notes: `Concepts: ${currentQuestion.targetConcepts.join(", ")}`,
        practice: currentQuestion.question,
        keywords: currentQuestion.targetConcepts,
        newWords: [],
      };

      const attempts = (questionResult?.attempts || 0) + 1;
      const result = await validateAnswer(
        currentQuestion.question,
        userAnswer,
        mockCourse,
        attempts
      );

      const newResult: QuestionResult = {
        isCorrect: result.isCorrect || false,
        feedback: result.feedback || "No feedback provided",
        correctAnswer: result.correctAnswer || "",
        attempts,
        responseTime,
      };

      setQuestionResult(newResult);

      // Check if question exists and update accordingly
      const questionExists = await QuestionBankService.questionExists(
        currentQuestion.id
      );

      if (questionExists) {
        // Question exists in bank - update correct answer if we got one
        if (newResult.correctAnswer && newResult.correctAnswer.trim()) {
          const updateSuccess = await QuestionBankService.updateQuestionAnswer(
            currentQuestion.id,
            newResult.correctAnswer
          );

          if (updateSuccess) {
            console.log(
              `✅ Updated question ${currentQuestion.id} with correct answer`
            );
          }
        }

        // Update performance metrics
        const perfUpdateSuccess =
          await QuestionBankService.updateQuestionPerformance(
            currentQuestion.id,
            newResult.isCorrect
          );

        if (perfUpdateSuccess) {
          console.log(
            `✅ Updated performance for question ${currentQuestion.id}`
          );
        }
      } else {
        // Question doesn't exist - this shouldn't happen but let's handle it
        console.warn(
          `⚠️ Question ${currentQuestion.id} not found in bank during answer submission`
        );

        // Try to save it now
        const questionData: Partial<IQuestionBank> = {
          id: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: newResult.correctAnswer,
          questionType: currentQuestion.questionType as QuestionType,
          targetConcepts: currentQuestion.targetConcepts,
          difficulty: currentQuestion.difficulty as QuestionLevel,
          source: "generated",
        };

        const saved = await QuestionBankService.saveQuestion(questionData);
        if (saved) {
          console.log(
            `✅ Retroactively saved question ${currentQuestion.id} to bank`
          );
        }
      }

      // Update concept progress
      for (const conceptId of currentQuestion.targetConcepts) {
        try {
          await updateConceptProgress(
            conceptId,
            newResult.isCorrect,
            responseTime
          );
        } catch (error) {
          console.error(
            `❌ Failed to update progress for concept ${conceptId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("❌ Error validating answer:", error);
      setValidationError("Failed to validate your answer. Please try again.");
      setQuestionResult({
        isCorrect: false,
        feedback:
          "There was an error checking your answer. Please try submitting again.",
        correctAnswer: "",
        attempts: 1,
        responseTime,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextQuestion = () => {
    if (questionResult) {
      setSessionResults([...sessionResults, questionResult]);
    }

    if (currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setQuestionResult(null);
      setValidationError(null);
      setQuestionStartTime(Date.now());
    } else {
      // Session complete
      setIsSessionComplete(true);
    }
  };

  const handleRetryQuestion = () => {
    setUserAnswer("");
    setQuestionResult(null);
    setValidationError(null);
    setQuestionStartTime(Date.now());
  };

  if (isSessionComplete) {
    const finalResults = questionResult
      ? [...sessionResults, questionResult]
      : sessionResults;
    const correctCount = finalResults.filter((r) => r.isCorrect).length;
    const accuracy =
      finalResults.length > 0 ? (correctCount / finalResults.length) * 100 : 0;

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="text-4xl font-bold text-green-600">
              {Math.round(accuracy)}%
            </div>
            <p className="text-lg">
              {correctCount} out of {finalResults.length} questions correct
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionData.metadata.conceptCount}
                </div>
                <p className="text-sm text-gray-600">Concepts Practiced</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {finalResults.length > 0
                    ? Math.round(
                        finalResults.reduce(
                          (sum, r) => sum + r.responseTime,
                          0
                        ) /
                          finalResults.length /
                          1000
                      )
                    : 0}
                  s
                </div>
                <p className="text-sm text-gray-600">Avg. Response Time</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Session Details:</h3>
            <p className="text-sm text-gray-600">
              {sessionData.metadata.rationale}
            </p>
            <p className="text-sm text-gray-600">
              Mode:{" "}
              {mode === PracticeMode.NORMAL
                ? "Smart Practice"
                : mode === PracticeMode.PREVIOUS
                  ? "Previous Questions"
                  : "Drill Session"}
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1">
              New Session
            </Button>
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto mb-2 size-8" />
            <p>No questions available for this session.</p>
            <Button onClick={onBack} className="mt-4">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of{" "}
              {sessionData.questions.length}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">
              {currentQuestion.difficulty}
            </span>
            <span className="rounded bg-blue-100 px-2 py-1">
              {currentQuestion.questionType}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer in Polish..."
            className="min-h-[100px]"
            disabled={isValidating || !!questionResult}
          />

          {validationError && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="mt-0.5 size-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">Validation Error</p>
                    <p className="text-sm text-red-700">{validationError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {questionResult && (
            <Card
              className={`border-2 ${questionResult.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  {questionResult.isCorrect ? (
                    <CheckCircle className="mt-0.5 size-5 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 text-red-600" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p
                      className={`font-medium ${questionResult.isCorrect ? "text-green-800" : "text-red-800"}`}
                    >
                      {questionResult.isCorrect
                        ? "Correct!"
                        : "Not quite right"}
                    </p>
                    {questionResult.feedback && (
                      <p className="text-sm text-gray-700">
                        {questionResult.feedback}
                      </p>
                    )}
                    {!questionResult.isCorrect &&
                      questionResult.correctAnswer && (
                        <p className="text-sm">
                          <strong>Correct answer:</strong>{" "}
                          {questionResult.correctAnswer}
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            {!questionResult ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isValidating}
                className="flex-1"
              >
                {isValidating ? (
                  <div className="flex items-center">
                    <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Checking...
                  </div>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            ) : (
              <>
                {!questionResult.isCorrect && questionResult.attempts < 3 && (
                  <Button
                    variant="outline"
                    onClick={handleRetryQuestion}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                )}
                <Button onClick={handleNextQuestion} className="flex-1">
                  {currentQuestionIndex < sessionData.questions.length - 1
                    ? "Next Question"
                    : "Complete Session"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
````

## File: components/ui/progress.tsx
````typescript
// components/ui/progress.tsx
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="size-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
````

## File: components/ui/scroll-area.tsx
````typescript
"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
````

## File: components/ui/select.tsx
````typescript
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
````

## File: data/polishTimeQuizDB.json
````json
[
  {
    "question": "Write this time in Polish: 15:21",
    "time": "15:21",
    "answer": {
      "format": "HH:mm",
      "informal": "piątnasta dwudzieścia jeden",
      "comment": "Odpowiedź zawiera błąd w formie godzinnej. Należy użyć poprawnej formy żeńskiej liczby porządkowej. Zgodnie z zasadami, właściwy zapis czasu w formacie formalnym to 'piętnasta dwadzieścia jeden'. W przypadku formatu nieformalnego powinno być 'dwudziesta jedna po piętnastej'."
    }
  },
  {
    "question": "Write this time in Polish:",
    "time": "15:21",
    "answer": {
      "formal": "piętnasta dwadzieścia jeden",
      "informal": "dwudziesta jedna po piętnastej",
      "comment": "Dobrze odpowiedziałeś! Twoja odpowiedź w formalnym formacie jest poprawna. Alternatywnie, odpowiedź mogłaby brzmieć: 'dwudziesta jedna po piętnastej' jako formie nieformalnej."
    }
  },
  {
    "question": "Write this time in Polish:",
    "time": "15:30",
    "answer": {
      "formal": "piętnasta trzydzieści",
      "informal": "wpół do czwartej",
      "comment": "Brawo! Twoja odpowiedź jest poprawna w formacie nieformalnym 'wpół do czwartej'. Dla informacji, w formacie formalnym czas ten to 'piętnasta trzydzieści'."
    }
  }
]
````

## File: datamodels/concept.model.ts
````typescript
import { Schema, model, models } from "mongoose";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a learning concept
 * @interface IConcept
 */
export interface IConcept {
  id: string;
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  prerequisites: string[];
  relatedConcepts: string[];
  difficulty: QuestionLevel;
  isActive: boolean;
  confidence: number; // 0-1 extraction confidence
  createdFrom: string[]; // source course IDs
  lastUpdated: Date;
}

const ConceptSchema = new Schema<IConcept>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: Object.values(ConceptCategory),
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    examples: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    relatedConcepts: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    createdFrom: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
ConceptSchema.index({ name: 1, category: 1 }, { unique: true });
ConceptSchema.index({ difficulty: 1, isActive: 1 });
ConceptSchema.index({ createdFrom: 1 });

const Concept = models?.Concept || model<IConcept>("Concept", ConceptSchema);

export default Concept;
````

## File: datamodels/conceptIndex.model.ts
````typescript
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConcept } from "./concept.model";

/**
 * Lightweight model for LLM operations with concepts
 * No MongoDB schema needed - this is computed/cached data
 * Will be generated from full Concept documents
 * @interface IConceptIndex
 */
export interface IConceptIndex {
  conceptId: string;
  name: string;
  category: ConceptCategory;
  description: string; // brief only, no examples
  difficulty: QuestionLevel;
  isActive: boolean;
}

/**
 * Export a function to create a concept index from a full concept
 * Used for generating lightweight representations for LLM operations
 * @param concept Full concept document
 * @returns Lightweight concept index
 */
export const createConceptIndex = (concept: IConcept): IConceptIndex => {
  return {
    conceptId: concept.id,
    name: concept.name,
    category: concept.category,
    description: concept.description,
    difficulty: concept.difficulty,
    isActive: concept.isActive,
  };
};

/**
 * Utility function to create concept indexes in bulk
 * @param concepts Array of full concept documents
 * @returns Array of lightweight concept indexes
 */
export const createConceptIndexes = (concepts: IConcept[]): IConceptIndex[] => {
  return concepts.map(createConceptIndex);
};
````

## File: datamodels/conceptProgress.model.ts
````typescript
import { Schema, model, models } from "mongoose";

/**
 * Interface representing a user's progress on a concept
 * @interface IConceptProgress
 */
export interface IConceptProgress {
  userId: string; // for future multi-user support
  conceptId: string;
  masteryLevel: number; // 0-1 scale
  lastPracticed: Date;
  nextReview: Date; // SRS calculation
  successRate: number; // 0-1 based on performance
  totalAttempts: number;
  consecutiveCorrect: number;
  easinessFactor: number; // SRS parameter (1.3-2.5)
  intervalDays: number; // SRS parameter
  isActive: boolean;
}

const ConceptProgressSchema = new Schema<IConceptProgress>(
  {
    userId: {
      type: String,
      required: true,
    },
    conceptId: {
      type: String,
      required: true,
      ref: "Concept",
    },
    masteryLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0,
    },
    lastPracticed: {
      type: Date,
      default: null,
    },
    nextReview: {
      type: Date,
      default: Date.now,
      index: true,
    },
    successRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    consecutiveCorrect: {
      type: Number,
      min: 0,
      default: 0,
    },
    easinessFactor: {
      type: Number,
      min: 1.3,
      max: 2.5,
      default: 2.5,
    },
    intervalDays: {
      type: Number,
      min: 0,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index on userId + conceptId
ConceptProgressSchema.index({ userId: 1, conceptId: 1 }, { unique: true });

// Index for due date queries
ConceptProgressSchema.index({ nextReview: 1, isActive: 1 });
ConceptProgressSchema.index({ masteryLevel: 1 });
ConceptProgressSchema.index({ conceptId: 1 });

const ConceptProgress =
  models?.ConceptProgress ||
  model<IConceptProgress>("ConceptProgress", ConceptProgressSchema);

export default ConceptProgress;
````

## File: datamodels/courseConcept.model.ts
````typescript
import { Schema, model, models } from "mongoose";

/**
 * Interface representing a mapping between a course and a concept
 * @interface ICourseConcept
 */
export interface ICourseConcept {
  courseId: number;
  conceptId: string;
  extractedDate: Date;
  confidence: number; // 0-1 extraction confidence
  isActive: boolean;
  sourceContent: string; // where in course this was found
}

const CourseConceptSchema = new Schema<ICourseConcept>(
  {
    courseId: {
      type: Number,
      required: true,
      ref: "Course",
    },
    conceptId: {
      type: String,
      required: true,
      ref: "Concept",
    },
    extractedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sourceContent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for uniqueness
CourseConceptSchema.index({ courseId: 1, conceptId: 1 }, { unique: true });

// Create index for reverse lookups
CourseConceptSchema.index({ conceptId: 1 });
CourseConceptSchema.index({ isActive: 1 });

const CourseConcept =
  models?.CourseConcept ||
  model<ICourseConcept>("CourseConcept", CourseConceptSchema);

export default CourseConcept;
````

## File: datamodels/questionAnswer.model.ts
````typescript
import { Schema, model, models } from "mongoose"
import { QuestionType, MistakeType, QuestionLevel } from "@/lib/enum"

export interface IQuestionAnswer {
  question: string
  correctAnswer: string
  userAnswers: string[]
  keywords: string[]
  category: string
  questionType: QuestionType
  courseId: number
  analysisDetails: {
    mistakeType: MistakeType | null
    confidence: number
    questionLevel: QuestionLevel
    responseTime: number
  }
  isCorrect: boolean
  feedback: string
  
  // NEW: Concept integration
  conceptId?: string // primary concept this question targets
  targetConcepts?: string[] // all concepts this question addresses
}

const QuestionAnswerSchema = new Schema<IQuestionAnswer>({
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  userAnswers: { type: [String], required: true },
  keywords: { type: [String], required: true },
  category: { type: String, required: true },
  questionType: { type: String, enum: Object.values(QuestionType), required: true },
  courseId: { type: Number, required: true },
  analysisDetails: {
    mistakeType: { type: String, enum: Object.values(MistakeType), required: false },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    questionLevel: { type: String, enum: Object.values(QuestionLevel), required: true },
    responseTime: { type: Number, required: true, min: 0 },
  },
  isCorrect: { type: Boolean, required: true },
  feedback: { type: String, required: true },
  
  // NEW: Concept integration
  conceptId: { type: String, ref: "Concept" },
  targetConcepts: { type: [String], default: [], ref: "Concept" },
})

const QuestionAnswer = models?.QuestionAnswer || model<IQuestionAnswer>("QuestionAnswer", QuestionAnswerSchema)

export default QuestionAnswer
````

## File: eslint.config.mjs
````
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "standard",
    "plugin:tailwindcss/recommended",
    "prettier"
  ),
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Built-in types are first
            "external", // External libraries
            "internal", // Internal modules
            ["parent", "sibling"], // Parent and sibling types can be mingled together
            "index", // Then the index file
            "object" // Object imports
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              pattern: "@app/**",
              group: "external",
              position: "after"
            }
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-duplicates": "error"
    },
    ignores: ["components/ui/**"],
    files: ["*.ts", "*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    linterOptions: {
      noInlineConfig: false
    }
  }
];

export default eslintConfig;
````

## File: lib/conceptExtraction/conceptExtractor.ts
````typescript
import { ConceptManager } from "./conceptManager";
import { ConceptLLMService } from "./conceptLLM";
import {
  ConceptReviewData,
  ExtractionResult,
  SimilarityMatch,
  ExtractedConcept,
  ConceptExtractionError,
} from "./types";
import { ConceptExtractionStatus } from "@/lib/enum";
import Course from "@/datamodels/course.model";
import type { ICourse } from "@/datamodels/course.model";
import { v4 as uuidv4 } from "uuid";

/**
 * Main orchestrator for concept extraction process
 */
export class ConceptExtractor {
  private conceptManager: ConceptManager;
  private llmService: ConceptLLMService;
  private extractionCache: Map<number, ConceptReviewData> = new Map();

  /**
   * Initialize with optional services for dependency injection
   * @param conceptManager Optional concept manager implementation
   * @param llmService Optional LLM service implementation
   */
  constructor(conceptManager?: ConceptManager, llmService?: ConceptLLMService) {
    this.conceptManager = conceptManager || new ConceptManager();
    this.llmService = llmService || new ConceptLLMService();
  }

  /**
   * Extract concepts from a course and prepare for review
   * @param courseId ID of the course to extract concepts from
   * @returns Result of the extraction process
   */
  async extractConceptsFromCourse(courseId: number): Promise<ExtractionResult> {
    try {
      // 1. Fetch course data with validation
      const course = await this.fetchAndValidateCourse(courseId);

      // 2. Extract concepts using LLM
      const extractedConcepts = await this.llmService.extractConceptsFromCourse(
        {
          keywords: course.keywords,
          notes: course.notes,
          practice: course.practice,
          newWords: course.newWords,
          homework: course.homework,
        }
      );

      // 3. Check similarity against existing concepts
      const similarityMatches =
        await this.findSimilaritiesForAll(extractedConcepts);

      // 4. Update course with extraction status
      await this.updateCourseExtractionStatus(courseId, extractedConcepts);

      // 5. Prepare review data
      const extractionId = uuidv4();
      const reviewData: ConceptReviewData = {
        courseId,
        courseName: `Course ${courseId} - ${course.keywords.join(", ")}`,
        extractedConcepts,
        similarityMatches,
        totalExtracted: extractedConcepts.length,
        highConfidenceCount: extractedConcepts.filter((c) => c.confidence > 0.8)
          .length,
      };

      // Cache the review data
      this.extractionCache.set(courseId, reviewData);

      return {
        success: true,
        data: reviewData,
        extractionId,
      };
    } catch (error) {
      console.error("Concept extraction failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown extraction error",
      };
    }
  }

  /**
   * Fetch a course and validate required fields
   * @param courseId ID of the course to fetch
   * @returns Course data
   */
  private async fetchAndValidateCourse(courseId: number): Promise<ICourse> {
    // Fetch course from database
    const course = await Course.findOne({ courseId });

    if (!course) {
      throw new ConceptExtractionError(`Course with ID ${courseId} not found`);
    }

    // Validate required fields
    if (!course.notes || !course.practice || !course.keywords) {
      throw new ConceptExtractionError(
        `Course ${courseId} is missing required fields (notes, practice, or keywords)`
      );
    }

    return course.toObject();
  }

  /**
   * Find similarities for all extracted concepts
   * @param extractedConcepts Array of extracted concepts
   * @returns Map of concept name to similarity matches
   */
  private async findSimilaritiesForAll(
    extractedConcepts: ExtractedConcept[]
  ): Promise<Map<string, SimilarityMatch[]>> {
    const similarityMap = new Map<string, SimilarityMatch[]>();

    // Get the concept index once to avoid repeated fetches
    const conceptIndex = await this.conceptManager.getConceptIndex();

    // Process concepts in small batches to handle rate limiting
    const batchSize = 3;
    for (let i = 0; i < extractedConcepts.length; i += batchSize) {
      const batch = extractedConcepts.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (concept) => {
        try {
          // Only check similarity if there are existing concepts
          if (conceptIndex.length > 0) {
            const matches = await this.llmService.checkConceptSimilarity(
              concept,
              conceptIndex
            );
            similarityMap.set(concept.name, matches);
          } else {
            similarityMap.set(concept.name, []);
          }
        } catch (error) {
          console.error(
            `Error finding similarities for concept "${concept.name}":`,
            error
          );
          similarityMap.set(concept.name, []);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < extractedConcepts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return similarityMap;
  }

  /**
   * Update course extraction status in the database
   * @param courseId ID of the course
   * @param extractedConcepts Array of extracted concepts
   */
  private async updateCourseExtractionStatus(
    courseId: number,
    extractedConcepts: ExtractedConcept[]
  ): Promise<void> {
    try {
      await Course.updateOne(
        { courseId },
        {
          $set: {
            conceptExtractionStatus: ConceptExtractionStatus.COMPLETED,
            conceptExtractionDate: new Date(),
            extractedConcepts: extractedConcepts.map((c) => c.name),
          },
        }
      );
    } catch (error) {
      console.error(
        `Failed to update extraction status for course ${courseId}:`,
        error
      );
      // Non-fatal error, don't throw
    }
  }

  /**
   * Get review data for a course
   * @param courseId ID of the course
   * @returns Review data or null if not found
   */
  async prepareReviewData(courseId: number): Promise<ConceptReviewData | null> {
    // Check cache first
    if (this.extractionCache.has(courseId)) {
      return this.extractionCache.get(courseId) || null;
    }

    // If not in cache, check if course has been extracted
    const course = await Course.findOne({
      courseId,
      conceptExtractionStatus: ConceptExtractionStatus.COMPLETED,
    });

    if (!course) {
      return null;
    }

    // Re-extract concepts to rebuild review data
    const extractionResult = await this.extractConceptsFromCourse(courseId);
    return extractionResult.data || null;
  }

  /**
   * Apply reviewed concepts to the database with enhanced duplicate handling
   * @param courseId ID of the course
   * @param approvedConcepts Array of reviewed and approved concepts
   * @returns Success status and count of concepts created
   */
  async applyReviewedConcepts(
    courseId: number,
    approvedConcepts: Array<{
      concept: ExtractedConcept;
      action: "create" | "merge";
      mergeWithId?: string;
    }>
  ): Promise<{
    success: boolean;
    created: number;
    merged: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      created: 0,
      merged: 0,
      errors: [] as string[],
    };

    try {
      // Get course data
      const course = await Course.findOne({ courseId });
      if (!course) {
        throw new ConceptExtractionError(
          `Course with ID ${courseId} not found`
        );
      }

      // Process each approved concept
      for (const { concept, action, mergeWithId } of approvedConcepts) {
        try {
          if (action === "create") {
            // Use createOrFindConcept to handle potential duplicates gracefully
            const newConcept = await this.conceptManager.createOrFindConcept({
              id: uuidv4(),
              name: concept.name,
              category: concept.category,
              description: concept.description,
              examples: concept.examples,
              difficulty: concept.suggestedDifficulty,
              confidence: concept.confidence,
              createdFrom: [courseId.toString()],
              isActive: true,
              lastUpdated: new Date(),
            });

            // Link to course
            await this.conceptManager.linkConceptToCourse(
              newConcept.id,
              courseId,
              concept.confidence,
              concept.sourceContent
            );

            results.created++;
            console.log(`Successfully processed concept: ${concept.name}`);
          } else if (action === "merge" && mergeWithId) {
            // Add course to existing concept's createdFrom list
            const existingConcept =
              await this.conceptManager.getConcept(mergeWithId);
            if (existingConcept) {
              const createdFrom = [...(existingConcept.createdFrom || [])];
              if (!createdFrom.includes(courseId.toString())) {
                createdFrom.push(courseId.toString());
                await this.conceptManager.updateConcept(mergeWithId, {
                  createdFrom,
                  lastUpdated: new Date(),
                });
              }

              // Link to course
              await this.conceptManager.linkConceptToCourse(
                mergeWithId,
                courseId,
                concept.confidence,
                concept.sourceContent
              );

              results.merged++;
            } else {
              results.errors.push(
                `Concept with ID ${mergeWithId} not found for merging`
              );
            }
          }
        } catch (error) {
          const errorMessage = `Error processing concept "${concept.name}": ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);

          // Don't fail the entire operation for individual concept errors
          // Continue processing remaining concepts
        }
      }

      // Update course status to REVIEWED only if we had some success
      if (results.created > 0 || results.merged > 0) {
        try {
          await Course.updateOne(
            { courseId },
            {
              $set: {
                conceptExtractionStatus: ConceptExtractionStatus.REVIEWED,
              },
            }
          );
          console.log(`Updated course ${courseId} status to REVIEWED`);
        } catch (statusError) {
          console.error(`Failed to update course status:`, statusError);
          results.errors.push("Failed to update course status");
        }
      }

      // Clear cache for this course
      this.extractionCache.delete(courseId);

      // Set success to false only if we had no successes and errors
      if (
        results.created === 0 &&
        results.merged === 0 &&
        results.errors.length > 0
      ) {
        results.success = false;
      }

      console.log(`Concept application results:`, {
        courseId,
        created: results.created,
        merged: results.merged,
        errors: results.errors.length,
      });

      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(
        `Failed to apply reviewed concepts: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error("Critical error in applyReviewedConcepts:", error);
      return results;
    }
  }
}

/**
 * Factory function for dependency injection
 * @param conceptManager Optional concept manager implementation
 * @param llmService Optional LLM service implementation
 * @returns ConceptExtractor instance
 */
export function createConceptExtractor(
  conceptManager?: ConceptManager,
  llmService?: ConceptLLMService
): ConceptExtractor {
  return new ConceptExtractor(conceptManager, llmService);
}
````

## File: lib/conceptExtraction/conceptManagerExtensions.ts
````typescript
// Import only what's needed
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { ConceptCategory } from "@/lib/enum";
import ConceptModel, { IConcept } from "@/datamodels/concept.model";

// Add type declaration to extend ConceptManager's prototype
declare module "@/lib/conceptExtraction/conceptManager" {
  interface ConceptManager {
    getConceptsPaginated(options: {
      page?: number;
      limit?: number;
      category?: ConceptCategory | null;
      isActive?: boolean;
    }): Promise<{
      success: boolean;
      data: IConcept[];
      total: number;
      error?: string;
    }>;

    getConceptCount(query: {
      isActive?: boolean;
      category?: ConceptCategory | null;
    }): Promise<number>;

    getConceptsWithQuery(
      query: {
        isActive?: boolean;
        category?: ConceptCategory | null;
      },
      skip: number,
      limit: number
    ): Promise<IConcept[]>;
  }
}

// This is a helper file that extends the ConceptManager with methods for pagination and filtering

// Extend the ConceptManager with a new method for paginated concepts with filters
ConceptManager.prototype.getConceptsPaginated = async function (options: {
  page?: number;
  limit?: number;
  category?: ConceptCategory | null;
  isActive?: boolean;
}) {
  const { page = 1, limit = 20, category = null, isActive = true } = options;

  try {
    // Build query based on filters
    const query: {
      isActive?: boolean;
      category?: ConceptCategory | null;
    } = {};

    // Filter by active status
    if (isActive !== null) {
      query.isActive = isActive;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Get total count for pagination
    const total = await this.getConceptCount(query);

    // Get paginated data
    const skip = (page - 1) * limit;
    const concepts = await this.getConceptsWithQuery(query, skip, limit);

    return {
      success: true,
      data: concepts,
      total,
    };
  } catch (error) {
    console.error("Error fetching paginated concepts:", error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Helper method to get count of concepts matching query
ConceptManager.prototype.getConceptCount = async function (query: {
  isActive?: boolean;
  category?: ConceptCategory | null;
}) {
  return await ConceptModel.countDocuments(query);
};

// Helper method to get concepts matching query with pagination
ConceptManager.prototype.getConceptsWithQuery = async function (
  query: {
    isActive?: boolean;
    category?: ConceptCategory | null;
  },
  skip: number,
  limit: number
) {
  const concepts = await ConceptModel.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return concepts.map((concept) => concept.toObject());
};
````

## File: lib/conceptExtraction/types.ts
````typescript
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

/**
 * Represents a concept extracted from course content
 */
export interface ExtractedConcept {
  name: string;
  category: ConceptCategory;
  description: string;
  examples: string[];
  sourceContent: string; // where in course this was found
  confidence: number; // 0-1 LLM confidence
  suggestedDifficulty: QuestionLevel;
}

/**
 * Represents a match between an extracted concept and an existing concept
 */
export interface SimilarityMatch {
  conceptId: string;
  name: string;
  similarity: number; // 0-1 score
  category: ConceptCategory;
  description: string;
}

/**
 * Comprehensive data structure for human review of extracted concepts
 */
export interface ConceptReviewData {
  courseId: number;
  courseName: string;
  extractedConcepts: ExtractedConcept[];
  similarityMatches: Map<string, SimilarityMatch[]>; // keyed by extracted concept name
  totalExtracted: number;
  highConfidenceCount: number;
}

/**
 * Result of the extraction process
 */
export interface ExtractionResult {
  success: boolean;
  data?: ConceptReviewData;
  error?: string;
  extractionId?: string; // for tracking async operations
}

/**
 * Review decision for human-in-the-loop concept approval
 */
export interface ReviewDecision {
  action: "approve" | "link" | "edit" | "reject";
  extractedConcept: ExtractedConcept;
  targetConceptId?: string; // for link action
  editedConcept?: Partial<ExtractedConcept>; // for edit action
  courseId: number;
}

/**
 * Batch review request
 */
export interface BatchReviewRequest {
  decisions: ReviewDecision[];
}

/**
 * Review processing result
 */
export interface ReviewResult {
  success: boolean;
  conceptName: string;
  action: string;
  conceptId?: string;
  error?: string;
}

/**
 * Custom error types for concept extraction
 */
export class ConceptExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptExtractionError";
  }
}

export class ConceptValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptValidationError";
  }
}

export class LLMServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMServiceError";
  }
}
````

## File: lib/LLMCheckDate/validateDate.ts
````typescript
"use server";

import Groq from "groq-sdk";
import { polishDay, polishMonth } from "@/data/polishDayMonth";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY, // Use the API key from environment variables
});

export async function validateDate(
  date: string,
  userDay: string,
  userMonth: string,
  userYear: string,
  yearQuestion: string
) {
  const [day, month] = date.split("/");
  const correctDay = polishDay[parseInt(day) - 1];
  const correctMonth = polishMonth[parseInt(month) - 1];
  const correctYear = yearQuestion

  const prompt = `
    Validate if the given answer in Polish correctly represents the date ${date}.
    The user's answer is:
    Day: "${userDay}"
    Month: "${userMonth}"
    Year: "${userYear}"
    
    The correct forms are:
    Day: "${correctDay}"
    Month: "${correctMonth}"
    Year: "${correctYear}"

    Respond in the following format:
    Day correct: [true/false]
    Month correct: [true/false]
    Year correct: [true/false]
    Comment: [provide a brief comment about each part of the answer, mentioning any typos or grammatical issues]
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama3-8b-8192",
  });

  const result = chatCompletion.choices[0]?.message?.content || "";

  // Parse the result
  const dayCorrect = result.includes("Day correct: true");
  const monthCorrect = result.includes("Month correct: true");
  const yearCorrect = result.includes("Year correct: true");
  const commentMatch = result.split('\n').find(line => line.startsWith('Comment:'));
  const comment = commentMatch ? commentMatch.slice('Comment:'.length).trim() : "";

  return {
    dayCorrect,
    monthCorrect,
    yearCorrect,
    comment,
  };
}
````

## File: lib/LLMCheckDate/validateDatesOpenAI.ts
````typescript
"use server";

import OpenAI from "openai";
import dotenv from "dotenv";
import { polishDay, polishMonth } from "@/data/polishDayMonth";

dotenv.config(); // Load environment variables from .env file using

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from environment variables
});

export async function validateDate(
  date: string,
  userDay: string,
  userMonth: string,
  userYear: string,
  yearQuestion: string
) {
  const [day, month] = date.split("/");
  const correctDay = polishDay[parseInt(day) - 1];
  const correctMonth = polishMonth[parseInt(month) - 1];
  const correctYear = yearQuestion

  const prompt = `
    Validate if the given answer in Polish correctly represents the date ${date}.
    The user's answer is:
    Day: "${userDay}"
    Month: "${userMonth}"
    Year: "${userYear}"
    
    The correct forms are:
    Day: "${correctDay}"
    Month: "${correctMonth}"
    Year: "${correctYear}"

    Respond strictly in the following format. Don't violate this format, it may impact the application.
    Day correct: [true/false]
    Month correct: [true/false]
    Year correct: [true/false]
    Comment: [provide a brief comment about each part of the answer, mentioning any typos or grammatical issues or missing words, please be kind and helpful and give some hints]
  `;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          'You are a Polish language assistant who validates user responses for date expressions in Polish from grammar, and spelling and vocabulary perspectives.',
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const result = chatCompletion.choices[0]?.message?.content || "";
  console.log("OpenAI response:", result);

  // Parse the result
  const dayCorrect = result.includes("Day correct: true");
  const monthCorrect = result.includes("Month correct: true");
  const yearCorrect = result.includes("Year correct: true");
  const commentMatch = result.split('\n').find(line => line.startsWith('Comment:'));
  const comment = commentMatch ? commentMatch.slice('Comment:'.length).trim() : "";

  return {
    dayCorrect,
    monthCorrect,
    yearCorrect,
    comment,
  };
}
````

## File: lib/LLMCheckTime/actions.ts
````typescript
"use server";

import Groq from "groq-sdk";

import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY, // Use the API key from environment variables
});

export async function validateAnswer(time: string, answer: string) {
  const prompt = `
You are a Polish language expert validating time expressions. Your task is to evaluate a student's response to the question "Jaka jest godzina?" by ensuring it follows Polish formal or informal time formats.

## INPUTS: 
- Time: ${time}
- Student's Answer: ${answer}

### RULES:

#### FORMAL TIME FORMAT:
1. Structure: [hour in feminine ordinal form] + [minutes in cardinal form].
   - Example: 8:28 = "ósma dwadzieścia osiem", 21:40 = "dwudziesta pierwsza czterdzieści".
2. Errors to catch:
   - Incorrect hour form (e.g., "siedemnaście" instead of "siedemnasta").
   - Incorrect minute form (e.g., "trzydzieści szesnaście" instead of "trzydzieści sześć").

#### INFORMAL TIME FORMAT:
1. Structures:
   - **Minutes 1–29**: "[minutes in cardinal] po [hour in locative feminine ordinal]".
     - Example: 8:28 = "dwadzieścia osiem po ósmej".
   - **Minutes 31–59**: "za [remaining minutes to next hour in cardinal] [next hour in nominative feminine ordinal]".
     - Example: 8:45 = "za piętnaście dziewiąta".
   - **Minute 15**: "kwadrans po [hour in locative feminine ordinal]".
     - Example: 8:15 = "kwadrans po ósmej".
   - **Minute 30**: "wpół do [next hour in genitive feminine ordinal]".
     - Example: 8:30 = "wpół do dziewiątej".
2. Errors to catch:
   - Incorrect use of "po" or "za".
   - Incorrect locative/nominative/genitive forms.
   - Missing or extra words.

### TASK:
1. Detect if the user's answer is in formal or informal format.
2. Validate against the rules for the identified format.
3. Provide detailed feedback if there are errors.
4. Respond with the correct formal and informal formats.

### RESPONSE FORMAT:
Respond strictly in JSON. Do not include any additional text or explanations. Do not include "\`\`\`json" or any other header or footer. 

{
  "correct": <true/false>,
  "correctForm": {
    "formal": "EXPECTED FORMAL FORMAT",
    "informal": "EXPECTED INFORMAL FORMAT"
  },
  "comment": "Detailed feedback on errors. Explain why corrections are needed."
}`;




  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a very accurate and reliable Polish Language teacher. You asked the question {Jaka jest godzina?} from student.Validate the user's answer based on the prompt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-70b-8192",
    });

    const response = chatCompletion.choices[0]?.message?.content || "";

    console.log("Response:", response);
    // Parse JSON response
    const result = JSON.parse(response);

    return {
      correct: result.correct || false,
      correctForm: result.correctForm || { formal: "", informal: "" },
      comment: result.comment || "No comment provided.",
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      correct: false,
      correctForm: { formal: "", informal: "" },
      comment:
        "An error occurred while processing the response. Please try again.",
    };
  }
}
````

## File: lib/LLMPracticeValidation/generateQuestion.ts
````typescript
"use server"
import OpenAI from "openai"
import type { ICourse } from "@/datamodels/course.model"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateQuestion(course: ICourse, previousQuestions: string[]): Promise<string> {
  /* const prompt = `Generate only one question for a Polish language learning practice session based on the following course information:
    ${JSON.stringify(course, null, 2)}
    The question should be relevant to the course content and suitable for the learner's level. The question should be in Polish and short (maximum 3 sentences).The question should be started in A1 level of difficulty. The difficulty of questions slightly should be increased after 3 right answer and should be slightly decreased afte 2 consecutive wrong answer to different questionss.  Never ask grammar rules directly, always ask in context of a sentence or a text. The question form can be clozed gap, multiple choice, trasnform sentence,  clozed gap with giving the answer in basic form in parenthesis while asking for correct form, asking correct concrete questions which require a short answer. The chosen question type should be diverse, don't chose a same type consecutively.The question should be picked at random from the course content. The question should be meaningful and self contained. User cannot remember the whole content of course. The context should be provided in the question. Don't ask translation of a word or a sentence.
    I'm sending previous questions to help you avoid asking repetitive quesrions. Previous questions: ${previousQuestions.length > 0 ? previousQuestions.join(", ") : "None"}`; */

    const prompt = `Generate one question for a Polish language learning practice session based on the following course information:

    ${JSON.stringify(course, null, 2)}
    
    The question should be in Polish and no longer than 3 sentences.
    It should be suitable for an A1 level learner. The question should be designed wisely to help the learner progress and avoid overwhelming them. The question should be creative and interesting to keep the learner engaged.
    If there are fewer than 3 previous questions, make it an easier question within A1 (e.g., basic vocabulary or simple sentence structures).
    If there are 3 to 5 previous questions, make it moderately difficult within A1 (e.g., slightly longer sentences or additional vocabulary).
    If there are more than 5 previous questions, make it a bit more challenging but still within A1 (e.g., varied sentence patterns or more contextual inference).
    Additionally, if the last two previous questions were similar in structure or topic, make the next question simpler to avoid overwhelming the learner.
    The question should be self-contained and meaningful, providing sufficient context for the learner to understand without needing to refer back to the course material.
    Do not ask about grammar rules directly; test them in context.
    Do not ask for translations.
    Do not ask questions that can have multiple correct answers.
    If the course content is not sufficient to generate a question, you can generate a question based on general Polish language knowledge at the A1 level using the course content as a reference.
    Previous questions: ${previousQuestions.length > 0 ? previousQuestions.join(", ") : "None"}`
    console.log(prompt);
  /*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */

;/*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */



/*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */

 const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an experienced and wise Polish teacher that generates questions for Polish language learning practice sessions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  return completion.choices[0]?.message?.content || "Failed to generate question."
}
````

## File: lib/LLMPracticeValidation/practiceValidation.ts
````typescript
"use server";
import OpenAI from "openai";
import type { IPracticeSession } from "@/datamodels/practice.model";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PracticeSessionValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: {
    focusAreas?: string[];
  };
}

export async function validatePracticeSession(
  session: IPracticeSession
): Promise<PracticeSessionValidationResult> {
  const prompt = `
    As an AI language learning assistant, please analyze and validate the following practice session:

    Practice Session Data:
    ${JSON.stringify(session, null, 2)}

    Please perform the following tasks:
    1. Validate that the practice session data is complete and consistent.
    2. Check if the number of questions and answers is appropriate for a practice session.
    3. Identify areas where the user needs to focus based on their mistakes and performance.

    Provide your response in JSON format with the following structure:
    {
      "isValid": boolean,
      "errors": ["error1", "error2", ...],
      "suggestions": {
        "focusAreas": ["area1", "area2", ...]
      }
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that validates and analyzes language learning practice sessions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    ) as PracticeSessionValidationResult;

    return result;
  } catch (error) {
    console.error("Error validating practice session:", error);
    return {
      isValid: false,
      errors: ["Failed to validate practice session"],
      suggestions: {},
    };
  }
}

export async function calculateSessionMetrics(
  session: IPracticeSession
): Promise<{
  accuracy: number;
  avgResponseTime: number;
  vocabularyProgress: {
    attempted: number;
    correct: number;
    weakItems: string[];
  };
  grammarProgress: {
    concepts: Array<{ name: string; attempts: number; correct: number }>;
  };
}> {
  const totalQuestions = session.questionAnswers.length;
  const correctAnswers = session.questionAnswers.filter(
    (qa) => qa.isCorrect
  ).length;
  const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  const avgResponseTime =
    totalQuestions > 0
      ? session.questionAnswers.reduce(
          (sum, qa) => sum + (qa.analysisDetails?.responseTime || 0),
          0
        ) / totalQuestions
      : 0;

  const vocabularyProgress = {
    attempted: 0,
    correct: 0,
    weakItems: [] as string[],
  };

  const grammarProgress = {
    concepts: [] as Array<{ name: string; attempts: number; correct: number }>,
  };

  session.questionAnswers.forEach((qa) => {
    if (qa.category === "vocabulary") {
      vocabularyProgress.attempted++;
      if (qa.isCorrect) {
        vocabularyProgress.correct++;
      } else {
        vocabularyProgress.weakItems.push(qa.keywords[0]); // Assuming the first keyword is the main vocabulary item
      }
    } else if (qa.category === "grammar") {
      const conceptName = qa.keywords[0]; // Assuming the first keyword is the grammar concept
      const conceptIndex = grammarProgress.concepts.findIndex(
        (c) => c.name === conceptName
      );
      if (conceptIndex === -1) {
        grammarProgress.concepts.push({
          name: conceptName,
          attempts: 1,
          correct: qa.isCorrect ? 1 : 0,
        });
      } else {
        grammarProgress.concepts[conceptIndex].attempts++;
        if (qa.isCorrect) {
          grammarProgress.concepts[conceptIndex].correct++;
        }
      }
    }
  });

  return {
    accuracy,
    avgResponseTime,
    vocabularyProgress,
    grammarProgress,
  };
}

export async function updateSRSSchedule(
  metricsPromise: Promise<{
    accuracy: number;
    avgResponseTime: number;
    vocabularyProgress: {
      attempted: number;
      correct: number;
      weakItems: string[];
    };
    grammarProgress: {
      concepts: Array<{ name: string; attempts: number; correct: number }>;
    };
  }>
): Promise<{ nextReviewDate: Date; easinessFactor: number }> {
  const metrics = await metricsPromise; // Await the promise to get the resolved value

  const prompt = `
    As an AI language learning assistant, please analyze the following practice session metrics and suggest an appropriate SRS (Spaced Repetition System) schedule:

    Session Metrics:
    ${JSON.stringify(metrics, null, 2)}

    Please suggest an updated SRS schedule based on the user's performance. Consider the following factors:
    1. The user's accuracy in this session
    2. The average response time
    3. The time since the last review

    Provide your response in JSON format with the following structure:
    {
      "nextReviewDate": "YYYY-MM-DD",
      "easinessFactor": number (between 1.3 and 2.5)
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps update SRS schedules for language learning.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "srs_schedule",
          schema: {
            type: "object",
            properties: {
              nextReviewDate: {
                type: "string",
                description: "The suggested date for the next review.",
              },
              easinessFactor: {
                type: "number",
                description: "The suggested easiness factor for the next review.",
              },
            },
          },
        },
      }
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    ) as {
      nextReviewDate: string;
      easinessFactor: number;
    };

    return {
      nextReviewDate: new Date(result.nextReviewDate),
      easinessFactor: Math.max(1.3, Math.min(2.5, result.easinessFactor)),
    };
  } catch (error) {
    console.error("Error updating SRS schedule:", error);
    // Fallback to a simple SRS update if AI fails
    const nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
    const easinessFactor = Math.max(
      1.3,
      Math.min(2.5, metrics.accuracy < 0.6 ? 1.5 : 2.5)
    );
    return { nextReviewDate, easinessFactor };
  }
}
````

## File: lib/practiceEngine/contextBuilder.ts
````typescript
// lib/practiceEngine/contextBuilder.ts
// Using a single import to avoid circular dependency issues
import Concept from "@/datamodels/concept.model";
import { ConceptCategory } from "@/lib/enum";

export interface ConceptSummary {
  id: string;
  name: string;
  category: ConceptCategory;
  description?: string;
  keyExamples?: string[];
  difficulty?: string;
}

export interface SmartContext {
  targetConcepts: ConceptSummary[];
  relatedConcepts: ConceptSummary[];
  sessionObjectives: string[];
  interleaving: boolean;
}

export class ContextBuilder {
  /**
   * Build minimal context for LLM question generation
   */
  async buildContextForConcepts(conceptIds: string[]): Promise<string> {
    if (conceptIds.length === 0) {
      return "General Polish language practice session.";
    }

    // Get target concepts
    const targetConcepts = await this.getConceptSummaries(conceptIds);

    // Get related concepts for richer context
    const relatedConcepts = await this.getRelatedConcepts(conceptIds);

    // Build smart context
    const smartContext: SmartContext = {
      targetConcepts,
      relatedConcepts,
      sessionObjectives: this.generateSessionObjectives(targetConcepts),
      interleaving: targetConcepts.length > 1,
    };

    return this.formatContextForLLM(smartContext);
  }

  /**
   * Get lightweight concept summaries for efficient LLM usage
   */
  private async getConceptSummaries(
    conceptIds: string[]
  ): Promise<ConceptSummary[]> {
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    return concepts.map((concept) => ({
      id: concept.id,
      name: concept.name,
      category: concept.category,
      description: concept.description,
      keyExamples: concept.examples.slice(0, 3), // Limit examples for token efficiency
      difficulty: concept.difficulty,
    }));
  }

  /**
   * Get related concepts for cross-reinforcement
   */
  async getRelatedConcepts(conceptIds: string[]): Promise<ConceptSummary[]> {
    const targetConcepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    if (targetConcepts.length === 0) return [];

    // Collect all related concept IDs
    const relatedIds = new Set<string>();

    for (const concept of targetConcepts) {
      // Add prerequisites
      concept.prerequisites?.forEach((id: string) => relatedIds.add(id));

      // Add explicitly related concepts
      concept.relatedConcepts?.forEach((id: string) => relatedIds.add(id));
    }

    // Remove target concepts from related set
    conceptIds.forEach((id) => relatedIds.delete(id));

    // If no explicit relationships, find concepts from same category
    if (relatedIds.size === 0) {
      const categories = [...new Set(targetConcepts.map((c) => c.category))];
      const sameCategoryConcepts = await Concept.find({
        category: { $in: categories },
        id: { $nin: conceptIds },
        isActive: true,
      }).limit(3);

      sameCategoryConcepts.forEach((c) => relatedIds.add(c.id));
    }

    // Get related concept details (limit to 3 for efficiency)
    const relatedConceptIds = Array.from(relatedIds).slice(0, 3);
    return await this.getConceptSummaries(relatedConceptIds);
  }

  /**
   * Generate session learning objectives
   */
  private generateSessionObjectives(
    targetConcepts: ConceptSummary[]
  ): string[] {
    const objectives: string[] = [];

    if (targetConcepts.length === 0) {
      return ["Practice general Polish language skills"];
    }

    if (targetConcepts.length === 1) {
      const concept = targetConcepts[0];
      objectives.push(`Master ${concept.name} (${concept.category})`);
      objectives.push(`Apply ${concept.name} in context`);
    } else {
      // Multi-concept session
      const grammarConcepts = targetConcepts.filter(
        (c) => c.category === ConceptCategory.GRAMMAR
      );
      const vocabularyConcepts = targetConcepts.filter(
        (c) => c.category === ConceptCategory.VOCABULARY
      );

      if (grammarConcepts.length > 0 && vocabularyConcepts.length > 0) {
        objectives.push("Practice grammar and vocabulary together in context");
        objectives.push("Build fluency through concept integration");
      } else if (grammarConcepts.length > 1) {
        objectives.push("Master multiple grammar patterns");
        objectives.push("Apply grammatical concepts in varied contexts");
      } else if (vocabularyConcepts.length > 1) {
        objectives.push("Expand vocabulary across topics");
        objectives.push("Use new vocabulary in sentences");
      }

      // Add interleaving objective
      objectives.push("Practice concept switching and mental flexibility");
    }

    return objectives;
  }

  /**
   * Format context for LLM question generation
   */
  private formatContextForLLM(context: SmartContext): string {
    let formattedContext = "PRACTICE SESSION CONTEXT:\n\n";

    // Target concepts
    formattedContext += "TARGET CONCEPTS:\n";
    for (const concept of context.targetConcepts) {
      formattedContext += `• ${concept.name} (${concept.category}, ${concept.difficulty})\n`;
      formattedContext += `  Description: ${concept.description}\n`;
      if (concept.keyExamples && concept.keyExamples.length > 0) {
        formattedContext += `  Examples: ${concept.keyExamples.join(", ")}\n`;
      }
      formattedContext += "\n";
    }

    // Related concepts for context
    if (context.relatedConcepts.length > 0) {
      formattedContext += "RELATED CONCEPTS (for context):\n";
      for (const concept of context.relatedConcepts) {
        formattedContext += `• ${concept.name}: ${concept.description}\n`;
      }
      formattedContext += "\n";
    }

    // Session objectives
    formattedContext += "SESSION OBJECTIVES:\n";
    for (const objective of context.sessionObjectives) {
      formattedContext += `• ${objective}\n`;
    }
    formattedContext += "\n";

    // Special instructions for multi-concept sessions
    if (context.interleaving) {
      formattedContext += "SPECIAL INSTRUCTIONS:\n";
      formattedContext +=
        "• Create questions that combine multiple concepts when possible\n";
      formattedContext +=
        "• Focus on practical application rather than isolated rules\n";
      formattedContext +=
        "• Vary question difficulty to match concept levels\n\n";
    }

    return formattedContext;
  }

  /**
   * Build context for specific question types
   */
  async buildContextForQuestionType(
    conceptIds: string[],
    questionType: "grammar_focus" | "vocabulary_focus" | "mixed"
  ): Promise<string> {
    const baseContext = await this.buildContextForConcepts(conceptIds);

    let typeSpecificInstructions = "";

    switch (questionType) {
      case "grammar_focus":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that test grammatical understanding and application. Include sentence transformation, conjugation, or syntax questions.";
        break;
      case "vocabulary_focus":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that test vocabulary knowledge and usage. Include context clues, word formation, or meaning-in-context questions.";
        break;
      case "mixed":
        typeSpecificInstructions =
          "\nFOCUS: Create questions that integrate both grammar and vocabulary. Focus on real-world language use and communication.";
        break;
    }

    return baseContext + typeSpecificInstructions;
  }

  /**
   * Build context for drill sessions (targeting weaknesses)
   */
  async buildDrillContext(
    conceptIds: string[],
    weaknessAreas: string[]
  ): Promise<string> {
    const baseContext = await this.buildContextForConcepts(conceptIds);

    let drillInstructions = "\nDRILL SESSION FOCUS:\n";
    drillInstructions += "• Target areas where student showed difficulty\n";
    drillInstructions +=
      "• Create slightly easier questions to build confidence\n";
    drillInstructions +=
      "• Focus on fundamental understanding before complexity\n";

    if (weaknessAreas.length > 0) {
      drillInstructions += "\nSPECIFIC WEAKNESS AREAS:\n";
      for (const area of weaknessAreas) {
        drillInstructions += `• ${area}\n`;
      }
    }

    return baseContext + drillInstructions;
  }

  /**
   * Get concept relationships for smart session planning
   */
  async analyzeConceptRelationships(conceptIds: string[]): Promise<{
    clusters: string[][];
    prerequisites: Map<string, string[]>;
    combinations: string[][];
  }> {
    const concepts = await Concept.find({
      id: { $in: conceptIds },
      isActive: true,
    });

    const clusters: string[][] = [];
    const prerequisites = new Map<string, string[]>();
    const combinations: string[][] = [];

    // Group by category
    const grammarConcepts = concepts.filter(
      (c) => c.category === ConceptCategory.GRAMMAR
    );
    const vocabularyConcepts = concepts.filter(
      (c) => c.category === ConceptCategory.VOCABULARY
    );

    if (grammarConcepts.length > 0) {
      clusters.push(grammarConcepts.map((c) => c.id));
    }
    if (vocabularyConcepts.length > 0) {
      clusters.push(vocabularyConcepts.map((c) => c.id));
    }

    // Map prerequisites
    for (const concept of concepts) {
      if (concept.prerequisites && concept.prerequisites.length > 0) {
        prerequisites.set(concept.id, concept.prerequisites);
      }
    }

    // Generate useful combinations
    if (grammarConcepts.length > 0 && vocabularyConcepts.length > 0) {
      // Mix grammar + vocabulary
      for (const grammar of grammarConcepts) {
        for (const vocab of vocabularyConcepts) {
          combinations.push([grammar.id, vocab.id]);
        }
      }
    }

    return { clusters, prerequisites, combinations };
  }
}
````

## File: lib/practiceEngine/types.ts
````typescript
import { PracticeMode, QuestionLevel } from "@/lib/enum";
import { IConcept } from "@/datamodels/concept.model";

/**
 * Lightweight concept summary for context building
 */
export interface ConceptSummary {
  id: string;
  name: string;
  category: string;
  keyExamples: string[];
  difficultyLevel: QuestionLevel;
}

/**
 * Individual question response
 */
export interface QuestionResponse {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  attempts: number;
  conceptsTargeted: string[];
  feedback: string;
  timestamp: Date;
}

/**
 * Practice session configuration
 */
export interface PracticeSessionConfig {
  mode: PracticeMode;
  userId: string;
  maxQuestions?: number;
  maxDuration?: number; // in minutes
  targetConcepts?: string[]; // for manual selection
  difficultyRange?: QuestionLevel[];
}

/**
 * Concept selection criteria for practice sessions
 */
export interface ConceptSelectionCriteria {
  userId: string;
  maxConcepts: number;
  includeOverdue: boolean;
  includeDueToday: boolean;
  difficultyBalance: "mixed" | "focused" | "progressive";
  categoryBalance: "mixed" | "grammar_focus" | "vocabulary_focus";
}

/**
 * Context for question generation
 */
export interface QuestionGenerationContext {
  targetConcepts: IConcept[];
  relatedConcepts: IConcept[];
  userLevel: QuestionLevel;
  previousQuestions: string[];
  sessionQuestionCount: number;
}

/**
 * Smart context for LLM operations
 */
export interface SmartContext {
  conceptSummaries: ConceptSummary[];
  relationshipHints: string[];
  userWeaknesses: string[];
  sessionObjectives: string[];
}

/**
 * SRS calculation parameters
 */
export interface SRSParameters {
  easinessFactor: number;
  intervalDays: number;
  consecutiveCorrect: number;
  isCorrect: boolean;
  responseTime: number;
  difficultyRating?: number; // user-provided difficulty (1-5)
}

/**
 * SRS calculation result
 */
export interface SRSResult {
  nextReview: Date;
  newEasinessFactor: number;
  newIntervalDays: number;
  masteryLevelChange: number;
}

/**
 * Practice session state
 */
export interface PracticeSessionState {
  sessionId: string;
  mode: PracticeMode;
  selectedConcepts: string[];
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: QuestionResponse[];
  startTime: Date;
  isCompleted: boolean;
}

/**
 * Session metrics for tracking progress
 */
export interface SessionMetrics {
  accuracy: number;
  averageResponseTime: number;
  conceptsReviewed: number;
  strongConcepts: string[];
  weakConcepts: string[];
  recommendedReview: string[];
}

/**
 * Question selection strategy
 */
export interface QuestionSelectionStrategy {
  bankQuestionRatio: number; // 0-1, how much to prefer existing questions
  difficultyProgression: "linear" | "adaptive" | "mixed";
  conceptMixing: "interleaved" | "blocked" | "random";
  repetitionSpacing: number; // minimum questions between same concept
}

/**
 * Practice engine configuration
 */
export interface PracticeEngineConfig {
  defaultSessionLength: number;
  maxConceptsPerSession: number;
  minConceptsPerSession: number;
  questionSelectionStrategy: QuestionSelectionStrategy;
  srsParameters: {
    initialInterval: number;
    maxInterval: number;
    minEasinessFactor: number;
    maxEasinessFactor: number;
  };
}

/**
 * Concept priority calculation result
 */
export interface ConceptPriority {
  conceptId: string;
  priority: number; // 0-1 scale
  reason: "overdue" | "due_today" | "reinforcement" | "weakness" | "new";
  daysSinceLastReview: number;
  urgencyScore: number;
}

/**
 * Practice session analysis
 */
export interface SessionAnalysis {
  performanceByCategory: Record<string, number>;
  timeDistribution: Record<string, number>;
  difficultyAccuracy: Record<QuestionLevel, number>;
  conceptMastery: Record<string, number>;
  recommendations: string[];
}

/**
 * Custom error types for practice engine
 */
export class PracticeEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PracticeEngineError";
  }
}

export class ConceptSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConceptSelectionError";
  }
}

export class SRSCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SRSCalculationError";
  }
}
````

## File: app/api/concepts/review/route.ts
````typescript
// app/api/concepts/review/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { ConceptExtractor } from "@/lib/conceptExtraction/conceptExtractor";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Define schemas for the review decision API
const extractedConceptSchema = z.object({
  name: z.string(),
  category: z.enum([ConceptCategory.GRAMMAR, ConceptCategory.VOCABULARY]),
  description: z.string(),
  examples: z.array(z.string()),
  sourceContent: z.string(),
  confidence: z.number().min(0).max(1),
  suggestedDifficulty: z
    .enum([
      QuestionLevel.A1,
      QuestionLevel.A2,
      QuestionLevel.B1,
      QuestionLevel.B2,
      QuestionLevel.C1,
      QuestionLevel.C2,
    ])
    .optional(),
});

const reviewDecisionSchema = z.object({
  action: z.enum(["approve", "link", "edit", "reject"]),
  extractedConcept: extractedConceptSchema,
  targetConceptId: z.string().optional(), // for link action
  editedConcept: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      examples: z.array(z.string()).optional(),
      difficulty: z
        .enum([
          QuestionLevel.A1,
          QuestionLevel.A2,
          QuestionLevel.B1,
          QuestionLevel.B2,
          QuestionLevel.C1,
          QuestionLevel.C2,
        ])
        .optional(),
    })
    .optional(), // for edit action
  courseId: z.number().int().positive(),
});

const batchReviewSchema = z.object({
  decisions: z.array(reviewDecisionSchema),
});

// POST /api/concepts/review - Process human review decisions
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate the request body
    const { decisions } = batchReviewSchema.parse(body);

    if (decisions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No decisions provided",
        },
        { status: 400 }
      );
    }

    const courseId = decisions[0].courseId;
    const conceptManager = new ConceptManager();
    const extractor = new ConceptExtractor();

    // Process all decisions and prepare for batch creation
    const approvedConcepts = [];
    const results = [];

    for (const decision of decisions) {
      try {
        if (decision.action === "approve") {
          // Ensure suggestedDifficulty is always defined
          const concept = {
            ...decision.extractedConcept,
            suggestedDifficulty:
              decision.extractedConcept.suggestedDifficulty || QuestionLevel.A1,
          };

          approvedConcepts.push({
            concept,
            action: "create" as const,
          });
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "approved_for_creation",
          });
        } else if (decision.action === "edit") {
          const editedConcept = {
            ...decision.extractedConcept,
            name:
              decision.editedConcept?.name || decision.extractedConcept.name,
            description:
              decision.editedConcept?.description ||
              decision.extractedConcept.description,
            examples:
              decision.editedConcept?.examples ||
              decision.extractedConcept.examples,
            // Always ensure we have a valid QuestionLevel by providing a default if both are undefined
            suggestedDifficulty:
              decision.editedConcept?.difficulty ||
              decision.extractedConcept.suggestedDifficulty ||
              QuestionLevel.A1,
          };

          approvedConcepts.push({
            concept: editedConcept,
            action: "create" as const,
          });
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "approved_for_creation_with_edits",
          });
        } else if (decision.action === "link") {
          if (!decision.targetConceptId) {
            results.push({
              success: false,
              conceptName: decision.extractedConcept.name,
              error: "Target concept ID required for link action",
            });
            continue;
          }

          // Verify target concept exists
          const targetConcept = await conceptManager.getConcept(
            decision.targetConceptId
          );
          if (!targetConcept) {
            results.push({
              success: false,
              conceptName: decision.extractedConcept.name,
              error: `Target concept with ID ${decision.targetConceptId} not found`,
            });
            continue;
          }

          // Link to existing concept
          await conceptManager.linkConceptToCourse(
            decision.targetConceptId,
            courseId,
            decision.extractedConcept.confidence,
            decision.extractedConcept.sourceContent
          );

          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "linked",
            conceptId: decision.targetConceptId,
          });
        } else if (decision.action === "reject") {
          results.push({
            success: true,
            conceptName: decision.extractedConcept.name,
            action: "rejected",
          });
        }
      } catch (error) {
        results.push({
          success: false,
          conceptName: decision.extractedConcept.name,
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }

    // Now create all approved concepts in one batch operation
    let createdCount = 0;
    if (approvedConcepts.length > 0) {
      try {
        const creationResult = await extractor.applyReviewedConcepts(
          courseId,
          approvedConcepts
        );

        createdCount = creationResult.created + creationResult.merged;

        if (creationResult.errors.length > 0) {
          console.error("Concept creation errors:", creationResult.errors);
          // Update results with any creation errors
          creationResult.errors.forEach((error) => {
            results.push({
              success: false,
              conceptName: "Unknown",
              error,
            });
          });
        }
      } catch (error) {
        console.error("Batch concept creation failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create approved concepts",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json(
      {
        success: true,
        processedCount: successCount,
        createdCount,
        totalDecisions: decisions.length,
        results,
        message: `Processed ${successCount} decisions, created ${createdCount} concepts`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid review data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Review processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process review decisions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
````

## File: app/api/practice-sessions/route.ts
````typescript
import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import PracticeSession, {
  type IPracticeSession,
} from "@/datamodels/practice.model";
import QuestionAnswer, {
  type IQuestionAnswer,
} from "@/datamodels/questionAnswer.model";
import Course from "@/datamodels/course.model";
import {
  calculateSessionMetrics,
  updateSRSSchedule,
} from "@/lib/LLMPracticeValidation/practiceValidation";

async function updateCourse(
  courseId: number,
  practiceId: string,
  session: IPracticeSession
) {
  const course = await Course.findOne({ courseId });
  if (course) {
    course.practiceIds.push(practiceId);
    course.numberOfPractices += 1;
    course.fluency = Math.min(10, course.fluency + 0.1);

    const metrics = calculateSessionMetrics(session);
    const { nextReviewDate, easinessFactor } = await updateSRSSchedule(metrics);

    course.nextPracticeDate = nextReviewDate;
    course.easinessFactor = easinessFactor;

    await course.save();
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (body.questionAnswers && Array.isArray(body.questionAnswers)) {
      // Explicitly type 'qa' as IQuestionAnswer to avoid implicit any warning
      const questionAnswerIds = await Promise.all(
        body.questionAnswers.map(async (qa: IQuestionAnswer) => {
          const questionAnswerDoc = new QuestionAnswer(qa);
          await questionAnswerDoc.save();
          return questionAnswerDoc._id;
        })
      );
      // Replace the array of question answer objects with their ObjectIds
      body.questionAnswers = questionAnswerIds;
    }

    const session = new PracticeSession(body);
    await session.save();

    // Update the course after saving the session
    await updateCourse(body.courseId, session._id, session);

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to save practice session" },
      { status: 500 }
    );
  }
}
````

## File: app/concept-review/page.tsx
````typescript
// app/concept-review/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConceptReview } from "@/components/Features/conceptReview/ConceptReview";

const ConceptReviewContent = () => {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const courseId = courseIdParam ? parseInt(courseIdParam) : 1; // Default to 1 if no courseId

  const handleReviewComplete = () => {
    // Handle successful concept creation
    console.log("Concept review completed successfully");
    // Could redirect or show success message
    // You can also redirect back to courses page
    // window.location.href = "/course";
  };

  return (
    <ConceptReview
      courseId={courseId}
      onReviewComplete={handleReviewComplete}
    />
  );
};

const ConceptReviewPage = () => {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-center text-3xl font-bold">
          Concept Review System
        </h1>
        <p className="mx-auto max-w-2xl text-center text-gray-600">
          Review and approve concepts extracted from your Polish language
          courses. This helps maintain quality and consistency in your learning
          system.
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ConceptReviewContent />
      </Suspense>
    </main>
  );
};

export default ConceptReviewPage;
````

## File: components/Features/datecheck/PolishDateQuiz.tsx
````typescript
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { validateDate } from "@/lib/LLMCheckDate/validateDate";
import { validateDate } from "@/lib/LLMCheckDate/validateDatesOpenAI";
import importantDates from "@/data/importantDates.json"; // Import JSON file

import { FaPlusCircle } from "react-icons/fa";
import { polishDay, polishMonth } from "@/data/polishDayMonth";

interface DateQuestion {
  question: string;
  date: string;
  year: string;
}

export default function PolishDateQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState<DateQuestion | null>(
    null
  );
  const [userDay, setUserDay] = useState("");
  const [userMonth, setUserMonth] = useState("");
  const [userYear, setUserYear] = useState("");
  const [result, setResult] = useState<{
    dayCorrect: boolean;
    monthCorrect: boolean;
    yearCorrect: boolean;
    comment: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * importantDates.length);
    return importantDates[randomIndex];
  };

  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    setCurrentQuestion({
      question: "Który dzisiaj jest?",
      date: `${day}/${month}/${year}`,
      year: "dwa tysiące dwudziestego piątego roku",
    });
    return `${day} ${month} ${year}`;
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(getRandomQuestion());
    setUserDay("");
    setUserMonth("");
    setUserYear("");
    setResult(null);
  };

  // Add question and answer to the JSON file
  const handleAddToDB = async () => {
    const date = currentQuestion?.date;
    if (!date) return; // Guard clause to exit if date is undefined

    const [day, month] = date.split("/");
    const correctDay = polishDay[parseInt(day) - 1];
    const correctMonth = polishMonth[parseInt(month) - 1];
    const newEntry = {
      question: currentQuestion?.question || "",
      date: currentQuestion?.date || "",
      answer: {
        day: correctDay,
        month: correctMonth,
        year: currentQuestion?.year || "",
        comment: result?.comment || "",
      },
    };

    try {
      const response = await fetch("/api/addDateQuestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        const message = `Error: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      console.log("Success:", data);
      // Further actions after successful DB addition
    } catch (error) {
      console.error("Error adding to DB:", error);
      // Handle errors appropriately, e.g., display an error message to the user.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    setIsLoading(true);
    try {
      const validationResult = await validateDate(
        currentQuestion.date,
        userDay,
        userMonth,
        userYear,
        currentQuestion.year
      );
      setResult(validationResult);
    } catch (error) {
      console.error("Error validating answer:", error);
      setResult({
        dayCorrect: false,
        monthCorrect: false,
        yearCorrect: false,
        comment: "Error occurred while validating the answer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // handleNewQuestion();
    getCurrentDate();
  }, []);

  return (
    <div className="ml-60 mt-10 max-w-4xl rounded-l bg-white p-6 shadow-xl">
      <h1 className="mb-4 text-2xl font-bold">Polish Date Quiz</h1>
      <Button onClick={handleNewQuestion} className="mb-4">
        New Question
      </Button>
      {currentQuestion && (
        <div className="mb-4">
          <p className="text-lg font-semibold">{currentQuestion.question}</p>
          <p className="mt-2 text-3xl font-bold">{currentQuestion.date}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex">
          <Input
            type="text"
            value={userDay}
            onChange={(e) => setUserDay(e.target.value)}
            placeholder="Day in Polish"
            className="w-1/4"
          />
          <Input
            type="text"
            value={userMonth}
            onChange={(e) => setUserMonth(e.target.value)}
            placeholder="Month in Polish"
            className="w-1/4"
          />
          <Input
            type="text"
            value={userYear}
            onChange={(e) => setUserYear(e.target.value)}
            placeholder="Year in Polish"
            className="w-2/4"
          />
        </div>
        <Button type="submit" disabled={isLoading || !currentQuestion}>
          {isLoading ? "Checking..." : "Submit"}
        </Button>
      </form>
      {result && (
        <div className="mt-4 space-y-2">
          <p
            className={`text-lg font-semibold ${result.dayCorrect && result.monthCorrect && result.yearCorrect ? "text-green-600" : "text-red-600"}`}
          >
            {result.dayCorrect && result.monthCorrect && result.yearCorrect
              ? "Correct!"
              : "Some parts are incorrect. Try again."}
          </p>
          <p
            className={`text-base ${result.dayCorrect ? "text-green-600" : "text-red-600"}`}
          >
            Day: {result.dayCorrect ? "Correct" : "Incorrect"}
          </p>
          <p
            className={`text-base ${result.monthCorrect ? "text-green-600" : "text-red-600"}`}
          >
            Month: {result.monthCorrect ? "Correct" : "Incorrect"}
          </p>
          <p
            className={`text-base ${result.yearCorrect ? "text-green-600" : "text-red-600"}`}
          >
            Year: {result.yearCorrect ? "Correct" : "Incorrect"}
          </p>
          <p className="text-base">
            <span className="font-semibold">Comment:</span> {result.comment}
          </p>
        </div>
      )}
      <FaPlusCircle
        className="mt-5 cursor-pointer text-blue-600"
        size={20}
        onClick={handleAddToDB}
      />
    </div>
  );
}
````

## File: components/ui/button.tsx
````typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
````

## File: datamodels/practice.model.ts
````typescript
import { Schema, model, models } from "mongoose";
import type { IQuestionAnswer } from "./questionAnswer.model";

export interface INewWords {
  attempted: number;
  correct: number;
  weakItems: string[];
}

export interface IVocabulary {
  newWords: INewWords;
}

export interface IConcept {
  name: string;
  attempts: number;
  correct: number;
}

export interface IGrammar {
  concepts: IConcept[];
}

export interface IMetrics {
  vocabulary: IVocabulary;
  grammar: IGrammar;
  accuracy: number;
  avgResponseTime: number;
}

export interface IPracticeSession {
  courseId: number;
  startedAt: Date;
  completedAt: Date;
  questionAnswers: IQuestionAnswer[];
  metrics: IMetrics;
  
  // NEW: Concept integration for backwards compatibility
  conceptIds?: string[]; // concepts practiced in this session
}

const PracticeSessionSchema = new Schema<IPracticeSession>(
  {
    courseId: { type: Number, required: true, ref: "Course" },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    questionAnswers: [{ type: Schema.Types.ObjectId, ref: "QuestionAnswer" }],
    metrics: {
      vocabulary: {
        newWords: {
          attempted: Number,
          correct: Number,
          weakItems: [String],
        },
      },
      grammar: {
        concepts: [
          {
            name: String,
            attempts: Number,
            correct: Number,
          },
        ],
      },
      accuracy: Number,
      avgResponseTime: Number,
    },
    
    // NEW: Concept integration
    conceptIds: { type: [String], default: [], ref: "Concept" },
  },
  {
    timestamps: true,
  }
);

const PracticeSession =
  models?.PracticeSession ||
  model<IPracticeSession>("PracticeSession", PracticeSessionSchema);

export default PracticeSession;
````

## File: datamodels/questionBank.model.ts
````typescript
import { Schema, model, models } from "mongoose";
import { QuestionType, QuestionLevel } from "@/lib/enum";

/**
 * Interface representing a question in the question bank
 * @interface IQuestionBank
 */
export interface IQuestionBank {
  id: string;
  question: string;
  correctAnswer: string;
  questionType: QuestionType;
  targetConcepts: string[]; // concept IDs this question tests
  difficulty: QuestionLevel;
  timesUsed: number;
  successRate: number; // 0-1 based on user responses
  lastUsed: Date;
  createdDate: Date;
  isActive: boolean;
  source: "generated" | "manual";
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    question: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    targetConcepts: {
      type: [String],
      required: true,
      ref: "Concept",
    },
    difficulty: {
      type: String,
      enum: Object.values(QuestionLevel),
      required: true,
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ["generated", "manual"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
QuestionBankSchema.index({ targetConcepts: 1 });
QuestionBankSchema.index({ difficulty: 1, isActive: 1 });
QuestionBankSchema.index({ questionType: 1 });
QuestionBankSchema.index({ lastUsed: 1 });
QuestionBankSchema.index({ successRate: 1 });

const QuestionBank =
  models?.QuestionBank ||
  model<IQuestionBank>("QuestionBank", QuestionBankSchema);

export default QuestionBank;
````

## File: lib/conceptExtraction/conceptLLM.ts
````typescript
import OpenAI from "openai";
import dotenv from "dotenv";
import { ExtractedConcept, SimilarityMatch, LLMServiceError } from "./types";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { IConceptIndex } from "@/datamodels/conceptIndex.model";

dotenv.config();

/**
 * Service responsible for LLM interactions for concept extraction and similarity checking
 */
export class ConceptLLMService {
  private openai: OpenAI;
  private retryLimit: number = 3;
  private retryDelay: number = 1000; // milliseconds
  private timeoutDuration: number = 30000; // 30 seconds

  /**
   * Initialize OpenAI client using environment variables
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract concepts from course content using LLM
   * @param courseContent The course content to extract concepts from
   * @returns Array of extracted concepts
   */
  async extractConceptsFromCourse(courseContent: {
    keywords: string[];
    notes: string;
    practice: string;
    newWords: string[];
    homework?: string;
  }): Promise<ExtractedConcept[]> {
    const prompt = this.buildExtractionPrompt(courseContent);

    try {
      const result = await this.makeOpenAIRequest(prompt, "concept_extraction");

      // Parse and validate the response
      if (!result || !Array.isArray(result.concepts)) {
        throw new LLMServiceError(
          "Invalid LLM response format for concept extraction"
        );
      }

      // Map the response to ExtractedConcept objects
      const concepts = result.concepts.map(
        (concept: {
          name?: string;
          category?: string;
          description?: string;
          examples?: string[];
          sourceContent?: string;
          confidence?: number;
          suggestedDifficulty?: string;
        }) => ({
          name: concept.name || "",
          category: this.validateCategory(concept.category),
          description: concept.description || "",
          examples: Array.isArray(concept.examples) ? concept.examples : [],
          sourceContent: concept.sourceContent || "",
          confidence: this.validateConfidence(concept.confidence),
          suggestedDifficulty: this.validateDifficulty(
            concept.suggestedDifficulty
          ),
        })
      );

      return concepts;
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Concept extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check similarity between an extracted concept and existing concepts
   * @param extractedConcept The newly extracted concept
   * @param existingConcepts Array of existing concept indexes
   * @returns Array of similarity matches
   */
  async checkConceptSimilarity(
    extractedConcept: ExtractedConcept,
    existingConcepts: IConceptIndex[]
  ): Promise<SimilarityMatch[]> {
    // If no existing concepts, return empty array
    if (!existingConcepts || existingConcepts.length === 0) {
      return [];
    }

    const prompt = this.buildSimilarityPrompt(
      extractedConcept,
      existingConcepts
    );

    try {
      const result = await this.makeOpenAIRequest(prompt, "similarity_check");

      // Parse and validate the response
      if (!result || !Array.isArray(result.matches)) {
        throw new LLMServiceError(
          "Invalid LLM response format for similarity check"
        );
      }

      // Map the response to SimilarityMatch objects
      const matches = result.matches.map(
        (match: {
          conceptId?: string;
          name?: string;
          similarity?: number;
          category?: string;
          description?: string;
        }) => ({
          conceptId: match.conceptId || "",
          name: match.name || "",
          similarity: this.validateConfidence(match.similarity),
          category: this.validateCategory(match.category),
          description: match.description || "",
        })
      );

      // Sort by similarity score descending
      return matches.sort(
        (a: SimilarityMatch, b: SimilarityMatch) => b.similarity - a.similarity
      );
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        `Similarity check failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Make an OpenAI API request with retry logic
   * @param prompt The prompt to send to the LLM
   * @param context Context string for error reporting
   * @returns Parsed JSON response
   */
  private async makeOpenAIRequest(
    prompt: string,
    context: string
  ): Promise<Record<string, unknown>> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.retryLimit) {
      attempts++;
      try {
        // Create a promise that will be rejected after the timeout
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`Request timed out after ${this.timeoutDuration}ms`)
              ),
            this.timeoutDuration
          );
        });

        // Race the actual request against the timeout
        const completionPromise = this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: "json_object" },
        });

        const completion = await Promise.race([
          completionPromise,
          timeoutPromise,
        ]);

        // Extract and parse the response content
        const response = completion.choices[0]?.message?.content || "";

        try {
          return JSON.parse(response);
        } catch {
          throw new LLMServiceError(
            `Failed to parse LLM response as JSON: ${response.substring(0, 100)}...`
          );
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is not the last attempt, wait and retry
        if (attempts < this.retryLimit) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempts)
          );
        }
      }
    }

    // If we've exhausted all retries, throw the last error
    throw new LLMServiceError(
      `${context} failed after ${attempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Build the prompt for concept extraction
   * @param courseContent The course content
   * @returns Formatted prompt string
   */
  private buildExtractionPrompt(courseContent: {
    keywords?: string[];
    content?: string;
    title?: string;
    newWords?: string[];
    notes?: string;
    practice?: string;
    homework?: string;
  }): string {
    return `
You are tasked with extracting language learning concepts from Polish language course materials.

## COURSE CONTENT:
- Keywords: ${JSON.stringify(courseContent.keywords)}
- New Vocabulary Words: ${JSON.stringify(courseContent.newWords)}
- Notes: ${courseContent.notes}
- Practice Content: ${courseContent.practice}
${courseContent.homework ? `- Homework: ${courseContent.homework}` : ""}

## TASK:
Extract clearly defined language concepts from the above content, following these guidelines:

1. Categorize each concept as either GRAMMAR or VOCABULARY.
   - GRAMMAR: Sentence structures, verb conjugation patterns, case usage, etc.
   - VOCABULARY: Word groups, expressions, idioms, colloquialisms, etc.

2. For each concept:
   - Provide a clear, descriptive name
   - Write a concise but comprehensive description
   - Include 2-4 examples from the content
   - Note where in the content you found this concept
   - Assign a confidence score (0.0-1.0) indicating how clearly this concept is present
   - Suggest a difficulty level (A1, A2, B1, B2, C1, or C2)

## EXAMPLES:

Good GRAMMAR concept:
{
  "name": "Locative Case with Time Expressions",
  "category": "grammar",
  "description": "Using the locative case with preposition 'po' to express time in informal format",
  "examples": ["kwadrans po ósmej", "dwadzieścia po dziesiątej"],
  "sourceContent": "Found in practice section discussing time expressions",
  "confidence": 0.95,
  "suggestedDifficulty": "A2"
}

Good VOCABULARY concept:
{
  "name": "Time-Related Vocabulary",
  "category": "vocabulary",
  "description": "Essential vocabulary for telling time in Polish",
  "examples": ["kwadrans", "wpół do", "za pięć"],
  "sourceContent": "From notes section on telling time",
  "confidence": 0.9,
  "suggestedDifficulty": "A1"
}

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of concepts:

{
  "concepts": [
    {
      "name": "string",
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "sourceContent": "string",
      "confidence": number, // 0.0-1.0
      "suggestedDifficulty": "A1|A2|B1|B2|C1|C2"
    },
    // Additional concepts...
  ]
}

Extract at least 3 concepts but no more than 10 concepts, focusing on the most important and clearly defined ones.
`;
  }

  /**
   * Build the prompt for similarity checking
   * @param concept The extracted concept to check
   * @param existing Array of existing concept indexes
   * @returns Formatted prompt string
   */
  private buildSimilarityPrompt(
    concept: ExtractedConcept,
    existing: IConceptIndex[]
  ): string {
    return `
You are tasked with identifying similarity between a newly extracted language concept and existing concepts in our database.

## NEWLY EXTRACTED CONCEPT:
${JSON.stringify(concept, null, 2)}

## EXISTING CONCEPTS:
${JSON.stringify(existing.slice(0, 20), null, 2)}

## TASK:
Compare the newly extracted concept with the existing concepts and identify any that are semantically similar. Consider:

1. Similar names or synonymous terms
2. Similar descriptions or overlapping content
3. Matching categories (grammar or vocabulary)
4. Similar difficulty levels

For each similar concept:
- Assign a similarity score (0.0-1.0)
- Include justification for the similarity

## SIMILARITY GUIDELINES:
- 0.9-1.0: Nearly identical concepts
- 0.7-0.8: Highly similar concepts with minor differences
- 0.5-0.6: Moderately similar concepts with some overlap
- 0.3-0.4: Somewhat similar concepts with significant differences
- 0.0-0.2: Largely different concepts

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of matches:

{
  "matches": [
    {
      "conceptId": "string",
      "name": "string", 
      "similarity": number, // 0.0-1.0
      "category": "grammar|vocabulary",
      "description": "string"
    },
    // Additional matches...
  ]
}

Return only concepts with similarity score >= 0.3, limited to the top 3 most similar concepts. If no similar concepts are found, return an empty array.
`;
  }

  /**
   * Validate and normalize a category value
   * @param category The category to validate
   * @returns Validated category
   */
  private validateCategory(category: string | undefined): ConceptCategory {
    if (category === ConceptCategory.GRAMMAR || category === "grammar") {
      return ConceptCategory.GRAMMAR;
    }
    if (category === ConceptCategory.VOCABULARY || category === "vocabulary") {
      return ConceptCategory.VOCABULARY;
    }
    // Default to grammar if invalid
    return ConceptCategory.GRAMMAR;
  }

  /**
   * Validate and normalize a confidence value
   * @param confidence The confidence value to validate
   * @returns Validated confidence between 0 and 1
   */
  private validateConfidence(confidence: number | string | undefined): number {
    const num = Number(confidence);
    if (isNaN(num)) return 0.5; // Default to medium confidence
    return Math.max(0, Math.min(1, num)); // Clamp between 0 and 1
  }

  /**
   * Validate and normalize a difficulty value
   * @param difficulty The difficulty to validate
   * @returns Validated difficulty level
   */
  private validateDifficulty(difficulty: string | undefined): QuestionLevel {
    const validLevels = Object.values(QuestionLevel);
    if (
      typeof difficulty === "string" &&
      validLevels.includes(difficulty as QuestionLevel)
    ) {
      return difficulty as QuestionLevel;
    }
    // Default to B1 if invalid
    return QuestionLevel.B1;
  }
}

/**
 * Error handling wrapper for LLM operations
 * @param operation The async operation to execute
 * @param fallback Fallback value if operation fails
 * @param errorContext Context string for error reporting
 * @returns Operation result or fallback value
 */
export async function safeConceptExtraction<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Concept extraction error in ${errorContext}:`, error);
    return fallback;
  }
}
````

## File: lib/conceptExtraction/conceptManager.ts
````typescript
// lib/conceptExtraction/conceptManager.ts - ENHANCED VERSION
import Concept, { IConcept } from "@/datamodels/concept.model";
import {
  IConceptIndex,
  createConceptIndex,
} from "@/datamodels/conceptIndex.model";
import CourseConcept, {
  ICourseConcept,
} from "@/datamodels/courseConcept.model";
import { ConceptLLMService } from "./conceptLLM";
import {
  ExtractedConcept,
  SimilarityMatch,
  ConceptValidationError,
} from "./types";
import { ConceptCategory } from "@/lib/enum";
import { SRSCalculator } from "@/lib/practiceEngine/srsCalculator";

import { v4 as uuidv4 } from "uuid";

/**
 * Service responsible for managing concepts and their relationships
 */
export class ConceptManager {
  private llmService: ConceptLLMService;
  private conceptIndexCache: IConceptIndex[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Initialize with optional LLM service for dependency injection
   * @param llmService Optional LLM service implementation
   */
  constructor(llmService?: ConceptLLMService) {
    this.llmService = llmService || new ConceptLLMService();
  }

  /**
   * Create a new concept with validation and duplicate handling
   * @param conceptData Data for the new concept
   * @param skipUniquenessCheck Skip uniqueness validation
   * @returns The created or existing concept
   */
  async createConcept(
    conceptData: Partial<IConcept>,
    skipUniquenessCheck: boolean = false
  ): Promise<IConcept> {
    try {
      // Validate required fields
      if (
        !conceptData.name ||
        !conceptData.category ||
        !conceptData.description
      ) {
        throw new ConceptValidationError(
          "Missing required fields: name, category, or description"
        );
      }

      // Check if concept already exists (even when skipping uniqueness check)
      const existingConcept = await Concept.findOne({
        name: new RegExp(`^${conceptData.name.trim()}$`, "i"),
        category: conceptData.category,
        isActive: true,
      });

      if (existingConcept) {
        if (skipUniquenessCheck) {
          console.log(
            `Concept "${conceptData.name}" already exists, returning existing concept`
          );
          return existingConcept.toObject();
        } else {
          throw new ConceptValidationError(
            `Concept "${conceptData.name}" already exists in category "${conceptData.category}"`
          );
        }
      }

      // Only check detailed uniqueness if not skipping and no exact match found
      if (!skipUniquenessCheck) {
        const isUnique = await this.validateConceptUniqueness(
          conceptData.name,
          conceptData.category as ConceptCategory
        );

        if (!isUnique) {
          throw new ConceptValidationError(
            `Concept "${conceptData.name}" already exists in category "${conceptData.category}"`
          );
        }
      }

      // Generate unique ID if not provided
      const newConcept: IConcept = {
        ...conceptData,
        id: conceptData.id || uuidv4(),
        isActive:
          conceptData.isActive !== undefined ? conceptData.isActive : true,
        confidence:
          conceptData.confidence !== undefined ? conceptData.confidence : 1,
        examples: conceptData.examples || [],
        prerequisites: conceptData.prerequisites || [],
        relatedConcepts: conceptData.relatedConcepts || [],
        createdFrom: conceptData.createdFrom || [],
        lastUpdated: new Date(),
      } as IConcept;

      // Save to database
      const conceptModel = new Concept(newConcept);
      const savedConcept = await conceptModel.save();

      // Initialize concept progress for default user to make it available for practice
      try {
        await SRSCalculator.initializeConceptProgress(
          savedConcept.id,
          "default"
        );
        console.log(
          `Initialized practice progress for concept: ${savedConcept.name}`
        );
      } catch {
        // Don't fail the concept creation if progress initialization fails
      }

      // Invalidate cache
      this.invalidateCache();

      return savedConcept.toObject();
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to create concept: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Enhanced method to create or find existing concept
   * @param conceptData Data for the concept
   * @returns The created or existing concept
   */
  async createOrFindConcept(conceptData: Partial<IConcept>): Promise<IConcept> {
    try {
      // First try to find existing concept
      const existingConcept = await Concept.findOne({
        name: new RegExp(`^${conceptData.name?.trim()}$`, "i"),
        category: conceptData.category,
        isActive: true,
      });

      if (existingConcept) {
        console.log(`Found existing concept: ${existingConcept.name}`);

        // Update createdFrom if this course isn't already listed
        if (conceptData.createdFrom && conceptData.createdFrom.length > 0) {
          const newCourseId = conceptData.createdFrom[0];
          if (!existingConcept.createdFrom.includes(newCourseId)) {
            existingConcept.createdFrom.push(newCourseId);
            existingConcept.lastUpdated = new Date();
            await existingConcept.save();
          }
        }

        // Ensure progress is initialized
        try {
          await SRSCalculator.initializeConceptProgress(
            existingConcept.id,
            "default"
          );
        } catch {
          // Progress might already exist, which is fine
        }

        return existingConcept.toObject();
      }

      // Create new concept if not found
      return await this.createConcept(conceptData, true);
    } catch (error) {
      console.error(
        `Error in createOrFindConcept for "${conceptData.name}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Update an existing concept
   * @param conceptId ID of the concept to update
   * @param updates Partial updates to apply
   * @returns The updated concept
   */
  async updateConcept(
    conceptId: string,
    updates: Partial<IConcept>
  ): Promise<IConcept> {
    try {
      // Find the existing concept
      const existingConcept = await Concept.findOne({ id: conceptId });
      if (!existingConcept) {
        throw new ConceptValidationError(
          `Concept with ID ${conceptId} not found`
        );
      }

      // If name or category is being changed, check uniqueness
      if (
        (updates.name && updates.name !== existingConcept.name) ||
        (updates.category && updates.category !== existingConcept.category)
      ) {
        const isUnique = await this.validateConceptUniqueness(
          updates.name || existingConcept.name,
          (updates.category as ConceptCategory) || existingConcept.category
        );
        if (!isUnique) {
          throw new ConceptValidationError(
            "A concept with this name and category already exists"
          );
        }
      }

      // Update lastUpdated timestamp
      updates.lastUpdated = new Date();

      // Apply updates
      const updatedConcept = await Concept.findOneAndUpdate(
        { id: conceptId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedConcept) {
        throw new ConceptValidationError(
          `Failed to update concept with ID ${conceptId}`
        );
      }

      // Invalidate cache
      this.invalidateCache();

      return updatedConcept.toObject();
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to update concept: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a concept by ID
   * @param conceptId ID of the concept to retrieve
   * @returns The concept or null if not found
   */
  async getConcept(conceptId: string): Promise<IConcept | null> {
    try {
      const concept = await Concept.findOne({ id: conceptId });
      return concept ? concept.toObject() : null;
    } catch (error) {
      console.error(`Error fetching concept ${conceptId}:`, error);
      return null;
    }
  }

  /**
   * Get all active concepts
   * @param page Page number for pagination
   * @param limit Items per page
   * @returns Array of active concepts
   */
  async getActiveConcepts(
    page: number = 1,
    limit: number = 100
  ): Promise<IConcept[]> {
    try {
      const skip = (page - 1) * limit;
      const concepts = await Concept.find({ isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      return concepts.map((concept) => concept.toObject());
    } catch (error) {
      console.error("Error fetching active concepts:", error);
      return [];
    }
  }

  /**
   * Rebuild the concept index from the database
   * @returns Array of concept indexes
   */
  async rebuildConceptIndex(): Promise<IConceptIndex[]> {
    try {
      const concepts = await Concept.find({ isActive: true });
      const conceptIndexes = concepts.map((concept) =>
        createConceptIndex(concept.toObject())
      );

      // Update cache
      this.conceptIndexCache = conceptIndexes;
      this.cacheTimestamp = Date.now();

      return conceptIndexes;
    } catch (error) {
      console.error("Error rebuilding concept index:", error);
      return [];
    }
  }

  /**
   * Get the concept index, using cache if available
   * @param forceRefresh Force a cache refresh
   * @returns Array of concept indexes
   */
  async getConceptIndex(
    forceRefresh: boolean = false
  ): Promise<IConceptIndex[]> {
    // If cache is valid and not forced to refresh, return cache
    if (
      !forceRefresh &&
      this.conceptIndexCache &&
      Date.now() - this.cacheTimestamp < this.cacheTTL
    ) {
      return this.conceptIndexCache;
    }

    // Otherwise rebuild the index
    return this.rebuildConceptIndex();
  }

  /**
   * Invalidate the concept index cache
   */
  private invalidateCache(): void {
    this.conceptIndexCache = null;
  }

  /**
   * Link a concept to a course with enhanced error handling
   * @param conceptId ID of the concept
   * @param courseId ID of the course
   * @param confidence Confidence score for the link
   * @param sourceContent Source content where the concept was found
   */
  async linkConceptToCourse(
    conceptId: string,
    courseId: number,
    confidence: number,
    sourceContent: string
  ): Promise<void> {
    try {
      // Validate inputs
      if (!conceptId || !courseId) {
        throw new ConceptValidationError(
          "Missing required fields: conceptId or courseId"
        );
      }

      // Verify concept exists
      const concept = await this.getConcept(conceptId);
      if (!concept) {
        throw new ConceptValidationError(
          `Concept with ID ${conceptId} not found`
        );
      }

      // Normalize confidence score
      const normalizedConfidence = Math.max(0, Math.min(1, confidence));

      // Check if link already exists
      const existingLink = await CourseConcept.findOne({
        conceptId,
        courseId,
      });

      if (existingLink) {
        // Update existing link
        await CourseConcept.updateOne(
          { conceptId, courseId },
          {
            $set: {
              confidence: normalizedConfidence,
              sourceContent,
              isActive: true,
              extractedDate: new Date(),
            },
          }
        );
        console.log(
          `Updated link between concept ${conceptId} and course ${courseId}`
        );
      } else {
        // Create new link
        const courseConceptData: ICourseConcept = {
          conceptId,
          courseId,
          confidence: normalizedConfidence,
          sourceContent,
          isActive: true,
          extractedDate: new Date(),
        };

        const courseConcept = new CourseConcept(courseConceptData);
        await courseConcept.save();
        console.log(
          `Created new link between concept ${conceptId} and course ${courseId}`
        );
      }
    } catch (error) {
      if (error instanceof ConceptValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to link concept to course: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all concepts linked to a specific course
   * @param courseId ID of the course
   * @returns Array of concepts
   */
  async getConceptsForCourse(courseId: number): Promise<IConcept[]> {
    try {
      // Find all active course-concept links for the course
      const courseConceptLinks = await CourseConcept.find({
        courseId,
        isActive: true,
      });

      if (!courseConceptLinks.length) {
        return [];
      }

      // Extract concept IDs
      const conceptIds = courseConceptLinks.map((link) => link.conceptId);

      // Fetch the concepts
      const concepts = await Concept.find({
        id: { $in: conceptIds },
        isActive: true,
      });

      return concepts.map((concept) => concept.toObject());
    } catch (error) {
      console.error(`Error fetching concepts for course ${courseId}:`, error);
      return [];
    }
  }

  /**
   * Get all courses that contain a specific concept
   * @param conceptId ID of the concept
   * @returns Array of course IDs
   */
  async getCoursesForConcept(conceptId: string): Promise<number[]> {
    try {
      // Find all active course-concept links for the concept
      const courseConceptLinks = await CourseConcept.find({
        conceptId,
        isActive: true,
      }).sort({ confidence: -1 }); // Sort by confidence descending

      // Extract course IDs
      return courseConceptLinks.map((link) => link.courseId);
    } catch (error) {
      console.error(`Error fetching courses for concept ${conceptId}:`, error);
      return [];
    }
  }

  /**
   * Find similar concepts using LLM
   * @param extractedConcept The extracted concept to compare
   * @returns Array of similarity matches
   */
  async findSimilarConcepts(
    extractedConcept: ExtractedConcept
  ): Promise<SimilarityMatch[]> {
    try {
      // Get concept index
      const conceptIndex = await this.getConceptIndex();

      if (!conceptIndex.length) {
        return [];
      }

      // Use LLM service for similarity check
      const similarityMatches = await this.llmService.checkConceptSimilarity(
        extractedConcept,
        conceptIndex
      );

      // Filter out low-similarity matches
      return similarityMatches.filter((match) => match.similarity >= 0.3);
    } catch (error) {
      console.error(
        `Error finding similar concepts for "${extractedConcept.name}":`,
        error
      );
      return [];
    }
  }

  /**
   * Check if a concept with the given name and category already exists
   * @param name Name to check
   * @param category Category to check
   * @returns True if concept is unique, false otherwise
   */
  async validateConceptUniqueness(
    name: string,
    category: ConceptCategory
  ): Promise<boolean> {
    try {
      // Check for exact match
      const exactMatch = await Concept.findOne({
        name: new RegExp(`^${name.trim()}$`, "i"), // Case-insensitive exact match
        category,
        isActive: true,
      });

      if (exactMatch) {
        return false;
      }

      // Also check for very similar names in the same category
      const similarNames = await Concept.find({
        name: new RegExp(
          name
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 3)
            .join("|"),
          "i"
        ),
        category,
        isActive: true,
      });

      // If we find more than 3 words in common with an existing concept, consider it a duplicate
      for (const concept of similarNames) {
        const nameWords = name.toLowerCase().split(/\s+/);
        const existingNameWords = concept.name.toLowerCase().split(/\s+/);

        const commonWords = nameWords.filter(
          (word) => word.length > 3 && existingNameWords.includes(word)
        );

        if (commonWords.length >= 3) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(
        `Error validating concept uniqueness for "${name}":`,
        error
      );
      return true; // Assume unique in case of error
    }
  }

  /**
   * Get concepts with pagination and filtering
   * @param options Options for pagination and filtering
   * @returns Object with success status, data and total count
   */
  async getConceptsPaginated(options: {
    page?: number;
    limit?: number;
    category?: ConceptCategory | null;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 20, category = null, isActive = true } = options;

    try {
      // Build query based on filters
      const query: {
        isActive?: boolean;
        category?: ConceptCategory;
      } = {};

      // Filter by active status
      if (isActive !== null) {
        query.isActive = isActive;
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Get total count for pagination
      const total = await Concept.countDocuments(query);

      // Get paginated data
      const skip = (page - 1) * limit;
      const concepts = await Concept.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      return {
        success: true,
        data: concepts.map((concept) => concept.toObject()),
        total,
      };
    } catch (error) {
      console.error("Error fetching paginated concepts:", error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Factory function for dependency injection
 * @param llmService Optional LLM service implementation
 * @returns ConceptManager instance
 */
export function createConceptManager(
  llmService?: ConceptLLMService
): ConceptManager {
  return new ConceptManager(llmService);
}
````

## File: lib/dbConnect.ts
````typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Global mongoose cache for better performance
type MongooseCache = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conn: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promise: any | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
````

## File: lib/LLMCheckTime/actionsOpenAI-JSON.ts
````typescript
"use server";

import OpenAI from "openai";

import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file using

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from environment variables
});

export async function validateAnswer(time: string, answer: string) {
  const prompt = `
You are a Polish language expert validating time expressions. Your task is to evaluate a student's response to the question "Jaka jest godzina?" by ensuring it follows Polish formal or informal time formats. The answer should be correct in either format to be considered correct. So, first you have to identify the format of the answer and then validate it accordingly.

## INPUTS: 
- Time: ${time}
- Student's Answer: ${answer}

### RULES:

#### FORMAL TIME FORMAT:
1. Structure: [hour in feminine ordinal form] + [minutes in cardinal form].
   - Example: 8:28 = "ósma dwadzieścia osiem", 21:40 = "dwudziesta pierwsza czterdzieści".
2. Errors to catch:
   - Incorrect hour form (e.g., "siedemnaście" instead of "siedemnasta").
   - Incorrect minute form (e.g., "trzydzieści szesnaście" instead of "trzydzieści sześć").

#### INFORMAL TIME FORMAT:
1. Structures:
   - **Minutes 1–29**: "[minutes in cardinal] po [hour in locative feminine ordinal]".
     - Example: 8:28 = "dwadzieścia osiem po ósmej".
   - **Minutes 31–59**: "za [remaining minutes to next hour in cardinal] [next hour in nominative feminine ordinal]".
     - Example: 8:45 = "za piętnaście dziewiąta".
   - **Minute 15**: "kwadrans po [hour in locative feminine ordinal]".
     - Example: 8:15 = "kwadrans po ósmej".
   - **Minute 30**: "wpół do [next hour in genitive feminine ordinal]".
     - Example: 8:30 = "wpół do dziewiątej".
  - Time expression in written form in case of informal siutation is in 12-hour format even if the format of input time in digits is in 24-hour format.
    - Example : 16:57 = "za trzy piąta".
2. Errors to catch:
   - Incorrect use of "po" or "za".
   - Incorrect locative/nominative/genitive forms.
   - Missing or extra words.

### TASK:
1. Detect if the user's answer is in formal or informal format. 
2. Validate against the rules for the identified format. 
3. Response is correct if the answer is correct in identified format. User must enter either correct formal OR informal format.
  - Example : Identifed foramt is informal and the answer is correct in informal format = "correct"
  - Example : Identifed foramt is informal and the answer is incorrect in informal format = "incorrect"
  - Example : Identifed foramt is formal and the answer is correct in formal format = "correct"
  - Example : Identifed foramt is formal and the answer is incorrect in formal format = "incorrect"
4. Provide detailed feedback if there are errors.
5. Respond with the correct answer in both format if user's answer from step 3 is incorrect. 
6. If the user's answers correct, put encouraging comment and add other format too as an additional information. Please remember that correctness in one format eirther formal or informal is enough to be correct.

### RESPONSE FORMAT:
Respond strictly in JSON.
`;

  try {
    const completion = await openai.chat.completions.create({
      // model: "gpt-4o-2024-08-06",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Polish language assistant who validates user responses to "Jaka jest godzina?" by checking time expressions, grammar, and spelling.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "validation_feedback",
          schema: {
            type: "object",
            properties: {
              correct: {
                type: "boolean",
                description: "Indicates whether the student answer was correct either in informal or formal format. Expectation is that answer should be correct in either format to be considered correct.",
              },
              correctForm: {
                type: "object",
                description: "The expected formats for the input.",
                properties: {
                  formal: {
                    type: "string",
                    description: "The expected formal format of the input.",
                  },
                  informal: {
                    type: "string",
                    description: "The expected informal format of the input.",
                  },
                },
                required: ["formal", "informal"],
                additionalProperties: false,
              },
              comment: {
                type: "string",
                description:
                  "Detailed feedback on errors explaining why corrections are needed.",
              },
            },
            required: ["correct", "correctForm", "comment"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    /*     const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            'You are a Polish language assistant who validates user responses for date expressions in Polish from grammar, and spelling and vocabulary perspectives.',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {type: "json_object"},
    }); */

    const response = completion.choices[0]?.message?.content || "";
    console.log("Response:", response);
    // Parse JSON response
    const result = JSON.parse(response);
    // const result = response;

    return {
      correct: result.correct || false,
      correctForm: result.correctForm || { formal: "", informal: "" },
      comment: result.comment || "No comment provided.",
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      correct: false,
      correctForm: { formal: "", informal: "" },
      comment:
        "An error occurred while processing the response. Please try again.",
    };
  }
}
````

## File: tailwind.config.ts
````typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-roboto-mono)"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
````

## File: app/layout.tsx
````typescript
import type { Metadata } from "next";

// Using Inter and Roboto Mono which are available in Google Fonts
import { Inter, Roboto_Mono as RobotoMono } from "next/font/google";
import "./globals.css";

import React from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const robotoMono = RobotoMono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Szymbo V2",
  description: "Practice polish effectively",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
````

## File: app/page.tsx
````typescript
// app/page.tsx (Updated with new practice link)
import PolishDateQuiz from "@/components/Features/datecheck/PolishDateQuiz";
import PolishTimeQuiz from "@/components/Features/timecheck/PolishTimeQuiz";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <main className="bg-gradient-custom h-screen">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-black text-blue-600">Szymbo V2</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/course">
                <Button variant="outline" size="sm">
                  Add Course
                </Button>
              </Link>
              <Link href="/concept-review">
                <Button variant="outline" size="sm">
                  Review Concepts
                </Button>
              </Link>
              <Link href="/practice-new">
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  Smart Practice
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  Practice (Old)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-8">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Polish Language Learning Platform
          </h2>
          <p className="mb-6 text-blue-100">
            Practice with intelligent concept-based learning and spaced
            repetition
          </p>

          <div className="space-x-4">
            <Link href="/practice-new">
              <Button
                className="bg-white text-blue-600 hover:bg-gray-100"
                size="lg"
              >
                Start Smart Practice
              </Button>
            </Link>
            <Link href="/course">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-100"
                size="lg"
              >
                Add New Course
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-row justify-center">
          <PolishTimeQuiz />
          <PolishDateQuiz />
        </div>
      </div>
    </main>
  );
};

export default Home;
````

## File: datamodels/course.model.ts
````typescript
import { Schema, model, models } from "mongoose";
import { CourseType, ConceptExtractionStatus } from "@/lib/enum";

export interface ICourse {
  courseId: number;
  date: Date;
  keywords: string[];
  mainSubjects?: string[];
  courseType: CourseType;
  newSubjects?: string[];
  reviewSubjects?: string[];
  weaknesses?: string[];
  strengths?: string[];
  notes: string;
  practice: string;
  homework?: string;
  nextPracticeDate?: Date;
  newWords: string[];
  practiceIds?: string[];
  numberOfPractices?: number;
  fluency?: number;
  easinessFactor?: number;
  
  // NEW: Concept-related fields
  extractedConcepts?: string[]; // concept IDs extracted from this course
  conceptExtractionDate?: Date;
  conceptExtractionStatus?: ConceptExtractionStatus;
}

const CourseSchema = new Schema<ICourse>(
  {
    courseId: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    keywords: { type: [String], required: true },
    mainSubjects: { type: [String], required: false },
    courseType: {
      type: String,
      enum: Object.values(CourseType),
      required: true,
    },
    newSubjects: { type: [String], required: false },
    reviewSubjects: { type: [String], required: false },
    weaknesses: { type: [String], required: false },
    strengths: { type: [String], required: false },
    notes: { type: String, required: true },
    practice: { type: String, required: true },
    homework: { type: String, required: false },
    newWords: { type: [String], required: true },
    practiceIds: { type: [String], default: [] },
    numberOfPractices: { type: Number, default: 0 },
    fluency: { type: Number, min: 0, max: 10, default: 0 },
    nextPracticeDate: { type: Date, default: null },
    easinessFactor: { type: Number, default: 2.5, min: 1.3, max: 2.5 },
    
    // NEW: Concept-related fields
    extractedConcepts: { type: [String], default: [], ref: "Concept" },
    conceptExtractionDate: { type: Date, default: null },
    conceptExtractionStatus: {
      type: String,
      enum: Object.values(ConceptExtractionStatus),
      default: ConceptExtractionStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for concept extraction status filtering
CourseSchema.index({ conceptExtractionStatus: 1 });

const Course = models?.Course || model<ICourse>("Course", CourseSchema);

export default Course;
````

## File: lib/enum.ts
````typescript
// lib/enum.ts (Updated with PracticeMode)
/**
 * Comprehensive enum definitions for the Polish learning application
 * Includes both existing and new concept-based learning enums
 */

/* eslint-disable no-unused-vars */
export enum QuestionType {
  CLOZE_GAP = "cloze_gap",
  MULTIPLE_CHOICE = "multiple_choice",
  MAKE_SENTENCE = "make_sentence",
  Q_AND_A = "q_and_a",
}

export enum MistakeType {
  TYPO = "typo",
  GRAMMAR = "grammar",
  VOCAB = "vocab",
  WORD_ORDER = "word_order",
  INCOMPLETE_ANSWER = "incomplete_answer",
}

export enum CourseType {
  NEW = "new",
  REVIEW = "review",
  MIXED = "mixed",
}

export enum QuestionLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2",
}
/* eslint-enable no-unused-vars */

/**
 * Concept categories for organizing learning content
 * Grammar: sentence structures, verb conjugations, cases, etc.
 * Vocabulary: word groups, expressions, idioms, themes
 */
/* eslint-disable no-unused-vars */
export enum ConceptCategory {
  GRAMMAR = "grammar",
  VOCABULARY = "vocabulary",
}

/**
 * Practice modes for different learning approaches
 * Normal: Smart concept selection based on SRS
 * Previous: Review previously asked questions
 * Drill: Focus on previously failed questions
 */
export enum PracticeMode {
  NORMAL = "normal",
  PREVIOUS = "previous",
  DRILL = "drill",
}

/**
 * Concept extraction workflow status
 * Pending: Course added but concepts not extracted
 * Completed: LLM extraction finished, awaiting human review
 * Reviewed: Human review completed, concepts added to DB
 */
export enum ConceptExtractionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REVIEWED = "reviewed",
}
/* eslint-enable no-unused-vars */
````

## File: package.json
````json
{
  "name": "szymbo-v2",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "vercel-build": "npm install --legacy-peer-deps && npm run build 2>&1 | tee build.log || (cat build.log && exit 1)"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.5",
    "@radix-ui/react-slot": "^1.1.1",
    "@shadcn/ui": "^0.0.4",
    "@types/uuid": "^10.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dotenv": "^16.4.7",
    "eslint-config-prettier": "^9.1.0",
    "eslint-config-standard": "^17.1.0",
    "eslint-plugin-tailwindcss": "^3.17.5",
    "file-saver": "^2.0.5",
    "fs": "^0.0.1-security",
    "groq-sdk": "^0.9.1",
    "lucide-react": "^0.469.0",
    "mongoose": "^8.9.5",
    "next": "15.1.3",
    "openai": "^4.77.0",
    "prettier": "^3.4.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "react-icons": "^5.4.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^11.1.0",
    "zod": "^3.24.1",
    "zod-to-json-schema": "^3.24.1",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-n": "^17.15.1",
    "eslint-plugin-promise": "^7.2.1",
    "postcss": "^8",
    "typescript": "^5"
  }
}
````
