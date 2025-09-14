import { QuestionType, QuestionLevel } from "@/lib/enum";

// Difficulty level guidelines for question generation
export const DIFFICULTY_GUIDELINES = {
  [QuestionLevel.A1]:
    "Use basic vocabulary, simple present tense, common everyday topics",
  [QuestionLevel.A2]:
    "Include past/future tenses, more vocabulary, basic cases",
  [QuestionLevel.B1]:
    "Complex sentences, all cases, conditional mood, broader topics",
  [QuestionLevel.B2]: "Advanced grammar, nuanced vocabulary, cultural contexts",
  [QuestionLevel.C1]:
    "Sophisticated language, idiomatic expressions, complex concepts",
  [QuestionLevel.C2]:
    "Native-level complexity, literary language, abstract concepts",
} as const;

// Question type categories for differentiated generation
export enum QuestionCategory {
  CLOSED_ENDED = "closed_ended", // Exact answers: vocab, conjugation, multi-select
  OPEN_ENDED = "open_ended", // Flexible answers: translations, Q&A, scenarios
  STRUCTURAL = "structural", // Grammar transformations: sentence/case transforms
  CREATIVE = "creative", // Dialogue completion, cultural context
  ARRANGEMENT = "arrangement", // Word arrangement, ordering tasks
}

// Category-specific generation strategies
export const CATEGORY_STRATEGIES = {
  [QuestionCategory.CLOSED_ENDED]: {
    validation: "exact_match",
    flexibility: "low",
    feedback: "precise",
    description: "Questions with single correct answers requiring exact matching"
  },
  [QuestionCategory.OPEN_ENDED]: {
    validation: "semantic_equivalence",
    flexibility: "high",
    feedback: "contextual",
    description: "Questions allowing multiple correct responses with equivalent meaning"
  },
  [QuestionCategory.STRUCTURAL]: {
    validation: "grammatical_correctness",
    flexibility: "medium",
    feedback: "rule_based",
    description: "Grammar transformation questions requiring structural accuracy"
  },
  [QuestionCategory.CREATIVE]: {
    validation: "contextual_appropriateness",
    flexibility: "high",
    feedback: "holistic",
    description: "Creative responses requiring cultural and situational awareness"
  },
  [QuestionCategory.ARRANGEMENT]: {
    validation: "order_correctness",
    flexibility: "low",
    feedback: "structural",
    description: "Ordering and arrangement tasks requiring correct sequence"
  }
};

// Question type to category mapping
export const QUESTION_TYPE_CATEGORIES: Record<QuestionType, QuestionCategory> = {
  [QuestionType.VOCAB_CHOICE]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.MULTI_SELECT]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.CONJUGATION_TABLE]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.ASPECT_PAIRS]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.DIMINUTIVE_FORMS]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.VISUAL_VOCABULARY]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.AUDIO_COMPREHENSION]: QuestionCategory.CLOSED_ENDED,

  [QuestionType.BASIC_CLOZE]: QuestionCategory.CLOSED_ENDED,
  [QuestionType.MULTI_CLOZE]: QuestionCategory.CLOSED_ENDED,

  [QuestionType.TRANSLATION_PL]: QuestionCategory.OPEN_ENDED,
  [QuestionType.TRANSLATION_EN]: QuestionCategory.OPEN_ENDED,
  [QuestionType.Q_A]: QuestionCategory.OPEN_ENDED,

  [QuestionType.SENTENCE_TRANSFORM]: QuestionCategory.STRUCTURAL,
  [QuestionType.CASE_TRANSFORM]: QuestionCategory.STRUCTURAL,

  [QuestionType.DIALOGUE_COMPLETE]: QuestionCategory.CREATIVE,
  [QuestionType.SCENARIO_RESPONSE]: QuestionCategory.CREATIVE,
  [QuestionType.CULTURAL_CONTEXT]: QuestionCategory.CREATIVE,

  [QuestionType.WORD_ARRANGEMENT]: QuestionCategory.ARRANGEMENT,
};

// Question type prompts with descriptions, templates, and examples
export const QUESTION_TYPE_PROMPTS: Record<
  QuestionType,
  { description: string; template: string; example: string; category: QuestionCategory }
> = {
  [QuestionType.BASIC_CLOZE]: {
    description:
      "Create a fill-in-the-blank question with one missing word, using clear grammatical and contextual cues (e.g., case, tense, agreement) to ensure exactly one correct single-word answer.",
    template:
      "Generate a Polish question with one blank ('_____') in a main sentence, testing the target concept. Use natural, idiomatic Polish and precise context (e.g., gender, case, tense, fixed collocations) to guarantee one unique single-word answer, avoiding synonyms or alternative inflections. Optionally, add a short second sentence for context if needed to ensure clarity. Avoid cloze of function words (e.g., prepositions, conjunctions) or open-ended verbs (e.g., 'myślę', 'sądzę'). Keep sentences concise and engaging, varying topics for interest.",
    example:
      "A1 Question: 'Ja _____ do szkoły.' Answer: 'idę'\nB1 Question: 'Kupiłem _____ dla mamy. To był prezent.' Answer: 'kwiaty'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.MULTI_CLOZE]: {
    description:
      "Create a fill-in-the-blank question with 2–3 missing words, each with exactly one correct single-word answer, supported by clear grammatical and contextual cues in 1–2 sentences.",
    template:
      "Generate a Polish question using 1–2 sentences with 2–3 blanks ('_____'), each for a single-word answer testing the target concepts. Use natural, idiomatic Polish and precise context (e.g., specific case, tense, agreement, fixed collocations) to ensure each blank has exactly one correct answer, with no synonyms or alternative inflections possible. Avoid cloze of function words (e.g., prepositions, conjunctions) or open-ended verbs (e.g., opinion verbs like 'myślę', 'sądzę'). Vary topics and scenarios (e.g., daily life, travel, culture) for engagement. For A1–A2, keep total length ≤ 110 characters; for higher levels, keep concise but vivid.",
    example:
      "A1 Question: 'Codziennie _____ kawę. Potem _____ gazetę.' Answer: 'piję, czytam'\nB1 Question: 'Kasia kupiła książkę. Potrzebuje _____ torby na _____ książkę.' Answer: 'małej, nową'\nB2 Question: 'Tomek pisze list. _____ go i _____ w skrzynce.' Answer: 'skończył, zostawił'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.VOCAB_CHOICE]: {
    description: "Multiple choice vocabulary questions",
    template:
      "Create a multiple choice question with 4 options. Only one option should be correct.",
    example:
      "Question: 'What does \"książka\" mean?' Options: ['book', 'table', 'chair', 'window'] Answer: 'book'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.MULTI_SELECT]: {
    description: "Multiple choice questions with multiple correct answers",
    template:
      "Create a question where multiple options are correct. Provide 4-6 options with 2-3 correct answers.",
    example:
      "Question: 'Which are Polish cities?' Options: ['Warszawa', 'Berlin', 'Kraków', 'Paris', 'Gdańsk'] Answer: 'Warszawa,Kraków,Gdańsk'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.CONJUGATION_TABLE]: {
    description: "Complete verb conjugation table with all 6 standard forms",
    template:
      "Ask to conjugate a verb in a specific tense (present/past/future) for all 6 persons. Return answers as comma-separated string in order: ja,ty,on/ona/ono,my,wy,oni/one",
    example:
      "Question: 'Conjugate \"mówić\" in present tense' Answer: 'mówię,mówisz,mówi,mówimy,mówicie,mówią'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.CASE_TRANSFORM]: {
    description: "Questions about grammatical case transformations",
    template:
      "Give a word and ask for its transformation into a specific grammatical case.",
    example: "Question: 'Transform \"kot\" to accusative case' Answer: 'kota'",
    category: QuestionCategory.STRUCTURAL,
  },
  [QuestionType.SENTENCE_TRANSFORM]: {
    description: "Transform sentences between different grammatical forms",
    template:
      "Ask to transform sentences (e.g., affirmative to negative, present to past).",
    example:
      "Question: 'Transform to past tense: Ja czytam książkę' Answer: 'Ja czytałem książkę'",
    category: QuestionCategory.STRUCTURAL,
  },
  [QuestionType.WORD_ARRANGEMENT]: {
    description: "Arrange words to form correct sentence",
    template:
      "Provide a question where the words to arrange are given in the options array. The question text should be a generic instruction (e.g., 'Arrange these words to form a correct sentence:'). Place the scrambled words ONLY in the options array in random order, not in the question text. Return the correct sentence as the correctAnswer. The order of options should not matched with correct order to challenge the learner to find the order",
    example:
      "Question: 'Arrange these words to form a correct sentence:' Options: ['książkę', 'czytam', 'ciekawą'] Answer: 'Czytam ciekawą książkę'",
    category: QuestionCategory.ARRANGEMENT,
  },
  [QuestionType.TRANSLATION_PL]: {
    description: "Translate from English to Polish",
    template: "Provide an English phrase and ask for Polish translation.",
    example:
      "Question: 'Translate: I am reading a book' Answer: 'Czytam książkę'",
    category: QuestionCategory.OPEN_ENDED,
  },
  [QuestionType.TRANSLATION_EN]: {
    description: "Translate from Polish to English",
    template: "Provide a Polish phrase and ask for English translation.",
    example: "Question: 'Translate: Lubię kawę' Answer: 'I like coffee'",
    category: QuestionCategory.OPEN_ENDED,
  },
  [QuestionType.AUDIO_COMPREHENSION]: {
    description: "Audio comprehension questions",
    template:
      "Describe a brief conversation context, ask what was said. Keep description short.",
    example:
      "Question: 'W sklepie klient mówi do sprzedawcy coś grzecznego na powitanie. Co powiedział?' Answer: 'Dzień dobry'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.VISUAL_VOCABULARY]: {
    description: "Visual vocabulary questions",
    template:
      "Describe a scene briefly, ask for the Polish word. Keep description minimal but clear.",
    example:
      "Question: 'W parku widać duże drzewo z zielonymi liśćmi. Co to jest?' Answer: 'dąb'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.DIALOGUE_COMPLETE]: {
    description: "Complete dialogue conversations",
    template: "Provide partial dialogue and ask to complete it.",
    example: "Question: 'A: Jak się masz? B: _____' Answer: 'Dobrze, dziękuję'",
    category: QuestionCategory.CREATIVE,
  },
  [QuestionType.ASPECT_PAIRS]: {
    description: "Perfective and imperfective verb aspects",
    template: "Ask about verb aspect pairs in Polish.",
    example:
      "Question: 'Give the perfective form of \"czytać\"' Answer: 'przeczytać'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.DIMINUTIVE_FORMS]: {
    description: "Polish diminutive word forms",
    template: "Ask for diminutive forms of nouns.",
    example: "Question: 'Give the diminutive form of \"kot\"' Answer: 'kotek'",
    category: QuestionCategory.CLOSED_ENDED,
  },
  [QuestionType.SCENARIO_RESPONSE]: {
    description: "Social situation response questions",
    template: "Brief social scenario, ask for appropriate Polish response.",
    example:
      "Question: 'Wchodzisz do sklepu. Co mówisz?' Answer: 'Dzień dobry'",
    category: QuestionCategory.CREATIVE,
  },
  [QuestionType.CULTURAL_CONTEXT]: {
    description: "Polish culture questions",
    template:
      "Ask about Polish customs or traditions. Provide context if needed.",
    example:
      "Question: 'Jak się nazywa polskie święto, kiedy ludzie świętują swoje imię?' Answer: 'Imieniny'",
    category: QuestionCategory.CREATIVE,
  },
  [QuestionType.Q_A]: {
    description: "Question and answer format",
    template:
      "Create a question that requires a specific answer related to the concept.",
    example:
      "Question: 'Co robisz wieczorem?' Answer: 'Czytam książki' (or similar appropriate answer)",
    category: QuestionCategory.OPEN_ENDED,
  },
} as const;

// Enhanced question generation prompt with category-specific guidance
export const QUESTION_GENERATION_BASE_PROMPT = `Generate {quantity} Polish {questionType} questions testing these concepts: {conceptNames}

## QUESTION CATEGORY: {questionCategory}
Strategy: {categoryStrategy}
Validation: {categoryValidation}
Flexibility: {categoryFlexibility}

## CORE RULES:
- Questions in Polish only - NO English translations or explanations in parentheses
- Ensure each question is self-contained, sensible, and has clear, unambiguous correct answers.
- User does not have access to concept descriptions - They are guideline for you to generate question.
- Add as much context as needed to ensure clarity and uniqueness of answers.
- Self-contained - no external URLs, images, or audio file references
- Return valid JSON only

## QUESTION REQUIREMENTS:
Type: {questionType}
Description: {typeDescription}
Template: {typeTemplate}
Example: {typeExample}

## CATEGORY-SPECIFIC GUIDANCE:
{categoryGuidance}

## CONCEPTS TO TEST:
{conceptDescriptions}

## DIFFICULTY LEVEL: {difficulty}

{specialInstructions}

{conjugationSpecialRequirements}

{analyticsGuidance}

## JSON FORMAT (REQUIRED):
{
  "questions": [
    {
      "question": "Brief Polish question text (use _____ for blanks)",
      "correctAnswer": "Correct answer",
      "targetConcepts": ["exact_concept_name"],
      "options": ["option1", "option2", "option3", "option4"]
    }
  ]
}

Return ONLY valid JSON - no markdown, no explanations, no code blocks.`;

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
export const QUESTION_GENERATION_SYSTEM_PROMPT =
  "You are an expert Polish language teacher creating high-quality learning questions for students.";
