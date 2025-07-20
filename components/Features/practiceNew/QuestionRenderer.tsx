"use client";

import React from "react";
import { QuestionType } from "@/lib/enum";
import { QuestionComponentProps } from "./types/questionTypes";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Import question components (we'll create these next)
import { BasicClozeQuestion } from "./questions/BasicClozeQuestion";
import { MultiClozeQuestion } from "./questions/MultiClozeQuestion";
import { VocabChoiceQuestion } from "./questions/VocabChoiceQuestion";
import { MultiSelectQuestion } from "./questions/MultiSelectQuestion";
import { ConjugationTableQuestion } from "./questions/ConjugationTableQuestion";
import { CaseTransformQuestion } from "./questions/CaseTransformQuestion";
import { SentenceTransformQuestion } from "./questions/SentenceTransformQuestion";
import { WordArrangementQuestion } from "./questions/WordArrangementQuestion";
import { TranslationQuestion } from "./questions/TranslationQuestion";
import { AudioComprehensionQuestion } from "./questions/AudioComprehensionQuestion";
import { VisualVocabularyQuestion } from "./questions/VisualVocabularyQuestion";
import { DialogueCompleteQuestion } from "./questions/DialogueCompleteQuestion";
import { AspectPairsQuestion } from "./questions/AspectPairsQuestion";
import { DiminutiveFormsQuestion } from "./questions/DiminutiveFormsQuestion";
import { ScenarioResponseQuestion } from "./questions/ScenarioResponseQuestion";
import { CulturalContextQuestion } from "./questions/CulturalContextQuestion";
import { QAndAQuestion } from "./questions/QAndAQuestion";

export function QuestionRenderer(props: QuestionComponentProps) {
  const { question } = props;

  const renderQuestionComponent = () => {

    try {
      switch (question.questionType) {
        case QuestionType.BASIC_CLOZE:
          return <BasicClozeQuestion {...props} />;

        case QuestionType.MULTI_CLOZE:
          return <MultiClozeQuestion {...props} />;

        case QuestionType.VOCAB_CHOICE:
          return <VocabChoiceQuestion {...props} />;

        case QuestionType.MULTI_SELECT:
          return <MultiSelectQuestion {...props} />;

        case QuestionType.CONJUGATION_TABLE:
          return <ConjugationTableQuestion {...props} />;

        case QuestionType.CASE_TRANSFORM:
          return <CaseTransformQuestion {...props} />;

        case QuestionType.SENTENCE_TRANSFORM:
          return <SentenceTransformQuestion {...props} />;

        case QuestionType.WORD_ARRANGEMENT:
          return <WordArrangementQuestion {...props} />;

        case QuestionType.TRANSLATION_PL:
        case QuestionType.TRANSLATION_EN:
          return <TranslationQuestion {...props} />;

        case QuestionType.AUDIO_COMPREHENSION:
          return <AudioComprehensionQuestion {...props} />;

        case QuestionType.VISUAL_VOCABULARY:
          return <VisualVocabularyQuestion {...props} />;

        case QuestionType.DIALOGUE_COMPLETE:
          return <DialogueCompleteQuestion {...props} />;

        case QuestionType.ASPECT_PAIRS:
          return <AspectPairsQuestion {...props} />;

        case QuestionType.DIMINUTIVE_FORMS:
          return <DiminutiveFormsQuestion {...props} />;

        case QuestionType.SCENARIO_RESPONSE:
          return <ScenarioResponseQuestion {...props} />;

        case QuestionType.CULTURAL_CONTEXT:
          return <CulturalContextQuestion {...props} />;

        case QuestionType.Q_A:
          return <QAndAQuestion {...props} />;

        default:
          return (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-yellow-800">
                  <AlertCircle className="size-5" />
                  <div>
                    <p className="font-medium">Unsupported Question Type</p>
                    <p className="text-sm">
                      Question type &quot;{question.questionType}&quot; is not
                      yet implemented.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
      }
    } catch (error) {
      console.error(
        `❌ Error rendering question type ${question.questionType}:`,
        error
      );

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="size-5" />
              <div>
                <p className="font-medium">Question Rendering Error</p>
                <p className="text-sm">
                  Failed to render question of type &quot;
                  {question.questionType}&quot;.
                </p>
                <p className="mt-1 text-xs text-red-600">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return <div className="space-y-4">{renderQuestionComponent()}</div>;
}
