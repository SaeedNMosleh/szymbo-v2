"use client";

import { AddCourse } from "@/components/Features/addCourse/AddCourse";
import { Navigation } from "@/components/ui/navigation";

const Course = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-center text-3xl font-bold">
            Course Management
          </h1>
          <p className="text-center text-gray-600">
            Create and organize your Polish learning courses
          </p>
        </div>

        <div className="flex justify-center">
          <AddCourse />
        </div>
      </div>
    </>
  );
};

export default Course;
