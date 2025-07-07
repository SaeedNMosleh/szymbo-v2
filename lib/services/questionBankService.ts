// lib/services/questionBankService.ts
import QuestionBank, { IQuestionBank } from "@/datamodels/questionBank.model";
import { v4 as uuidv4 } from "uuid";

export class QuestionBankService {
  /**
   * Save question to bank with retry logic
   */
  static async saveQuestion(questionData: Partial<IQuestionBank>): Promise<IQuestionBank | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Saving question attempt ${attempt}:`, questionData.question?.substring(0, 50));
        
        // Ensure required fields
        const completeQuestionData: IQuestionBank = {
          id: questionData.id || uuidv4(),
          question: questionData.question || "",
          correctAnswer: questionData.correctAnswer || "",
          questionType: questionData.questionType!,
          targetConcepts: questionData.targetConcepts || [],
          difficulty: questionData.difficulty!,
          timesUsed: 0,
          successRate: 0,
          lastUsed: new Date(),
          createdDate: new Date(),
          isActive: true,
          source: questionData.source || "generated"
        };

        const savedQuestion = await QuestionBank.create(completeQuestionData);
        console.log(`✅ Question saved successfully: ${savedQuestion.id}`);
        return savedQuestion;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Save attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`Failed to save question after ${maxRetries} attempts:`, lastError);
    return null;
  }

  /**
   * Update question with correct answer
   */
  static async updateQuestionAnswer(questionId: string, correctAnswer: string): Promise<boolean> {
    try {
      const result = await QuestionBank.updateOne(
        { id: questionId },
        { 
          $set: { 
            correctAnswer,
            lastUsed: new Date()
          } 
        }
      );
      
      console.log(`✅ Question ${questionId} updated with correct answer`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Failed to update question ${questionId}:`, error);
      return false;
    }
  }

  /**
   * Update question performance metrics
   */
  static async updateQuestionPerformance(questionId: string, isCorrect: boolean): Promise<boolean> {
    try {
      const question = await QuestionBank.findOne({ id: questionId });
      if (!question) {
        console.warn(`Question ${questionId} not found for performance update`);
        return false;
      }

      // Calculate new metrics
      const newTimesUsed = question.timesUsed + 1;
      const totalCorrect = question.successRate * question.timesUsed;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newSuccessRate = newCorrect / newTimesUsed;

      const result = await QuestionBank.updateOne(
        { id: questionId },
        { 
          $set: { 
            timesUsed: newTimesUsed,
            successRate: newSuccessRate,
            lastUsed: new Date()
          } 
        }
      );

      console.log(`✅ Question ${questionId} performance updated: ${(newSuccessRate * 100).toFixed(1)}% success rate`);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Failed to update question performance ${questionId}:`, error);
      return false;
    }
  }

  /**
   * Check if question exists in bank
   */
  static async questionExists(questionId: string): Promise<boolean> {
    try {
      const count = await QuestionBank.countDocuments({ id: questionId });
      return count > 0;
    } catch (error) {
      console.error(`Error checking question existence ${questionId}:`, error);
      return false;
    }
  }
}