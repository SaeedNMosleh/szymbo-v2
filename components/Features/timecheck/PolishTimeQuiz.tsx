"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { validateAnswer } from "../actions";
// import { validateAnswer } from "@/lib/LLMCheckTime/actionsOpenAI";
import { validateAnswer } from "@/lib/LLMCheckTime/actionsOpenAI-JSON";

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
    </div>
  );
}
