// app/page.tsx (Updated with new practice link)
import PolishDateQuiz from "@/components/Features/datecheck/PolishDateQuiz";
import PolishTimeQuiz from "@/components/Features/timecheck/PolishTimeQuiz";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <main className="bg-gradient-custom h-screen">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-black text-blue-600">Szymbo V2</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/course">
                <Button variant="outline" size="sm">
                  Add Course
                </Button>
              </Link>
              <Link href="/concept-review">
                <Button variant="outline" size="sm">
                  Review Concepts
                </Button>
              </Link>
              <Link href="/practice-new">
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  Smart Practice
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  Practice (Old)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-8">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Polish Language Learning Platform
          </h2>
          <p className="mb-6 text-blue-100">
            Practice with intelligent concept-based learning and spaced
            repetition
          </p>

          <div className="space-x-4">
            <Link href="/practice-new">
              <Button
                className="bg-white text-blue-600 hover:bg-gray-100"
                size="lg"
              >
                Start Smart Practice
              </Button>
            </Link>
            <Link href="/course">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-100"
                size="lg"
              >
                Add New Course
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-row justify-center">
          <PolishTimeQuiz />
          <PolishDateQuiz />
        </div>
      </div>
    </main>
  );
};

export default Home;
