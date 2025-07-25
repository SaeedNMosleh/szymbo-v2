"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagEditor } from "@/components/ui/tag-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";

// Schema for concept editing
const ConceptEditSchema = z.object({
  name: z.string().min(1, "Concept name is required"),
  category: z.nativeEnum(ConceptCategory),
  description: z.string().min(10, "Description must be at least 10 characters"),
  examples: z.array(z.string()).min(1, "At least one example is required"),
  sourceContent: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  suggestedDifficulty: z.nativeEnum(QuestionLevel),
  suggestedTags: z
    .array(
      z.object({
        tag: z.string(),
        source: z.enum(["existing", "new"]),
        confidence: z.number(),
      })
    )
    .optional(),
});

export type ConceptEditFormData = z.infer<typeof ConceptEditSchema>;

export interface ConceptEditDialogProps {
  isOpen: boolean;
  conceptName: string;
  initialData: Partial<ConceptEditFormData>;
  availableTags: string[];
  mode: "edit" | "merge_preview";
  title?: string;
  description?: string;
  sourceDataSummary?: {
    conceptNames: string[];
    totalExamples: number;
    uniqueTags: number;
    sourceDescriptions: string[];
  };
  onSave: (data: ConceptEditFormData) => void;
  onCancel: () => void;
}

export function ConceptEditDialog({
  isOpen,
  conceptName,
  initialData,
  availableTags,
  mode,
  title,
  description,
  sourceDataSummary,
  onSave,
  onCancel,
}: ConceptEditDialogProps) {
  const form = useForm<ConceptEditFormData>({
    resolver: zodResolver(ConceptEditSchema),
    defaultValues: {
      name: initialData.name || "",
      category: initialData.category || ConceptCategory.VOCABULARY,
      description: initialData.description || "",
      examples: initialData.examples || [""],
      sourceContent: initialData.sourceContent || "",
      confidence: initialData.confidence || 0,
      suggestedDifficulty: initialData.suggestedDifficulty || QuestionLevel.A1,
      suggestedTags: initialData.suggestedTags || [],
    },
  });

  // Update form when initialData changes
  React.useEffect(() => {
    form.reset({
      name: initialData.name || "",
      category: initialData.category || ConceptCategory.VOCABULARY,
      description: initialData.description || "",
      examples: initialData.examples || [""],
      sourceContent: initialData.sourceContent || "",
      confidence: initialData.confidence || 0,
      suggestedDifficulty: initialData.suggestedDifficulty || QuestionLevel.A1,
      suggestedTags: initialData.suggestedTags || [],
    });
  }, [initialData, form]);

  const handleSubmit = (data: ConceptEditFormData) => {
    onSave(data);
  };

  if (!isOpen) return null;

  const dialogTitle =
    title ||
    (mode === "merge_preview"
      ? `Merge Preview: ${conceptName}`
      : `Edit Concept: ${conceptName}`);
  const submitButtonText =
    mode === "merge_preview" ? "Confirm Merge" : "Save Changes";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <Card
        className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>{dialogTitle}</CardTitle>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          {/* Source Data Summary for merge mode */}
          {mode === "merge_preview" && sourceDataSummary && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-800">
                📊 Merge Source Data
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>Concepts being merged:</strong>{" "}
                  {sourceDataSummary.conceptNames.length}
                  <div className="mt-1 text-xs">
                    {sourceDataSummary.conceptNames.map((name, i) => (
                      <div key={i}>• {name}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Total Examples:</strong>{" "}
                  {sourceDataSummary.totalExamples}
                  <br />
                  <strong>Unique Tags:</strong> {sourceDataSummary.uniqueTags}
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ConceptCategory).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suggestedDifficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(QuestionLevel).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examples"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Examples (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={
                          Array.isArray(field.value)
                            ? field.value.join("\n")
                            : field.value
                        }
                        onChange={(e) => {
                          const lines = e.target.value
                            .split("\n")
                            .filter((line) => line.trim() !== "");
                          field.onChange(lines);
                        }}
                        rows={4}
                        placeholder="Enter examples, one per line..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="sourceContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Content</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="suggestedTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagEditor
                        tags={
                          Array.isArray(field.value)
                            ? field.value.map((tag) =>
                                typeof tag === "string"
                                  ? {
                                      tag,
                                      source: "existing" as const,
                                      confidence: 1.0,
                                    }
                                  : tag
                              )
                            : []
                        }
                        onTagsChange={(tags) => {
                          field.onChange(tags);
                        }}
                        availableTags={availableTags}
                        placeholder="Add a tag..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {submitButtonText}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
