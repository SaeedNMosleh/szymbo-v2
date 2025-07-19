
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select...",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleUnselectAll = () => {
    onChange([]);
  };

  const handleToggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>
            {selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex w-full items-center justify-between">
            <Button variant="link" onClick={handleSelectAll} className="px-2">
              Select All
            </Button>
            <Button variant="link" onClick={handleUnselectAll} className="px-2">
              Unselect All
            </Button>
          </div>
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => handleToggleOption(option)}
            onSelect={(e) => e.preventDefault()}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
