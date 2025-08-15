"use server";

import OpenAI from "openai";
import { TIME_VALIDATION_PROMPT, TIME_VALIDATION_SYSTEM_PROMPT } from "@/prompts/timeValidation";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file using

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from environment variables
});

export async function validateAnswer(time: string, answer: string) {

  const prompt = TIME_VALIDATION_PROMPT
    .replace('{time}', time)
    .replace('{answer}', answer);


  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: TIME_VALIDATION_SYSTEM_PROMPT,
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
