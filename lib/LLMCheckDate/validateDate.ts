"use server";

import Groq from "groq-sdk";
import { polishDay, polishMonth } from "@/data/polishDayMonth";
import { DATE_VALIDATION_PROMPT } from "@/prompts/dateValidation";
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

  const prompt = DATE_VALIDATION_PROMPT
    .replace('{date}', date)
    .replace('{userDay}', userDay)
    .replace('{userMonth}', userMonth)
    .replace('{userYear}', userYear)
    .replace('{correctDay}', correctDay)
    .replace('{correctMonth}', correctMonth)
    .replace('{correctYear}', correctYear);

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
