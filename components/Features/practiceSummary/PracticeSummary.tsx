import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IPracticeSession } from "@/datamodels/practice.model";

interface PracticeSummaryProps {
  session: IPracticeSession;
}

export function PracticeSummary({ session }: PracticeSummaryProps) {
  const totalQuestions = session.questionAnswers.length;
  const correctAnswers = session.questionAnswers.filter(
    (qa) => qa.userAnswers[qa.userAnswers.length - 1] === qa.correctAnswer
  ).length;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const averageResponseTime =
    session.questionAnswers.reduce(
      (sum, qa) => sum + qa.analysisDetails.responseTime,
      0
    ) / totalQuestions;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Practice Session Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Overall Metrics</h3>
            <p>Total Questions: {totalQuestions}</p>
            <p>Correct Answers: {correctAnswers}</p>
            <p>Accuracy: {accuracy.toFixed(2)}%</p>
            <p>Average Response Time: {averageResponseTime.toFixed(2)}ms</p>
          </div>
          <ScrollArea className="h-[400px]">
            <h3 className="mb-2 text-lg font-semibold">Question Details</h3>
            {session.questionAnswers.map((qa, index) => (
              <div key={index} className="mb-4 rounded border p-4">
                <p>
                  <strong>Question {index + 1}:</strong> {qa.question}
                </p>
                <p>
                  <strong>Correct Answer:</strong> {qa.correctAnswer}
                </p>
                <p>
                  <strong>User Answers:</strong> {qa.userAnswers.join(", ")}
                </p>
                <p>
                  <strong>Category:</strong> {qa.category}
                </p>
                <p>
                  <strong>Question Type:</strong> {qa.questionType}
                </p>
                <p>
                  <strong>Mistake Type:</strong>{" "}
                  {qa.analysisDetails.mistakeType || "None"}
                </p>
                <p>
                  <strong>Confidence:</strong> {qa.analysisDetails.confidence}
                </p>
                <p>
                  <strong>Question Level:</strong>{" "}
                  {qa.analysisDetails.questionLevel}
                </p>
                <p>
                  <strong>Response Time:</strong>{" "}
                  {qa.analysisDetails.responseTime}ms
                </p>
              </div>
            ))}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
