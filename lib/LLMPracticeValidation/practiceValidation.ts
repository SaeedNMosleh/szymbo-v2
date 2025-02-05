"use server"

import OpenAI from "openai"
import type { ICourse } from "@/datamodels/course.model"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateQuestion(course: ICourse): Promise<string> {
  const prompt = `Generate a question for a Polish language learning practice session based on the following course information:
    ${JSON.stringify(course, null, 2)}
    The question should be relevant to the course content and suitable for the learner's level. The question should be in Polish and short (maximum 3 sentences). The question shoudl be in A2 level of difficulty.`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an experienced and wise Polish teacher that generates questions for Polish language learning practice sessions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })
  console.log("Completion:", completion.choices[0]?.message?.content);

  return completion.choices[0]?.message?.content || "Failed to generate question."
}

export async function validateAnswer(question: string, userAnswer: string, course: ICourse) {
  const prompt = `Validate the user's answer to the following question in the context of this course:
    Course: ${JSON.stringify(course, null, 2)}
    Question: ${question}
    User's Answer: ${userAnswer}
    
    Provide feedback and determine if the answer is correct. Return the response striclty in JSON format with the following structure wihout any additional information (like \`\`\`json) that violates JSON format:
    {
      "isCorrect": boolean,
      "feedback": string,
      "correctAnswer": string,
      "questionType": string (one of: "clozed gap", "multiple choice", "make sentence", "Q&A"),
      "confidenceLevel": number (between 1 and 5),
      "errorType": string (one of: "typo", "grammar", "vocab", "word_order", "incomplete answer", or null if no error)
    }`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an AI assistant that validates answers for language learning practice sessions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    // response_format: { type: "json_object" },
  })
  console.log("Completion:", completion.choices[0]?.message?.content);
  const result = JSON.parse(completion.choices[0]?.message?.content || "{}")
  
// Ensure the result matches our schema
return {
  isCorrect: Boolean(result.isCorrect),
  feedback: result.feedback || "No feedback provided.",
  correctAnswer: result.correctAnswer || "No correct answer provided.",
  questionType: ["clozed gap", "multiple choice", "make sentence", "Q&A"].includes(result.questionType)
    ? result.questionType
    : "Q&A",
  confidenceLevel: Math.max(1, Math.min(5, result.confidenceLevel || 1)),
  errorType: ["typo", "grammar", "vocab", "word_order", "incomplete answer"].includes(result.errorType)
    ? result.errorType
    : null,
}
}

