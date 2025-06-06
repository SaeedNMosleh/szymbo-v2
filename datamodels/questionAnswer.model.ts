import { Schema, model, models } from "mongoose"
import { QuestionType, MistakeType, QuestionLevel } from "@/lib/enum"

export interface IQuestionAnswer {
  question: string
  correctAnswer: string
  userAnswers: string[]
  keywords: string[]
  category: string
  questionType: QuestionType
  courseId: number
  analysisDetails: {
    mistakeType: MistakeType | null
    confidence: number
    questionLevel: QuestionLevel
    responseTime: number
  }
  isCorrect: boolean // New field
  feedback: string // New field
}

const QuestionAnswerSchema = new Schema<IQuestionAnswer>({
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  userAnswers: { type: [String], required: true },
  keywords: { type: [String], required: true },
  category: { type: String, required: true },
  questionType: { type: String, enum: Object.values(QuestionType), required: true },
  courseId: { type: Number, required: true },
  analysisDetails: {
    mistakeType: { type: String, enum: Object.values(MistakeType), required: false },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    questionLevel: { type: String, enum: Object.values(QuestionLevel), required: true },
    responseTime: { type: Number, required: true, min: 0 },
  },
  isCorrect: { type: Boolean, required: true }, // New field
  feedback: { type: String, required: true }, // New field
})

const QuestionAnswer = models?.QuestionAnswer || model<IQuestionAnswer>("QuestionAnswer", QuestionAnswerSchema)

export default QuestionAnswer