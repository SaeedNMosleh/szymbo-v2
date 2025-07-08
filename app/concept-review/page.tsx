// app/concept-review/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConceptReview } from "@/components/Features/conceptReview/ConceptReview";

const ConceptReviewContent = () => {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  const courseId = courseIdParam ? parseInt(courseIdParam) : 1; // Default to 1 if no courseId

  const handleReviewComplete = () => {
    // Handle successful concept creation
    console.log("Concept review completed successfully");
    // Could redirect or show success message
    // You can also redirect back to courses page
    // window.location.href = "/course";
  };

  return (
    <ConceptReview
      courseId={courseId}
      onReviewComplete={handleReviewComplete}
    />
  );
};

const ConceptReviewPage = () => {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-center text-3xl font-bold">
          Concept Review System
        </h1>
        <p className="mx-auto max-w-2xl text-center text-gray-600">
          Review and approve concepts extracted from your Polish language
          courses. This helps maintain quality and consistency in your learning
          system.
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ConceptReviewContent />
      </Suspense>
    </main>
  );
};

export default ConceptReviewPage;
