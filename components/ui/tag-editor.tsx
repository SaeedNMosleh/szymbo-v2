"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tag {
  tag: string;
  source: "existing" | "new";
  confidence: number;
}

interface TagEditorProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  availableTags?: string[];
  placeholder?: string;
  className?: string;
  readonly?: boolean;
}

export function TagEditor({
  tags,
  onTagsChange,
  availableTags = [],
  placeholder = "Add a tag...",
  className,
  readonly = false,
}: TagEditorProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() && availableTags.length > 0) {
      const filtered = availableTags
        .filter((tag) =>
          tag.toLowerCase().includes(inputValue.toLowerCase().trim())
        )
        .filter((tag) => !tags.some((t) => t.tag.toLowerCase() === tag.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setFilteredSuggestions(filtered);
      setSelectedSuggestionIndex(-1);
    } else {
      setFilteredSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  }, [inputValue, availableTags, tags]);

  // Focus input when adding
  useEffect(() => {
    if (isAddingTag && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTag]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const addTag = useCallback(
    (tagName: string) => {
      const trimmedTag = tagName.trim();
      if (
        trimmedTag &&
        !tags.some((tag) => tag.tag.toLowerCase() === trimmedTag.toLowerCase())
      ) {
        const newTag: Tag = {
          tag: trimmedTag,
          source: availableTags.includes(trimmedTag) ? "existing" : "new",
          confidence: 1.0,
        };
        onTagsChange([...tags, newTag]);
      }
      setInputValue("");
      setIsAddingTag(false);
      setFilteredSuggestions([]);
    },
    [tags, onTagsChange, availableTags]
  );

  const removeTag = useCallback(
    (index: number) => {
      const newTags = tags.filter((_, i) => i !== index);
      onTagsChange(newTags);
    },
    [tags, onTagsChange]
  );

  const startEditing = useCallback((index: number) => {
    setEditingIndex(index);
    setEditValue(tags[index].tag);
  }, [tags]);

  const saveEdit = useCallback(() => {
    if (editingIndex !== null && editValue.trim()) {
      const newTags = [...tags];
      newTags[editingIndex] = {
        ...newTags[editingIndex],
        tag: editValue.trim(),
      };
      onTagsChange(newTags);
    }
    setEditingIndex(null);
    setEditValue("");
  }, [editingIndex, editValue, tags, onTagsChange]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredSuggestions.length > 0 && selectedSuggestionIndex >= 0) {
          addTag(filteredSuggestions[selectedSuggestionIndex]);
        } else {
          addTag(inputValue);
        }
      } else if (e.key === "Escape") {
        setInputValue("");
        setIsAddingTag(false);
        setFilteredSuggestions([]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    },
    [filteredSuggestions, selectedSuggestionIndex, inputValue, addTag]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );

  if (readonly) {
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant="outline"
            className="bg-blue-50 text-blue-700"
          >
            {tag.tag}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-1 min-h-[2rem] p-2 border rounded-md">
        {tags.map((tag, index) => (
          <div key={index} className="relative">
            {editingIndex === index ? (
              <Input
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={(e) => {
                  // Only save if we're not clicking on another element in the same component
                  setTimeout(() => {
                    if (editingIndex !== null) {
                      saveEdit();
                    }
                  }, 100);
                }}
                className="h-6 w-auto min-w-[60px] px-2 text-xs"
                style={{ width: `${Math.max(editValue.length * 8 + 16, 60)}px` }}
              />
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer hover:bg-blue-50 transition-colors group",
                  tag.source === "existing" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
                onClick={() => startEditing(index)}
              >
                <span className="mr-1">{tag.tag}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-3 w-3 p-0 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>
        ))}

        {/* Add Tag Button/Input */}
        {!isAddingTag ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setIsAddingTag(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add tag
          </Button>
        ) : (
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Add a small delay to allow clicking on suggestions
                setTimeout(() => {
                  if (inputValue.trim()) {
                    addTag(inputValue);
                  } else {
                    setIsAddingTag(false);
                  }
                }, 150);
              }}
              placeholder={placeholder}
              className="h-6 w-32 px-2 text-xs"
            />

            {/* Suggestions Dropdown */}
            {filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    className={cn(
                      "w-full px-3 py-1 text-left text-xs hover:bg-gray-100 transition-colors",
                      index === selectedSuggestionIndex && "bg-blue-50"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      e.stopPropagation(); // Prevent event bubbling
                      addTag(suggestion);
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        Click tags to edit them, or add new tags. 
        {availableTags.length > 0 && " Start typing to see suggestions."}
      </div>
    </div>
  );
}