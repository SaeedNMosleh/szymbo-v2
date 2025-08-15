import { QuestionType, QuestionLevel } from "@/lib/enum";

// Difficulty level guidelines for question generation
export const DIFFICULTY_GUIDELINES = {
  [QuestionLevel.A1]: "Use basic vocabulary, simple present tense, common everyday topics",
  [QuestionLevel.A2]: "Include past/future tenses, more vocabulary, basic cases",
  [QuestionLevel.B1]: "Complex sentences, all cases, conditional mood, broader topics",
  [QuestionLevel.B2]: "Advanced grammar, nuanced vocabulary, cultural contexts",
  [QuestionLevel.C1]: "Sophisticated language, idiomatic expressions, complex concepts",
  [QuestionLevel.C2]: "Native-level complexity, literary language, abstract concepts"
} as const;

// Question type prompts with descriptions, templates, and examples
export const QUESTION_TYPE_PROMPTS: Record<QuestionType, { description: string; template: string; example: string }> = {
  [QuestionType.BASIC_CLOZE]: {
    description: "Fill-in-the-blank questions with single word answers",
    template: "Create a sentence with a missing word (use _____ for the blank). The missing word should test the concept.",
    example: "Question: 'Ja _____ do sklepu.' Answer: 'idę'"
  },
  [QuestionType.MULTI_CLOZE]: {
    description: "Fill-in-the-blank questions with multiple missing words",
    template: "Create a sentence with 2-3 missing words (use _____ for each blank). Each blank tests related concepts.",
    example: "Question: 'Moja _____ _____ do pracy autobusem.' Answer: 'siostra jedzie'"
  },
  [QuestionType.VOCAB_CHOICE]: {
    description: "Multiple choice vocabulary questions",
    template: "Create a multiple choice question with 4 options. Only one option should be correct.",
    example: "Question: 'What does \"książka\" mean?' Options: ['book', 'table', 'chair', 'window'] Answer: 'book'"
  },
  [QuestionType.MULTI_SELECT]: {
    description: "Multiple choice questions with multiple correct answers",
    template: "Create a question where multiple options are correct. Provide 4-6 options with 2-3 correct answers.",
    example: "Question: 'Which are Polish cities?' Options: ['Warszawa', 'Berlin', 'Kraków', 'Paris', 'Gdańsk'] Answer: 'Warszawa,Kraków,Gdańsk'"
  },
  [QuestionType.CONJUGATION_TABLE]: {
    description: "Complete verb conjugation table with all 6 standard forms",
    template: "Ask to conjugate a verb in a specific tense (present/past/future) for all 6 persons. Return answers as comma-separated string in order: ja,ty,on/ona/ono,my,wy,oni/one",
    example: "Question: 'Conjugate \"mówić\" in present tense' Answer: 'mówię,mówisz,mówi,mówimy,mówicie,mówią'"
  },
  [QuestionType.CASE_TRANSFORM]: {
    description: "Questions about grammatical case transformations",
    template: "Give a word and ask for its transformation into a specific grammatical case.",
    example: "Question: 'Transform \"kot\" to accusative case' Answer: 'kota'"
  },
  [QuestionType.SENTENCE_TRANSFORM]: {
    description: "Transform sentences between different grammatical forms",
    template: "Ask to transform sentences (e.g., affirmative to negative, present to past).",
    example: "Question: 'Transform to past tense: Ja czytam książkę' Answer: 'Ja czytałem książkę'"
  },
  [QuestionType.WORD_ARRANGEMENT]: {
    description: "Arrange words to form correct sentence",
    template: "Provide scrambled words that need to be arranged into correct Polish sentence order.",
    example: "Question: 'Arrange: [\"książkę\", \"czytam\", \"ciekawą\"]' Answer: 'Czytam ciekawą książkę'"
  },
  [QuestionType.TRANSLATION_PL]: {
    description: "Translate from English to Polish",
    template: "Provide an English phrase and ask for Polish translation.",
    example: "Question: 'Translate: I am reading a book' Answer: 'Czytam książkę'"
  },
  [QuestionType.TRANSLATION_EN]: {
    description: "Translate from Polish to English",
    template: "Provide a Polish phrase and ask for English translation.",
    example: "Question: 'Translate: Lubię kawę' Answer: 'I like coffee'"
  },
  [QuestionType.AUDIO_COMPREHENSION]: {
    description: "Audio-based comprehension questions",
    template: "Create questions about audio content (provide audio URL).",
    example: "Question: 'What did the speaker say?' Answer: 'Dzień dobry'"
  },
  [QuestionType.VISUAL_VOCABULARY]: {
    description: "Image-based vocabulary questions",
    template: "Create questions about images (provide image URL).",
    example: "Question: 'What is shown in the image?' Answer: 'dom'"
  },
  [QuestionType.DIALOGUE_COMPLETE]: {
    description: "Complete dialogue conversations",
    template: "Provide partial dialogue and ask to complete it.",
    example: "Question: 'A: Jak się masz? B: _____' Answer: 'Dobrze, dziękuję'"
  },
  [QuestionType.ASPECT_PAIRS]: {
    description: "Perfective and imperfective verb aspects",
    template: "Ask about verb aspect pairs in Polish.",
    example: "Question: 'Give the perfective form of \"czytać\"' Answer: 'przeczytać'"
  },
  [QuestionType.DIMINUTIVE_FORMS]: {
    description: "Polish diminutive word forms",
    template: "Ask for diminutive forms of nouns.",
    example: "Question: 'Give the diminutive form of \"kot\"' Answer: 'kotek'"
  },
  [QuestionType.SCENARIO_RESPONSE]: {
    description: "Respond to specific scenarios",
    template: "Provide a scenario and ask for appropriate response.",
    example: "Question: 'You enter a shop. What do you say?' Answer: 'Dzień dobry'"
  },
  [QuestionType.CULTURAL_CONTEXT]: {
    description: "Polish culture and context questions",
    template: "Ask about Polish customs, culture, or context.",
    example: "Question: 'When do Poles celebrate name days?' Answer: 'Throughout the year'"
  },
  [QuestionType.Q_A]: {
    description: "Question and answer format",
    template: "Create a question that requires a specific answer related to the concept.",
    example: "Question: 'Co robisz wieczorem?' Answer: 'Czytam książki' (or similar appropriate answer)"
  }
} as const;

// Main question generation prompt template
export const QUESTION_GENERATION_BASE_PROMPT = `You are an expert Polish language teacher creating {questionType} questions.

TASK: Generate {quantity} high-quality Polish learning questions.

QUESTION TYPE: {typeDescription}
TEMPLATE: {typeTemplate}
EXAMPLE: {typeExample}

TARGET CONCEPTS: {conceptNames}
CONCEPT DETAILS:
{conceptDescriptions}

DIFFICULTY LEVEL: {difficulty}
{difficultyGuidelines}

{specialInstructions}

REQUIREMENTS:
1. Each question must test at least one of the target concepts
2. Questions should be appropriate for {difficulty} level learners
3. Ensure variety - avoid repetitive patterns
4. Use authentic Polish language and realistic contexts
5. For multiple choice questions, include plausible distractors
6. For fill-in-the-blank, use contextual clues appropriately
7. In targetConcepts field, use the exact concept NAMES from the list above, not IDs
{conjugationSpecialRequirements}

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed

RESPONSE FORMAT (STRICT JSON):
{
  "questions": [
    {
      "question": "Question text with blanks (___) if applicable",
      "correctAnswer": "Correct answer or comma-separated answers for multi-select",
      "targetConcepts": ["concept_name_1", "concept_name_2"],
      "options": ["option1", "option2", "option3", "option4"]
    }
  ]
}

EXAMPLE VALID JSON RESPONSE:
{
  "questions": [
    {
      "question": "Ja _____ do sklepu.",
      "correctAnswer": "idę",
      "targetConcepts": ["{exampleConceptName}"],
      "options": []
    }
  ]
}

Generate exactly {quantity} questions. Return ONLY the JSON object above with no additional text.`;

// Conjugation special requirements template
export const CONJUGATION_SPECIAL_REQUIREMENTS = `
8. CONJUGATION SPECIAL REQUIREMENTS:
   - Randomly select tense: present, past, or future
   - Ask to conjugate for ALL 6 standard forms: ja, ty, on/ona/ono, my, wy, oni/one
   - Return correctAnswer as comma-separated string in exact order: form1,form2,form3,form4,form5,form6
   - Question format: "Conjugate [verb] in [tense] tense"
   - Example: "Conjugate 'być' in present tense" → "jestem,jesteś,jest,jesteśmy,jesteście,są"`;

// Question regeneration prompt template
export const QUESTION_REGENERATION_BASE_PROMPT = `You are regenerating a Polish learning question that needs improvement.

ORIGINAL QUESTION:
Question: {originalQuestion}
Answer: {originalAnswer}
Type: {questionType}
{originalOptions}

TARGET CONCEPTS:
{conceptDescriptions}

TASK: Create a NEW, DIFFERENT question of the same type testing the same concepts.
- Use different wording, context, or examples
- Maintain the same difficulty level ({difficulty})
- Follow the same format requirements

{typeDescription}
{typeTemplate}

{specialInstructions}

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed

RESPONSE FORMAT (STRICT JSON):
{
  "question": {
    "question": "New question text",
    "correctAnswer": "Correct answer",
    "targetConcepts": ["concept_id_1"],
    "options": ["option1", "option2", "option3", "option4"]
  }
}

Return ONLY the JSON object above with no additional text.`;

// System prompts for question generation
export const QUESTION_GENERATION_SYSTEM_PROMPT = "You are an expert Polish language teacher creating high-quality learning questions for students.";