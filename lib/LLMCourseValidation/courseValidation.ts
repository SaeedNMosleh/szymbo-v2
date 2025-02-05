"use server"

import OpenAI from "openai"
import { z } from "zod"
import { connectToDatabase } from "@/lib/dbConnect"
import Course from "@/datamodels/course.model"



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const courseSchema = z.object({
  courseId: z.number().int().positive(),
  date: z.string(),
  keywords: z.string(),
  mainSubjects: z.string().optional(),
  courseType: z.enum(["new", "review", "mixed"]),
  newSubjects: z.string().optional(),
  reviewSubjects: z.string().optional(),
  weaknesses: z.string().optional(),
  strengths: z.string().optional(),
  notes: z.string(),
  practice: z.string(),
  homework: z.string().optional(),
})




export async function validateAndSaveCourse(data: z.infer<typeof courseSchema>, finalSubmission = false) {
  try {
    // Validate data with Zod
    courseSchema.parse(data)

    const prompt = `Please review this course information and suggest any improvements or corrections in terms of typo, grammar issues or any suggestion to clarify. There is no need for exaplanation , you must only return the revised version in JSON format. Please keep the original contetnt of key if there is no suggestion for that key or if the input ar empty.
    The User inputs for course information: 
            ${JSON.stringify(data, null, 2)}`;
    console.log("Prompt:", prompt)

    if (!finalSubmission) {
      // LLM validation
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that helps validate and improve course information. Provide suggestions in a structured JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "validation_feedback",
            schema: {
              type: "object",
              properties: {
                sessionNumber: {
                  type: "number",
                  description: "Indicates whether the input was correct.",
                },
                date: {
                  type: "string",
                  description: "The input is valid input for the date.",
                },
                keywords: {
                  type: "string",
                  description: "The input is valid input for the keywords.",
                },
                mainSubjects: {
                  type: "string",
                  description: "The input is valid input for the main subjects.",
                },
                courseType: {
                  type: "string",
                  description: "The input is valid input for the course type.",
                },
                newSubjects: {
                  type: "string",
                  description: "The input is valid input for the new subjects.",
                },
                reviewSubjects: {
                  type: "string",
                  description: "The input is valid input for the review subjects.",
                },
                weaknesses: {
                  type: "string",
                  description: "The input is valid input for the weaknesses.",
                },
                strengths: {
                  type: "string",
                  description: "The input is valid input for the strengths.",
                },
                notes: {
                  type: "string",
                  description: "The input is valid input for the notes.",
                },
                practice: {
                  type: "string",
                  description: "The input is valid input for the practice.",
                },
                homework: {
                  type: "string",
                  description: "The input is valid input for the homework.",
                },
              },
              required: ["courseId", "date", "keywords", "courseType", "notes", "practice", "homework", "mainSubjects", "newSubjects", "reviewSubjects", "weaknesses", "strengths"],
              additionalProperties: false,        
            strict: true,
          },
        },
      },
      })

      console.log("Completion:",completion.choices[0]?.message?.content);
      const suggestions = JSON.parse(completion.choices[0]?.message?.content || "{}")

      if (Object.keys(suggestions).length > 0) {
        return { success: false, suggestions }
      }
    }

    // Connect to MongoDB
    await connectToDatabase()

    // Save to MongoDB
    const course = new Course(data)
    await course.save()

    return { success: true }
  } catch (error) {
    console.error("Error in validateAndSaveCourse:", error)
    return { success: false, error: "Failed to validate and save course" }
  }
}