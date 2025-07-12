"use client";

import React, { useState, useMemo } from "react";
import { QuestionComponentProps } from "../types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ConjugationForm {
  person: string;
  number: string;
  form: string;
  placeholder: string;
}

export function ConjugationTableQuestion({
  question,
  userAnswer,
  onAnswerChange,
  disabled,
}: QuestionComponentProps) {
  const [conjugations, setConjugations] = useState<{ [key: string]: string }>(
    {}
  );

  // Define standard Polish conjugation forms
  const conjugationForms = useMemo<ConjugationForm[]>(
    () => [
      { person: "1st", number: "singular", form: "ja", placeholder: "ja..." },
      { person: "2nd", number: "singular", form: "ty", placeholder: "ty..." },
      {
        person: "3rd",
        number: "singular",
        form: "on/ona/ono",
        placeholder: "on/ona/ono...",
      },
      { person: "1st", number: "plural", form: "my", placeholder: "my..." },
      { person: "2nd", number: "plural", form: "wy", placeholder: "wy..." },
      {
        person: "3rd",
        number: "plural",
        form: "oni/one",
        placeholder: "oni/one...",
      },
    ],
    []
  );

  // Initialize conjugations from userAnswer if it's an array
  React.useEffect(() => {
    if (Array.isArray(userAnswer)) {
      const newConjugations: { [key: string]: string } = {};
      userAnswer.forEach((answer, index) => {
        if (index < conjugationForms.length) {
          newConjugations[conjugationForms[index].form] = answer || "";
        }
      });
      setConjugations(newConjugations);
    }
  }, [userAnswer, conjugationForms]);

  const handleConjugationChange = (form: string, value: string) => {
    const newConjugations = { ...conjugations, [form]: value };
    setConjugations(newConjugations);

    // Convert to array format for parent component
    const answersArray = conjugationForms.map(
      (cf) => newConjugations[cf.form] || ""
    );
    onAnswerChange(answersArray);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">{question.question}</Label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {conjugationForms.map((form) => (
              <div key={form.form} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-xs" variant="outline">
                    {form.person} {form.number}
                  </Badge>
                  <span className="text-sm font-medium">{form.form}</span>
                </div>
                <Input
                  value={conjugations[form.form] || ""}
                  onChange={(e) =>
                    handleConjugationChange(form.form, e.target.value)
                  }
                  placeholder={form.placeholder}
                  disabled={disabled}
                  className="w-full"
                  aria-label={`Conjugation for ${form.form}`}
                />
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            <p>Complete the conjugation table for the given verb.</p>
            <p className="mt-1">
              Pay attention to the proper verb endings for each person and
              number.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
