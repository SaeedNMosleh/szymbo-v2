import PolishDateQuiz from "@/components/Features/datecheck/PolishDateQuiz";
import PolishTimeQuiz from "@/components/Features/timecheck/PolioshTimeQuiz";

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
      </div>
    </main>
  );
};

export default Home;
