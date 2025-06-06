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
