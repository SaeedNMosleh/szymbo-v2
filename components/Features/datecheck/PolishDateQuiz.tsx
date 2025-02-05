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
