"use server"
import OpenAI from "openai"
import type { ICourse } from "@/datamodels/course.model"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateQuestion(course: ICourse, previousQuestions: string[]): Promise<string> {
  /* const prompt = `Generate only one question for a Polish language learning practice session based on the following course information:
    ${JSON.stringify(course, null, 2)}
    The question should be relevant to the course content and suitable for the learner's level. The question should be in Polish and short (maximum 3 sentences).The question should be started in A1 level of difficulty. The difficulty of questions slightly should be increased after 3 right answer and should be slightly decreased afte 2 consecutive wrong answer to different questionss.  Never ask grammar rules directly, always ask in context of a sentence or a text. The question form can be clozed gap, multiple choice, trasnform sentence,  clozed gap with giving the answer in basic form in parenthesis while asking for correct form, asking correct concrete questions which require a short answer. The chosen question type should be diverse, don't chose a same type consecutively.The question should be picked at random from the course content. The question should be meaningful and self contained. User cannot remember the whole content of course. The context should be provided in the question. Don't ask translation of a word or a sentence.
    I'm sending previous questions to help you avoid asking repetitive quesrions. Previous questions: ${previousQuestions.length > 0 ? previousQuestions.join(", ") : "None"}`; */

    const prompt = `Generate one question for a Polish language learning practice session based on the following course information:

    ${JSON.stringify(course, null, 2)}
    
    The question should be in Polish and no longer than 3 sentences.
    It should be suitable for an A1 level learner. The question should be designed wisely to help the learner progress and avoid overwhelming them. The question should be creative and interesting to keep the learner engaged.
    If there are fewer than 3 previous questions, make it an easier question within A1 (e.g., basic vocabulary or simple sentence structures).
    If there are 3 to 5 previous questions, make it moderately difficult within A1 (e.g., slightly longer sentences or additional vocabulary).
    If there are more than 5 previous questions, make it a bit more challenging but still within A1 (e.g., varied sentence patterns or more contextual inference).
    Additionally, if the last two previous questions were similar in structure or topic, make the next question simpler to avoid overwhelming the learner.
    The question should be self-contained and meaningful, providing sufficient context for the learner to understand without needing to refer back to the course material.
    Do not ask about grammar rules directly; test them in context.
    Do not ask for translations.
    Do not ask questions that can have multiple correct answers.
    If the course content is not sufficient to generate a question, you can generate a question based on general Polish language knowledge at the A1 level using the course content as a reference.
    Previous questions: ${previousQuestions.length > 0 ? previousQuestions.join(", ") : "None"}`
    console.log(prompt);
  /*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */

;/*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */



/*   const completion = await openai.chat.completions.create({
    model: "o1-mini",
    // reasoning_effort: "medium",
    messages: [
      {
        role: "user", 
        content: prompt
      }
    ],
    store: true,
  }); */

 const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an experienced and wise Polish teacher that generates questions for Polish language learning practice sessions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  return completion.choices[0]?.message?.content || "Failed to generate question."
}