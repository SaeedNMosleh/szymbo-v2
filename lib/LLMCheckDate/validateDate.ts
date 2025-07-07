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
