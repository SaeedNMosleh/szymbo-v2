"use client";

import React, { useState, useRef } from "react";
import { DragDropItem } from "../types/questionTypes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, RotateCcw } from "lucide-react";

interface DragDropZoneProps {
  items: DragDropItem[];
  onOrderChange: (newOrder: DragDropItem[]) => void;
  disabled: boolean;
  className?: string;
}

export function DragDropZone({
  items,
  onOrderChange,
  disabled,
  className = "",
}: DragDropZoneProps) {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  const handleDragStart = (e: React.DragEvent, item: DragDropItem) => {
    if (disabled) return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragCounterRef.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (disabled || !draggedItem) return;

    e.preventDefault();
    dragCounterRef.current = 0;

    const currentIndex = items.findIndex((item) => item.id === draggedItem.id);

    if (currentIndex !== targetIndex) {
      const newItems = [...items];
      newItems.splice(currentIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      onOrderChange(newItems);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };

  const resetOrder = () => {
    const originalOrder = [...items].sort(
      (a, b) => a.originalIndex - b.originalIndex
    );
    onOrderChange(originalOrder);
  };

  const hasBeenReordered = items.some(
    (item, index) => item.originalIndex !== index
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Drag the words to arrange them in the correct order:
        </p>
        {hasBeenReordered && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetOrder}
            className="text-xs"
          >
            <RotateCcw className="mr-1 size-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              cursor-grab p-3 transition-all duration-200 active:cursor-grabbing
              ${draggedItem?.id === item.id ? "scale-95 opacity-50" : ""}
              ${dragOverIndex === index ? "border-blue-500 bg-blue-50" : ""}
              ${disabled ? "cursor-not-allowed opacity-60" : "hover:shadow-md"}
            `}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="size-4 text-gray-400" />
              <span className="text-sm font-medium">{index + 1}.</span>
              <span className="flex-1">{item.content}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Current order: {items.map((item) => item.content).join(" ")}
      </div>
    </div>
  );
}
