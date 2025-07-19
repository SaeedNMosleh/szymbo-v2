"use client";

import React, { useState, useEffect } from "react";
import { ConceptEditDialog, ConceptEditFormData } from "@/components/shared/ConceptEditDialog";
import { IConcept } from "@/datamodels/concept.model";
import { ConceptCategory, QuestionLevel } from "@/lib/enum";
import { 
  validateMergeCompatibility, 
  prepareMergePreview, 
  getMergeErrorMessage,
  ConceptSummary,
  MergePreviewData 
} from "@/lib/conceptExtraction/mergeValidator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Merge, X } from "lucide-react";

export interface MergeConceptDialogProps {
  isOpen: boolean;
  selectedConcepts: ConceptSummary[];
  availableTags: string[];
  onConfirmMerge: (mergeData: {
    primaryConceptId: string;
    secondaryConceptIds: string[];
    finalConceptData: ConceptEditFormData;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MergeConceptDialog({
  isOpen,
  selectedConcepts,
  availableTags,
  onConfirmMerge,
  onCancel,
}: MergeConceptDialogProps) {
  const [currentStep, setCurrentStep] = useState<'validation' | 'preview'>('validation');
  const [mergePreview, setMergePreview] = useState<MergePreviewData | null>(null);
  const [fullConceptsData, setFullConceptsData] = useState<IConcept[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate merge compatibility when dialog opens
  useEffect(() => {
    if (isOpen && selectedConcepts.length > 0) {
      const validation = validateMergeCompatibility(selectedConcepts);
      
      if (validation.isValid) {
        setCurrentStep('validation');
        loadFullConceptData();
      } else {
        setCurrentStep('validation');
      }
    }
  }, [isOpen, selectedConcepts]);

  // Load full concept data from API
  const loadFullConceptData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch full concept details for all selected concepts
      const conceptPromises = selectedConcepts.map(async (concept) => {
        const response = await fetch(`/api/concepts/${concept.id}`);
        if (!response.ok) throw new Error(`Failed to fetch concept ${concept.id}`);
        const data = await response.json();
        return data.data;
      });

      const fullConcepts = await Promise.all(conceptPromises);
      setFullConceptsData(fullConcepts);

      // Prepare merge preview with full data
      const preview = prepareEnhancedMergePreview(fullConcepts);
      setMergePreview(preview);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error loading concept data:', error);
      // Fallback to basic preview with summary data
      const basicPreview = prepareMergePreview(selectedConcepts);
      setMergePreview(basicPreview);
      setCurrentStep('preview');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Prepare enhanced merge preview with full concept data
  const prepareEnhancedMergePreview = (fullConcepts: IConcept[]): MergePreviewData => {
    const [primary, ...secondary] = fullConcepts;
    
    // Aggregate all examples
    const allExamples = fullConcepts.flatMap(c => c.examples || []);
    const uniqueExamples = [...new Set(allExamples.filter(ex => ex.trim() !== ''))];

    // Aggregate all tags
    const allTags = fullConcepts.flatMap(c => c.tags || []);
    const uniqueTags = [...new Set(allTags.filter(tag => tag.trim() !== ''))];

    // Combine descriptions
    const descriptions = fullConcepts
      .map(c => c.description)
      .filter(desc => desc && desc.trim() !== '');

    const combinedDescription = descriptions.length > 1 
      ? `${descriptions[0]}\n\nMerged from:\n${descriptions.slice(1).map(desc => `• ${desc}`).join('\n')}`
      : descriptions[0] || '';

    return {
      primaryConcept: {
        id: primary.id,
        name: primary.name,
        category: primary.category,
        difficulty: primary.difficulty,
        tags: primary.tags || [],
        isActive: primary.isActive,
      },
      secondaryConcepts: secondary.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        difficulty: c.difficulty,
        tags: c.tags || [],
        isActive: c.isActive,
      })),
      mergedPreview: {
        name: primary.name, // Primary keeps its name
        category: primary.category,
        description: combinedDescription,
        examples: uniqueExamples,
        tags: uniqueTags,
        difficulty: primary.difficulty,
      },
      sourceData: {
        totalExamples: uniqueExamples.length,
        uniqueTags: uniqueTags.length,
        sourceDescriptions: descriptions,
        conceptNames: fullConcepts.map(c => c.name),
      }
    };
  };

  // Handle merge confirmation
  const handleMergeConfirm = async (finalConceptData: ConceptEditFormData) => {
    if (!mergePreview) return;

    setIsProcessing(true);
    try {
      await onConfirmMerge({
        primaryConceptId: mergePreview.primaryConcept.id,
        secondaryConceptIds: mergePreview.secondaryConcepts.map(c => c.id),
        finalConceptData,
      });
    } catch (error) {
      console.error('Error confirming merge:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const validation = validateMergeCompatibility(selectedConcepts);

  // Validation step - show errors if any
  if (currentStep === 'validation' && !validation.isValid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="mx-4 w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="size-5" />
              Cannot Merge Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-4">
                <p className="whitespace-pre-line text-sm text-red-800">
                  {getMergeErrorMessage(validation)}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected concepts:</p>
                {selectedConcepts.map((concept) => (
                  <div key={concept.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                    <span className="text-sm">{concept.name}</span>
                    <Badge variant="outline">{concept.category}</Badge>
                  </div>
                ))}
              </div>

              <Button 
                onClick={onCancel} 
                className="w-full"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading step
  if (currentStep === 'validation' && validation.isValid && isLoadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="mx-4 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p>Loading concept data for merge preview...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview step - show merge preview dialog
  if (currentStep === 'preview' && mergePreview) {
    const initialData: Partial<ConceptEditFormData> = {
      name: mergePreview.mergedPreview.name,
      category: mergePreview.mergedPreview.category as ConceptCategory,
      description: mergePreview.mergedPreview.description,
      examples: mergePreview.mergedPreview.examples,
      suggestedDifficulty: mergePreview.mergedPreview.difficulty as QuestionLevel,
      suggestedTags: mergePreview.mergedPreview.tags.map(tag => ({
        tag,
        source: "existing" as const,
        confidence: 1.0
      })),
    };

    return (
      <ConceptEditDialog
        isOpen={true}
        conceptName={mergePreview.primaryConcept.name}
        initialData={initialData}
        availableTags={availableTags}
        mode="merge_preview"
        title={`Merge ${selectedConcepts.length} Concepts`}
        description={`Primary concept "${mergePreview.primaryConcept.name}" will be enhanced with data from ${mergePreview.secondaryConcepts.length} other concept(s).`}
        sourceDataSummary={mergePreview.sourceData}
        onSave={handleMergeConfirm}
        onCancel={onCancel}
      />
    );
  }

  return null;
}