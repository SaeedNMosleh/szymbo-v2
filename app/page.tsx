import PolishDateQuiz from "@/components/Features/datecheck/PolishDateQuiz";
import PolishTimeQuiz from "@/components/Features/timecheck/PolishTimeQuiz";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <main className="bg-gradient-custom h-screen">
      <nav>
        <h1 className="text-center text-3xl font-black text-sky-400">
          Szymbo V2
        </h1>
      </nav>
      <div className="flex flex-row justify-center">
        <PolishTimeQuiz />
        <PolishDateQuiz />
        <Link href="/course">
          <Button className="flex h-8 justify-center bg-orange-700">
            Add Course
          </Button>
        </Link>
        <Link href="/practice">
          <Button className="flex h-8 justify-center bg-orange-700">
            Practice Courses
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default Home;
