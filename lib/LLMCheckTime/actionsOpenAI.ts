"use server";

import OpenAI from "openai";

import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file using

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use the API key from environment variables
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
  - Time expression in written form in case of informal siutation is in 12-hour format even if the format of input time in digits is in 24-hour format.
    - Example : 16:57 = "za trzy piąta".
2. Errors to catch:
   - Incorrect use of "po" or "za".
   - Incorrect locative/nominative/genitive forms.
   - Missing or extra words.

### TASK:
1. Detect if the user's answer is in formal or informal format. 
2. Validate against the rules for the identified format. 
3. Response is correct if the answer is correct in identified format. User must enter correct formal OR informal format.
  - Example : Identifed foramt is informal and the answer is correct in informal format = "correct"
  - Example : Identifed foramt is informal and the answer is incorrect in informal format = "incorrect"
  - Example : Identifed foramt is formal and the answer is correct in formal format = "correct"
  - Example : Identifed foramt is formal and the answer is incorrect in formal format = "incorrect"
4. Validation process requires checking the answer in indentified format not in both. 
4. Provide detailed feedback if there are errors.
5. Respond with the correct formal and informal formats if answer is incorrect.

### RESPONSE FORMAT:
Respond strictly in JSON. Do not include any additional text or explanations. Do not include "\`\`\`json" or any other header or footer. 
The correct key is true if the answer is correct in identified format otherwise false.

{
  "correct": <true/false>,
  "correctForm": {
    "formal": "EXPECTED FORMAL FORMAT",
    "informal": "EXPECTED INFORMAL FORMAT"
  },
  "comment": "Detailed feedback on errors. Explain why corrections are needed."
}`;


  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            'You are a Polish language assistant who validates user responses to "Jaka jest godzina?" by checking time expressions, grammar, and spelling.',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const response = completion.choices[0]?.message?.content || "";
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
