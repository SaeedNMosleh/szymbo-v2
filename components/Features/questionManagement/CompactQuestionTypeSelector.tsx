"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Plus, Minus, X, Check } from "lucide-react";
import { QuestionType } from "@/lib/enum";

interface QuestionTypeQuantity {
  type: QuestionType;
  quantity: number;
}

interface CompactQuestionTypeSelectorProps {
  questionTypes: QuestionTypeQuantity[];
  onQuantityChange: (type: QuestionType, quantity: number) => void;
  totalQuestions: number;
  maxPerType?: number;
}

export default function CompactQuestionTypeSelector({
  questionTypes,
  onQuantityChange,
  totalQuestions,
  maxPerType = 50,
}: CompactQuestionTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempQuantities, setTempQuantities] =
    useState<QuestionTypeQuantity[]>(questionTypes);

  const activeTypes = questionTypes.filter((qt) => qt.quantity > 0);
  const hasActiveTypes = activeTypes.length > 0;

  const handleQuantityChange = (type: QuestionType, quantity: number) => {
    const newQuantity = Math.max(0, Math.min(maxPerType, quantity));
    setTempQuantities((prev) =>
      prev.map((qt) =>
        qt.type === type ? { ...qt, quantity: newQuantity } : qt
      )
    );
  };

  const handleApply = () => {
    tempQuantities.forEach((qt) => {
      if (
        qt.quantity !== questionTypes.find((q) => q.type === qt.type)?.quantity
      ) {
        onQuantityChange(qt.type, qt.quantity);
      }
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempQuantities(questionTypes);
    setIsOpen(false);
  };

  const handleIncrement = (type: QuestionType) => {
    const current =
      tempQuantities.find((qt) => qt.type === type)?.quantity || 0;
    handleQuantityChange(type, current + 1);
  };

  const handleDecrement = (type: QuestionType) => {
    const current =
      tempQuantities.find((qt) => qt.type === type)?.quantity || 0;
    handleQuantityChange(type, current - 1);
  };

  const getTypeDisplayName = (type: QuestionType) => {
    return type.replace(/_/g, " ").toLowerCase();
  };

  const getTypeColor = (type: QuestionType) => {
    // Color coding for different question types
    const colors: Record<string, string> = {
      [QuestionType.VOCAB_CHOICE]: "bg-blue-50 text-blue-700 border-blue-200",
      [QuestionType.MULTI_SELECT]:
        "bg-green-50 text-green-700 border-green-200",
      [QuestionType.WORD_ARRANGEMENT]:
        "bg-purple-50 text-purple-700 border-purple-200",
      [QuestionType.CONJUGATION_TABLE]:
        "bg-indigo-50 text-indigo-700 border-indigo-200",
      [QuestionType.ASPECT_PAIRS]: "bg-pink-50 text-pink-700 border-pink-200",
      [QuestionType.SENTENCE_TRANSFORM]:
        "bg-yellow-50 text-yellow-700 border-yellow-200",
      [QuestionType.DIALOGUE_COMPLETE]:
        "bg-teal-50 text-teal-700 border-teal-200",
      [QuestionType.SCENARIO_RESPONSE]:
        "bg-cyan-50 text-cyan-700 border-cyan-200",
      [QuestionType.CULTURAL_CONTEXT]:
        "bg-lime-50 text-lime-700 border-lime-200",
      [QuestionType.DIMINUTIVE_FORMS]:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
      [QuestionType.CASE_TRANSFORM]:
        "bg-violet-50 text-violet-700 border-violet-200",
      [QuestionType.AUDIO_COMPREHENSION]:
        "bg-rose-50 text-rose-700 border-rose-200",
      [QuestionType.VISUAL_VOCABULARY]:
        "bg-amber-50 text-amber-700 border-amber-200",
      [QuestionType.Q_A]: "bg-slate-50 text-slate-700 border-slate-200",
      [QuestionType.MULTI_CLOZE]: "bg-stone-50 text-stone-700 border-stone-200",
      [QuestionType.BASIC_CLOZE]:
        "bg-neutral-50 text-neutral-700 border-neutral-200",
      [QuestionType.TRANSLATION_PL]: "bg-red-50 text-red-700 border-red-200",
      [QuestionType.TRANSLATION_EN]:
        "bg-orange-50 text-orange-700 border-orange-200",
    };
    return colors[type] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Question Types</Label>
        <Badge variant="secondary" className="text-xs">
          {totalQuestions} total
        </Badge>
      </div>

      {/* Active Types Display */}
      {hasActiveTypes ? (
        <div className="flex flex-wrap gap-2">
          {activeTypes.map(({ type, quantity }) => (
            <Badge
              key={type}
              variant="outline"
              className={`text-xs ${getTypeColor(type)} cursor-pointer hover:opacity-80`}
              onClick={() => onQuantityChange(type, 0)}
            >
              {getTypeDisplayName(type)}: {quantity}
              <X className="ml-1 size-3" />
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm italic text-gray-500">
          No question types selected
        </div>
      )}

      {/* Configure Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="mr-2 size-4" />
            Configure Question Types
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Type Configuration</DialogTitle>
            <DialogDescription>
              Set quantities for each question type (max {maxPerType} per type)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-3 p-1">
              {tempQuantities.map(({ type, quantity }) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium capitalize text-gray-900">
                      {getTypeDisplayName(type)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs ${getTypeColor(type)}`}
                    >
                      {quantity} selected
                    </Badge>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement(type)}
                      disabled={quantity <= 0}
                      className="size-8 p-0"
                    >
                      <Minus className="size-3" />
                    </Button>

                    <Input
                      type="number"
                      min="0"
                      max={maxPerType}
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          type,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-8 w-16 text-center"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement(type)}
                      disabled={quantity >= maxPerType}
                      className="size-8 p-0"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {tempQuantities.reduce((sum, qt) => sum + qt.quantity, 0)}{" "}
              questions
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                <Check className="mr-2 size-4" />
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const equalShare = Math.floor(maxPerType / questionTypes.length);
            questionTypes.forEach((qt) =>
              onQuantityChange(qt.type, equalShare)
            );
          }}
          className="text-xs"
        >
          Distribute Evenly
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            questionTypes.forEach((qt) => onQuantityChange(qt.type, 0))
          }
          className="text-xs"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
