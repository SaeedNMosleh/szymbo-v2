"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { QuestionType, QuestionLevel } from "@/lib/enum";
import { QuestionRenderer } from "@/components/Features/practiceNew/QuestionRenderer";
import { QuestionData } from "@/components/Features/practiceNew/types/questionTypes";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

// Sample question data for all question types
const sampleQuestions: QuestionData[] = [
  {
    id: "1",
    question: "Ja [lubię] czytać książki w domu.",
    questionType: QuestionType.BASIC_CLOZE,
    difficulty: QuestionLevel.A1,
    targetConcepts: ["verbs", "likes-dislikes"],
    correctAnswer: "lubię",
  },
  {
    id: "2",
    question: "W [zeszłym] roku [pojechałem] do [Krakowa] na wakacje.",
    questionType: QuestionType.MULTI_CLOZE,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["past-tense", "travel"],
    correctAnswer: "zeszłym,pojechałem,Krakowa",
  },
  {
    id: "3",
    question: "What is the Polish word for 'dog'?",
    questionType: QuestionType.VOCAB_CHOICE,
    difficulty: QuestionLevel.A1,
    targetConcepts: ["animals"],
    correctAnswer: "pies",
    options: ["kot", "pies", "krowa", "koń"],
  },
  {
    id: "4",
    question: "Which of these are Polish cities? (Select all that apply)",
    questionType: QuestionType.MULTI_SELECT,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["geography", "cities"],
    correctAnswer: "Warszawa,Kraków,Gdańsk",
    options: ["Warszawa", "Berlin", "Kraków", "Praga", "Gdańsk", "Budapeszt"],
  },
  {
    id: "5",
    question: "Conjugate the verb 'być' (to be) in present tense:",
    questionType: QuestionType.CONJUGATION_TABLE,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["verbs", "present-tense"],
    correctAnswer: "jestem,jesteś,jest,jesteśmy,jesteście,są",
  },
  {
    id: "6",
    question: "Transform 'duży dom' to the genitive case:",
    questionType: QuestionType.CASE_TRANSFORM,
    difficulty: QuestionLevel.B1,
    targetConcepts: ["cases", "genitive"],
    correctAnswer: "dużego domu",
  },
  {
    id: "7",
    question:
      "Change this formal sentence to informal: 'Czy mogłby Pan mi pomóc?'",
    questionType: QuestionType.SENTENCE_TRANSFORM,
    difficulty: QuestionLevel.B1,
    targetConcepts: ["formality", "requests"],
    correctAnswer: "Czy możesz mi pomóc?",
  },
  {
    id: "8",
    question: "Arrange these words to form a correct sentence:",
    questionType: QuestionType.WORD_ARRANGEMENT,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["word-order", "sentences"],
    correctAnswer: "Idę do sklepu po chleb",
    options: ["Idę", "chleb", "po", "do", "sklepu"],
  },
  {
    id: "9",
    question: "I am going to the store to buy bread.",
    questionType: QuestionType.TRANSLATION_EN,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["shopping", "present-tense"],
    correctAnswer: "Idę do sklepu kupić chleb.",
  },
  {
    id: "10",
    question: "Jestem bardzo zmęczony.",
    questionType: QuestionType.TRANSLATION_PL,
    difficulty: QuestionLevel.A1,
    targetConcepts: ["emotions", "adjectives"],
    correctAnswer: "I am very tired.",
  },
  {
    id: "11",
    question: "Listen to the audio and answer: What time is mentioned?",
    questionType: QuestionType.AUDIO_COMPREHENSION,
    difficulty: QuestionLevel.B1,
    targetConcepts: ["time", "listening"],
    correctAnswer: "trzecia po południu",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
  },
  {
    id: "12",
    question: "What is this object called in Polish?",
    questionType: QuestionType.VISUAL_VOCABULARY,
    difficulty: QuestionLevel.A1,
    targetConcepts: ["objects", "vocabulary"],
    correctAnswer: "książka",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
  },
  {
    id: "13",
    question:
      "Anna: Cześć! Jak się masz?\nTomek: Dobrze, dziękuję. A ty?\nAnna: Też dobrze. Co robisz dziś wieczorem?\nTomek: _______",
    questionType: QuestionType.DIALOGUE_COMPLETE,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["conversation", "plans"],
    correctAnswer: "Idę do kina z przyjaciółmi.",
  },
  {
    id: "14",
    question: "Give the perfective form of 'czytać' (to read):",
    questionType: QuestionType.ASPECT_PAIRS,
    difficulty: QuestionLevel.B2,
    targetConcepts: ["aspects", "verbs"],
    correctAnswer: "przeczytać",
  },
  {
    id: "15",
    question: "Create the diminutive form of 'dom' (house):",
    questionType: QuestionType.DIMINUTIVE_FORMS,
    difficulty: QuestionLevel.B1,
    targetConcepts: ["diminutives", "morphology"],
    correctAnswer: "domek",
  },
  {
    id: "16",
    question:
      "You're at a Polish restaurant and want to order. The waiter approaches your table. What do you say?",
    questionType: QuestionType.SCENARIO_RESPONSE,
    difficulty: QuestionLevel.A2,
    targetConcepts: ["restaurant", "ordering"],
    correctAnswer: "Dzień dobry, chciałbym zobaczyć menu, proszę.",
  },
  {
    id: "17",
    question:
      "Explain the significance of Wigilia (Christmas Eve dinner) in Polish culture:",
    questionType: QuestionType.CULTURAL_CONTEXT,
    difficulty: QuestionLevel.B2,
    targetConcepts: ["culture", "traditions", "christmas"],
    correctAnswer:
      "Wigilia is the most important celebration in Poland, featuring a 12-dish meatless feast, sharing of oplatek wafers, and family traditions.",
  },
  {
    id: "18",
    question: "Dlaczego nauka języka polskiego jest ważna dla ciebie?",
    questionType: QuestionType.Q_A,
    difficulty: QuestionLevel.B1,
    targetConcepts: ["personal-opinion", "learning"],
    correctAnswer:
      "Sample answer: Nauka polskiego jest ważna, ponieważ pozwala mi komunikować się z rodziną i rozumieć kulturę.",
  },
];

export default function QuestionTypesDemo() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{
    [key: string]: string | string[];
  }>({});

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const userAnswer =
    userAnswers[currentQuestion.id] ||
    (currentQuestion.questionType === QuestionType.MULTI_SELECT ||
    currentQuestion.questionType === QuestionType.MULTI_CLOZE ||
    currentQuestion.questionType === QuestionType.CONJUGATION_TABLE ||
    currentQuestion.questionType === QuestionType.WORD_ARRANGEMENT
      ? []
      : "");

  const handleAnswerChange = (answer: string | string[]) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const resetAnswers = () => {
    setUserAnswers({});
  };

  const getQuestionTypeColor = (type: QuestionType) => {
    const colors = {
      [QuestionType.BASIC_CLOZE]: "bg-blue-100 text-blue-800",
      [QuestionType.MULTI_CLOZE]: "bg-indigo-100 text-indigo-800",
      [QuestionType.VOCAB_CHOICE]: "bg-green-100 text-green-800",
      [QuestionType.MULTI_SELECT]: "bg-emerald-100 text-emerald-800",
      [QuestionType.CONJUGATION_TABLE]: "bg-purple-100 text-purple-800",
      [QuestionType.CASE_TRANSFORM]: "bg-pink-100 text-pink-800",
      [QuestionType.SENTENCE_TRANSFORM]: "bg-rose-100 text-rose-800",
      [QuestionType.WORD_ARRANGEMENT]: "bg-orange-100 text-orange-800",
      [QuestionType.TRANSLATION_PL]: "bg-amber-100 text-amber-800",
      [QuestionType.TRANSLATION_EN]: "bg-yellow-100 text-yellow-800",
      [QuestionType.AUDIO_COMPREHENSION]: "bg-cyan-100 text-cyan-800",
      [QuestionType.VISUAL_VOCABULARY]: "bg-teal-100 text-teal-800",
      [QuestionType.DIALOGUE_COMPLETE]: "bg-sky-100 text-sky-800",
      [QuestionType.ASPECT_PAIRS]: "bg-violet-100 text-violet-800",
      [QuestionType.DIMINUTIVE_FORMS]: "bg-fuchsia-100 text-fuchsia-800",
      [QuestionType.SCENARIO_RESPONSE]: "bg-lime-100 text-lime-800",
      [QuestionType.CULTURAL_CONTEXT]: "bg-stone-100 text-stone-800",
      [QuestionType.Q_A]: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Question Types Demo
          </h1>
          <p className="text-gray-600">
            Interactive showcase of all 18 question types in the Polish learning
            system
          </p>
        </div>

        {/* Question Type Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Question {currentQuestionIndex + 1} of {sampleQuestions.length}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  className={getQuestionTypeColor(currentQuestion.questionType)}
                >
                  {currentQuestion.questionType
                    .replace(/_/g, " ")
                    .toUpperCase()}
                </Badge>
                <Badge variant="outline">{currentQuestion.difficulty}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Target concepts:</span>
              {currentQuestion.targetConcepts.map((concept) => (
                <Badge key={concept} variant="secondary" className="text-xs">
                  {concept}
                </Badge>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={resetAnswers}
                className="flex items-center gap-2"
              >
                <RotateCcw className="size-4" />
                Reset All Answers
              </Button>

              <Button
                variant="outline"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === sampleQuestions.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Renderer */}
        <QuestionRenderer
          question={currentQuestion}
          userAnswer={
            userAnswers[currentQuestion.id] ||
            (currentQuestion.questionType === QuestionType.MULTI_SELECT ||
            currentQuestion.questionType === QuestionType.MULTI_CLOZE ||
            currentQuestion.questionType === QuestionType.CONJUGATION_TABLE ||
            currentQuestion.questionType === QuestionType.WORD_ARRANGEMENT
              ? []
              : "")
          }
          onAnswerChange={handleAnswerChange}
          validationResult={null}
          isValidating={false}
          disabled={false}
          onSubmit={() => console.log("Submit clicked")}
          onRetry={() => console.log("Retry clicked")}
          onNext={() => console.log("Next clicked")}
          showSubmit={true}
          showRetry={false}
          showNext={false}
        />

        {/* Demo Actions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Demo Controls</h3>
                <p className="text-sm text-gray-600">
                  This is a demo environment - answers are not validated by LLM
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Current Answer:", userAnswer);
                    alert(
                      `Current Answer: ${Array.isArray(userAnswer) ? userAnswer.join(", ") : userAnswer}`
                    );
                  }}
                >
                  Show Answer
                </Button>
                <Button
                  onClick={() => {
                    const sampleAnswer =
                      currentQuestion.correctAnswer || "Sample answer";
                    handleAnswerChange(
                      currentQuestion.questionType ===
                        QuestionType.MULTI_SELECT ||
                        currentQuestion.questionType ===
                          QuestionType.MULTI_CLOZE ||
                        currentQuestion.questionType ===
                          QuestionType.CONJUGATION_TABLE ||
                        currentQuestion.questionType ===
                          QuestionType.WORD_ARRANGEMENT
                        ? sampleAnswer.split(",")
                        : sampleAnswer
                    );
                  }}
                >
                  Fill Sample Answer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Type Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Question Type Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {Object.values(QuestionType).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getQuestionTypeColor(type)}
                  >
                    {type.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
