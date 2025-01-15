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
