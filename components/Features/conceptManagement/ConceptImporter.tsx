"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Table,
  Edit3,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";

// Types for import functionality
interface ImportError {
  row?: number;
  concept?: string;
  error: string;
}

interface ImportResult {
  success: boolean;
  data?: {
    imported: unknown[];
    errors: ImportError[];
    summary: Record<string, unknown>;
  };
  error?: string;
  message?: string;
}

interface CSVMapping {
  name: number;
  category: number;
  description: number;
  difficulty?: number;
  examples?: number;
  tags?: number;
}

interface ManualConcept {
  name: string;
  category: "grammar" | "vocabulary";
  description: string;
  examples: string[];
  tags: string[];
  difficulty: string;
  vocabularyData?: {
    word: string;
    translation: string;
    partOfSpeech: string;
    gender?: string;
    pluralForm?: string;
    pronunciation?: string;
  };
}

interface ConceptImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

type ImportTab = "csv" | "manual" | "document";

interface ImportRequestBody {
  type: string;
  data?: string;
  mapping?: CSVMapping;
  hasHeader?: boolean;
  concepts?: ManualConcept[];
  content?: string;
  extractionSettings?: Record<string, unknown>;
}

export const ConceptImporter: React.FC<ConceptImporterProps> = ({
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>(
    "csv"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  // CSV Import State
  const [csvData, setCsvData] = useState("");
  const [csvMapping, setCsvMapping] = useState<CSVMapping>({
    name: 0,
    category: 1,
    description: 2,
  });
  const [hasHeader, setHasHeader] = useState(true);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  // Manual Import State
  const [manualConcepts, setManualConcepts] = useState<ManualConcept[]>([]);
  const [editingConcept, setEditingConcept] = useState<number | null>(null);

  // Document Import State
  const [documentContent, setDocumentContent] = useState("");
  const [extractionSettings, setExtractionSettings] = useState({
    targetCategory: "both",
    difficulty: "A1",
    maxConcepts: 50,
    extractionPrompt: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update CSV preview when data or settings change
  const updateCSVPreview = useCallback((data: string) => {
    const lines = data.trim().split("\n").slice(0, 5); // Show first 5 rows
    const preview = lines.map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );
    setCsvPreview(preview);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          setCsvData(content);
          updateCSVPreview(content);
          setActiveTab("csv");
        } else {
          setDocumentContent(content);
          setActiveTab("document");
        }
      };

      reader.readAsText(file);
    },
    [updateCSVPreview]
  );

  // Execute import
  const executeImport = useCallback(async () => {
    setIsLoading(true);

    try {
      let requestBody: ImportRequestBody;

      switch (activeTab) {
        case "csv":
          requestBody = {
            type: "csv",
            data: csvData,
            mapping: csvMapping,
            hasHeader,
          };
          break;

        case "manual":
          requestBody = {
            type: "manual",
            concepts: manualConcepts,
          };
          break;

        case "document":
          requestBody = {
            type: "document",
            content: documentContent,
            extractionSettings,
          };
          break;

        default:
          throw new Error("Invalid import type");
      }

      const response = await fetch("/api/concepts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result: ImportResult = await response.json();
      setLastResult(result);
      onImportComplete?.(result);
    } catch (error) {
      const errorResult: ImportResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      setLastResult(errorResult);
      onImportComplete?.(errorResult);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    csvData,
    csvMapping,
    hasHeader,
    manualConcepts,
    documentContent,
    extractionSettings,
    onImportComplete,
  ]);

  // Add new manual concept
  const addManualConcept = () => {
    const newConcept: ManualConcept = {
      name: "",
      category: "vocabulary",
      description: "",
      examples: [],
      tags: [],
      difficulty: "A1",
    };
    setManualConcepts([...manualConcepts, newConcept]);
    setEditingConcept(manualConcepts.length);
  };

  // Update manual concept
  const updateManualConcept = (
    index: number,
    updates: Partial<ManualConcept>
  ) => {
    const updated = [...manualConcepts];
    updated[index] = { ...updated[index], ...updates };
    setManualConcepts(updated);
  };

  // Remove manual concept
  const removeManualConcept = (index: number) => {
    setManualConcepts(manualConcepts.filter((_, i) => i !== index));
    if (editingConcept === index) {
      setEditingConcept(null);
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = `name,category,description,difficulty,examples,tags
"Basic Greeting","vocabulary","How to say hello in Polish","A1","Cześć;Dzień dobry","greeting;basic"
"Present Tense","grammar","Conjugation of verbs in present tense","A2","Ja jestem;Ty jesteś","verb;tense"`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "concept-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render CSV import interface
  const renderCSVImport = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 size-4" />
          Choose CSV File
        </Button>
        <Button variant="ghost" onClick={downloadCSVTemplate}>
          <Download className="mr-2 size-4" />
          Download Template
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {csvData && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium">CSV Data</label>
            <Textarea
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                updateCSVPreview(e.target.value);
              }}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHeader"
              checked={hasHeader}
              onCheckedChange={setHasHeader}
            />
            <label htmlFor="hasHeader" className="text-sm font-medium">
              First row contains headers
            </label>
          </div>

          {csvPreview.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Preview & Column Mapping
              </label>
              <div className="overflow-hidden rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvPreview[0]?.map((_, colIndex) => (
                        <th key={colIndex} className="border-r p-2 text-left">
                          Column {colIndex + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview
                      .slice(hasHeader ? 1 : 0, 3)
                      .map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="max-w-32 truncate border-r p-2"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Name Column
                  </label>
                  <Select
                    value={csvMapping.name.toString()}
                    onValueChange={(value) =>
                      setCsvMapping({ ...csvMapping, name: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {csvPreview[0]?.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Column {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category Column
                  </label>
                  <Select
                    value={csvMapping.category.toString()}
                    onValueChange={(value) =>
                      setCsvMapping({
                        ...csvMapping,
                        category: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {csvPreview[0]?.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Column {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Description Column
                  </label>
                  <Select
                    value={csvMapping.description.toString()}
                    onValueChange={(value) =>
                      setCsvMapping({
                        ...csvMapping,
                        description: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {csvPreview[0]?.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Column {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Difficulty Column (Optional)
                  </label>
                  <Select
                    value={csvMapping.difficulty?.toString() || "none"}
                    onValueChange={(value) =>
                      setCsvMapping({
                        ...csvMapping,
                        difficulty:
                          value === "none" ? undefined : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {csvPreview[0]?.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Column {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render manual import interface
  const renderManualImport = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Manual Concept Entry</h3>
        <Button onClick={addManualConcept}>
          <Plus className="mr-2 size-4" />
          Add Concept
        </Button>
      </div>

      <ScrollArea className="h-96 rounded border">
        <div className="space-y-4 p-4">
          {manualConcepts.map((concept, index) => (
            <Card
              key={index}
              className={editingConcept === index ? "border-blue-500" : ""}
            >
              <CardContent className="p-4">
                {editingConcept === index ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Name
                        </label>
                        <Input
                          value={concept.name}
                          onChange={(e) =>
                            updateManualConcept(index, { name: e.target.value })
                          }
                          placeholder="Concept name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Category
                        </label>
                        <Select
                          value={concept.category}
                          onValueChange={(value) =>
                            updateManualConcept(index, {
                              category: value as "grammar" | "vocabulary",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vocabulary">
                              Vocabulary
                            </SelectItem>
                            <SelectItem value="grammar">Grammar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        value={concept.description}
                        onChange={(e) =>
                          updateManualConcept(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Concept description"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditingConcept(null)}>
                        <CheckCircle className="mr-2 size-4" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeManualConcept(index)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {concept.name || "Untitled"}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">{concept.category}</Badge>
                        <span>{concept.description || "No description"}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingConcept(index)}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {manualConcepts.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No concepts added yet. Click &quot;Add Concept&quot; to get started.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render document import interface
  const renderDocumentImport = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 size-4" />
          Choose Document
        </Button>
        <span className="text-sm text-gray-600">
          Supports: .txt, .docx, .pdf (as text)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div>
        <label className="mb-2 block text-sm font-medium">
          Document Content
        </label>
        <Textarea
          value={documentContent}
          onChange={(e) => setDocumentContent(e.target.value)}
          placeholder="Paste or upload document content here..."
          rows={8}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Target Category (Optional)
          </label>
          <Select
            value={extractionSettings.targetCategory}
            onValueChange={(value) =>
              setExtractionSettings({
                ...extractionSettings,
                targetCategory: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Both" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="vocabulary">Vocabulary only</SelectItem>
              <SelectItem value="grammar">Grammar only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Default Difficulty
          </label>
          <Select
            value={extractionSettings.difficulty}
            onValueChange={(value) =>
              setExtractionSettings({
                ...extractionSettings,
                difficulty: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="A1" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A1">A1 - Beginner</SelectItem>
              <SelectItem value="A2">A2 - Elementary</SelectItem>
              <SelectItem value="B1">B1 - Intermediate</SelectItem>
              <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
              <SelectItem value="C1">C1 - Advanced</SelectItem>
              <SelectItem value="C2">C2 - Proficient</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Max Concepts to Extract
        </label>
        <Input
          type="number"
          value={extractionSettings.maxConcepts}
          onChange={(e) =>
            setExtractionSettings({
              ...extractionSettings,
              maxConcepts: parseInt(e.target.value) || 50,
            })
          }
          min="1"
          max="100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Custom Extraction Prompt (Optional)
        </label>
        <Textarea
          value={extractionSettings.extractionPrompt}
          onChange={(e) =>
            setExtractionSettings({
              ...extractionSettings,
              extractionPrompt: e.target.value,
            })
          }
          placeholder="Provide specific instructions for concept extraction..."
          rows={3}
        />
      </div>
    </div>
  );

  // Render import results
  const renderResults = () => {
    if (!lastResult) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {lastResult.success ? (
              <CheckCircle className="size-5 text-green-500" />
            ) : (
              <AlertCircle className="size-5 text-red-500" />
            )}
            Import Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastResult.success ? (
            <div className="space-y-4">
              <div className="rounded bg-green-50 p-3">
                <h4 className="font-medium text-green-800">
                  {lastResult.message}
                </h4>
                {lastResult.data?.summary && (
                  <div className="mt-2 text-sm text-green-700">
                    {Object.entries(lastResult.data.summary).map(
                      ([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, " $1")}:
                          </span>
                          <span className="ml-2 font-medium">
                            {String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {lastResult.data?.errors && lastResult.data.errors.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-orange-600">
                    Errors ({lastResult.data.errors.length})
                  </h4>
                  <ScrollArea className="h-32 rounded border">
                    <div className="space-y-1 p-2">
                      {lastResult.data.errors.map((error, index) => (
                        <div
                          key={index}
                          className="rounded bg-orange-50 p-2 text-sm"
                        >
                          {error.row && (
                            <span className="font-medium">
                              Row {error.row}:{" "}
                            </span>
                          )}
                          {error.concept && (
                            <span className="font-medium">
                              {error.concept}:{" "}
                            </span>
                          )}
                          <span className="text-orange-700">{error.error}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded bg-red-50 p-3">
              <h4 className="font-medium text-red-800">Import Failed</h4>
              <p className="mt-1 text-sm text-red-700">{lastResult.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Concept Import
          </CardTitle>
          <p className="text-sm text-gray-600">
            Import concepts from various sources: CSV files, manual entry, or
            document extraction.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ImportTab)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="csv">
                <Table className="mr-2 size-4" />
                CSV Import
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Edit3 className="mr-2 size-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="document">
                <FileText className="mr-2 size-4" />
                Document Extract
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="mt-4">
              {renderCSVImport()}
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              {renderManualImport()}
            </TabsContent>

            <TabsContent value="document" className="mt-4">
              {renderDocumentImport()}
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button
              onClick={executeImport}
              disabled={
                isLoading ||
                (activeTab === "csv" && !csvData) ||
                (activeTab === "manual" && manualConcepts.length === 0) ||
                (activeTab === "document" && !documentContent)
              }
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Import Concepts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderResults()}
    </div>
  );
};
