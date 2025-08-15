import { MistakeType, QuestionLevel, QuestionType } from "@/lib/enum";

// New LLM validation prompt for immutable correct answers
export const LLM_ANSWER_VALIDATION_PROMPT = `Validate the user's answer against the CORRECT ANSWER provided. You MUST NOT modify or suggest a different correct answer.

QUESTION: {question}
USER'S ANSWER: {userAnswer}
CORRECT ANSWER (IMMUTABLE): {correctAnswer}
ATTEMPT NUMBER: {attemptNumber}

IMPORTANT: 
- The correct answer "{correctAnswer}" is IMMUTABLE and CANNOT be changed
- You must evaluate if the user's answer is semantically equivalent to the correct answer
- Provide helpful feedback without revealing the correct answer until attempt 3

FEEDBACK GUIDELINES:
- Attempt 1-2: Provide smart, indirect hints to help the user improve (DO NOT reveal the correct answer)
- Attempt 3: You may reference the correct answer in your feedback
- Use simple A1 level Polish language for feedback
- For typos or similar forms: Give hints that they're almost correct
- Be helpful and encouraging

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "isCorrect": boolean (true if semantically equivalent to correct answer),
  "feedback": "string (hint for attempts 1-2, can reference correct answer for attempt 3)",
  "confidenceLevel": number (0-1, how confident you are in the correctness evaluation),
  "errorType": "one of: ${Object.values(MistakeType).join(", ")} or null",
  "keywords": ["array", "of", "2-3", "keywords"],
  "questionLevel": "one of: ${Object.values(QuestionLevel).join(", ")}",
  "responseTime": number (estimated seconds)
}`;

// Legacy answer validation prompt (deprecated)
export const LEGACY_ANSWER_VALIDATION_PROMPT = `Validate the user's answer to the following question in the context of this course:

Course: {course}
Question: {question}
User's Answer: {userAnswer}
Attempt Number: {attemptNumber}

FEEDBACK GUIDELINES:
- Attempt 1-2: Provide smart, indirect, and creative feedback to help the user improve
- Attempt 3: Provide the correct answer
- Use simple A1 level Polish language for feedback
- For typos or similar forms: Give hints that they're almost correct and need to correct typo/form
- Don't be strict, be helpful and encouraging

RESPONSE FORMAT:
Return a JSON object with these required fields:
{
  "isCorrect": boolean,
  "feedback": "string (hint for attempts 1-2, correct answer for attempt 3)",
  "correctAnswer": "string",
  "questionType": "one of: ${Object.values(QuestionType).join(", ")}",
  "confidenceLevel": number (0-1),
  "errorType": "one of: ${Object.values(MistakeType).join(", ")} or null",
  "keywords": ["array", "of", "2-3", "keywords"],
  "category": "string (vocabulary, grammar, listening comprehension, etc.)",
  "questionLevel": "one of: ${Object.values(QuestionLevel).join(", ")}",
  "responseTime": number (estimated seconds)
}`;

// Question generation for practice sessions
export const PRACTICE_QUESTION_GENERATION_PROMPT = `Generate one question for a Polish language learning practice session based on the following course information:

{course}

GUIDELINES:
- The question should be in Polish and no longer than 3 sentences
- Suitable for an A1 level learner
- Creative and interesting to keep the learner engaged
- Self-contained and meaningful with sufficient context
- Do not ask about grammar rules directly; test them in context
- Do not ask for translations
- Do not ask questions that can have multiple correct answers

DIFFICULTY SCALING:
- Fewer than 3 previous questions: Basic vocabulary or simple sentence structures
- 3 to 5 previous questions: Moderately difficult within A1 (longer sentences, additional vocabulary)
- More than 5 previous questions: More challenging but still A1 (varied sentence patterns, contextual inference)
- If last two questions were similar: Make this question simpler to avoid overwhelming

If the course content is insufficient, generate a question based on general Polish A1 knowledge using the course content as reference.

Previous questions: {previousQuestions}`;

// System prompts for validation operations
export const LLM_VALIDATION_SYSTEM_PROMPT = `You are an AI assistant that validates answers for language learning. 
CRITICAL: You MUST NOT modify the provided correct answer. Your job is to determine if the user's answer is equivalent to the stored correct answer and provide appropriate feedback. Always respond with valid JSON only.`;

export const LEGACY_VALIDATION_SYSTEM_PROMPT = "You are an AI assistant that validates answers for language learning practice sessions. Always respond with valid JSON.";

export const PRACTICE_QUESTION_SYSTEM_PROMPT = "You are an experienced and wise Polish teacher that generates questions for Polish language learning practice sessions.";