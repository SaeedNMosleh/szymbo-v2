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
