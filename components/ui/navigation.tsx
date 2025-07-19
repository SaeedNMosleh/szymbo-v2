"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Navigation = () => {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="cursor-pointer text-2xl font-black text-blue-600">
                Szymbo V2
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/course">
              <Button variant="outline" size="sm">
                Add Course
              </Button>
            </Link>
            <Link href="/concept-extraction">
              <Button variant="outline" size="sm">
                Extract Concepts
              </Button>
            </Link>
            <Link href="/concept-review">
              <Button variant="outline" size="sm">
                Review Concepts
              </Button>
            </Link>
            <Link href="/concept-management">
              <Button variant="outline" size="sm">
                Concept Hub
              </Button>
            </Link>
            <Link href="/question-management">
              <Button variant="outline" size="sm">
                Question Hub
              </Button>
            </Link>
            <Link href="/practice-new">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="sm"
              >
                Practice
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
