import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/dbConnect"
import PracticeSession, { type IPracticeSession } from "@/datamodels/practice.model"
import QuestionAnswer, { type IQuestionAnswer } from "@/datamodels/questionAnswer.model"
import Course from "@/datamodels/course.model"
import { calculateSessionMetrics, updateSRSSchedule } from "@/lib/LLMPracticeValidation/practiceValidation"

async function updateCourse(courseId: number, practiceId: string, session: IPracticeSession) {
  const course = await Course.findOne({ courseId })
  if (course) {
    course.practiceIds.push(practiceId)
    course.numberOfPractices += 1
    course.fluency = Math.min(10, course.fluency + 0.1)

    const metrics = calculateSessionMetrics(session)
    const { nextReviewDate, easinessFactor } = await updateSRSSchedule(session, metrics)

    course.nextPracticeDate = nextReviewDate
    course.easinessFactor = easinessFactor

    await course.save()
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json()

    if (body.questionAnswers && Array.isArray(body.questionAnswers)) {
      // Explicitly type 'qa' as IQuestionAnswer to avoid implicit any warning
      const questionAnswerIds = await Promise.all(
        body.questionAnswers.map(async (qa: IQuestionAnswer) => {
          const questionAnswerDoc = new QuestionAnswer(qa)
          await questionAnswerDoc.save()
          return questionAnswerDoc._id
        }),
      )
      // Replace the array of question answer objects with their ObjectIds
      body.questionAnswers = questionAnswerIds
    }

    const session = new PracticeSession(body)
    await session.save()

    // Update the course after saving the session
    await updateCourse(body.courseId, session._id, session)

    return NextResponse.json({ success: true, session }, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Failed to save practice session" }, { status: 500 })
  }
}