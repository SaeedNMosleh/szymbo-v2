"use server";

import Groq from "groq-sdk";

import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY, // Use the API key from environment variables
});

export async function validateAnswer(time: string, answer: string) {
  const prompt = `
You are a Polish language expert validating time expressions. Your task is to evaluate a student's response to the question "Jaka jest godzina?" by ensuring it follows Polish formal or informal time formats.

## INPUTS: 
- Time: ${time}
- Student's Answer: ${answer}

### RULES:

#### FORMAL TIME FORMAT:
1. Structure: [hour in feminine ordinal form] + [minutes in cardinal form].
   - Example: 8:28 = "ósma dwadzieścia osiem", 21:40 = "dwudziesta pierwsza czterdzieści".
2. Errors to catch:
   - Incorrect hour form (e.g., "siedemnaście" instead of "siedemnasta").
   - Incorrect minute form (e.g., "trzydzieści szesnaście" instead of "trzydzieści sześć").

#### INFORMAL TIME FORMAT:
1. Structures:
   - **Minutes 1–29**: "[minutes in cardinal] po [hour in locative feminine ordinal]".
     - Example: 8:28 = "dwadzieścia osiem po ósmej".
   - **Minutes 31–59**: "za [remaining minutes to next hour in cardinal] [next hour in nominative feminine ordinal]".
     - Example: 8:45 = "za piętnaście dziewiąta".
   - **Minute 15**: "kwadrans po [hour in locative feminine ordinal]".
     - Example: 8:15 = "kwadrans po ósmej".
   - **Minute 30**: "wpół do [next hour in genitive feminine ordinal]".
     - Example: 8:30 = "wpół do dziewiątej".
2. Errors to catch:
   - Incorrect use of "po" or "za".
   - Incorrect locative/nominative/genitive forms.
   - Missing or extra words.

### TASK:
1. Detect if the user's answer is in formal or informal format.
2. Validate against the rules for the identified format.
3. Provide detailed feedback if there are errors.
4. Respond with the correct formal and informal formats.

### RESPONSE FORMAT:
Respond strictly in JSON. Do not include any additional text or explanations. Do not include "\`\`\`json" or any other header or footer. 

{
  "correct": <true/false>,
  "correctForm": {
    "formal": "EXPECTED FORMAL FORMAT",
    "informal": "EXPECTED INFORMAL FORMAT"
  },
  "comment": "Detailed feedback on errors. Explain why corrections are needed."
}`;




  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a very accurate and reliable Polish Language teacher. You asked the question {Jaka jest godzina?} from student.Validate the user's answer based on the prompt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-70b-8192",
    });

    const response = chatCompletion.choices[0]?.message?.content || "";

    console.log("Response:", response);
    // Parse JSON response
    const result = JSON.parse(response);

    return {
      correct: result.correct || false,
      correctForm: result.correctForm || { formal: "", informal: "" },
      comment: result.comment || "No comment provided.",
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      correct: false,
      correctForm: { formal: "", informal: "" },
      comment:
        "An error occurred while processing the response. Please try again.",
    };
  }
}
