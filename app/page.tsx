import PolishDateQuiz from "@/components/Features/datecheck/PolishDateQuiz";
import PolishTimeQuiz from "@/components/Features/timecheck/PolishTimeQuiz";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <main className="bg-gradient-custom h-screen">
      <Navigation />

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
                Start Practice
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
