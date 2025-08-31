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

// Question type prompts with descriptions, templates, and examples
export const QUESTION_TYPE_PROMPTS: Record<
  QuestionType,
  { description: string; template: string; example: string }
> = {
  [QuestionType.BASIC_CLOZE]: {
    description: "Fill-in-the-blank questions with single word answers",
    template:
      "Create a sentence with a missing word (use _____ for the blank). The missing word should test the concept.",
    example: "Question: 'Ja _____ do sklepu.' Answer: 'idę'",
  },
  [QuestionType.MULTI_CLOZE]: {
    description: "Fill-in-the-blank questions with multiple missing words",
    template:
      "Create a sentence with 2-3 missing words (use _____ for each blank). Each blank tests related concepts.",
    example:
      "Question: 'Moja _____ _____ do pracy autobusem.' Answer: 'siostra jedzie'",
  },
  [QuestionType.VOCAB_CHOICE]: {
    description: "Multiple choice vocabulary questions",
    template:
      "Create a multiple choice question with 4 options. Only one option should be correct.",
    example:
      "Question: 'What does \"książka\" mean?' Options: ['book', 'table', 'chair', 'window'] Answer: 'book'",
  },
  [QuestionType.MULTI_SELECT]: {
    description: "Multiple choice questions with multiple correct answers",
    template:
      "Create a question where multiple options are correct. Provide 4-6 options with 2-3 correct answers.",
    example:
      "Question: 'Which are Polish cities?' Options: ['Warszawa', 'Berlin', 'Kraków', 'Paris', 'Gdańsk'] Answer: 'Warszawa,Kraków,Gdańsk'",
  },
  [QuestionType.CONJUGATION_TABLE]: {
    description: "Complete verb conjugation table with all 6 standard forms",
    template:
      "Ask to conjugate a verb in a specific tense (present/past/future) for all 6 persons. Return answers as comma-separated string in order: ja,ty,on/ona/ono,my,wy,oni/one",
    example:
      "Question: 'Conjugate \"mówić\" in present tense' Answer: 'mówię,mówisz,mówi,mówimy,mówicie,mówią'",
  },
  [QuestionType.CASE_TRANSFORM]: {
    description: "Questions about grammatical case transformations",
    template:
      "Give a word and ask for its transformation into a specific grammatical case.",
    example: "Question: 'Transform \"kot\" to accusative case' Answer: 'kota'",
  },
  [QuestionType.SENTENCE_TRANSFORM]: {
    description: "Transform sentences between different grammatical forms",
    template:
      "Ask to transform sentences (e.g., affirmative to negative, present to past).",
    example:
      "Question: 'Transform to past tense: Ja czytam książkę' Answer: 'Ja czytałem książkę'",
  },
  [QuestionType.WORD_ARRANGEMENT]: {
    description: "Arrange words to form correct sentence",
    template:
      "Provide a question where the words to arrange are given in the options array. The question text should be a generic instruction (e.g., 'Arrange these words to form a correct sentence:'). Place the scrambled words ONLY in the options array in random order, not in the question text. Return the correct sentence as the correctAnswer. The order of options should not matched with correct order to challenge the learner to find the order",
    example:
      "Question: 'Arrange these words to form a correct sentence:' Options: ['książkę', 'czytam', 'ciekawą'] Answer: 'Czytam ciekawą książkę'",
  },
  [QuestionType.TRANSLATION_PL]: {
    description: "Translate from English to Polish",
    template: "Provide an English phrase and ask for Polish translation.",
    example:
      "Question: 'Translate: I am reading a book' Answer: 'Czytam książkę'",
  },
  [QuestionType.TRANSLATION_EN]: {
    description: "Translate from Polish to English",
    template: "Provide a Polish phrase and ask for English translation.",
    example: "Question: 'Translate: Lubię kawę' Answer: 'I like coffee'",
  },
  [QuestionType.AUDIO_COMPREHENSION]: {
    description: "Audio-based comprehension questions",
    template: "Create questions about audio content (provide audio URL).",
    example: "Question: 'What did the speaker say?' Answer: 'Dzień dobry'",
  },
  [QuestionType.VISUAL_VOCABULARY]: {
    description: "Image-based vocabulary questions",
    template: "Create questions about images (provide image URL).",
    example: "Question: 'What is shown in the image?' Answer: 'dom'",
  },
  [QuestionType.DIALOGUE_COMPLETE]: {
    description: "Complete dialogue conversations",
    template: "Provide partial dialogue and ask to complete it.",
    example: "Question: 'A: Jak się masz? B: _____' Answer: 'Dobrze, dziękuję'",
  },
  [QuestionType.ASPECT_PAIRS]: {
    description: "Perfective and imperfective verb aspects",
    template: "Ask about verb aspect pairs in Polish.",
    example:
      "Question: 'Give the perfective form of \"czytać\"' Answer: 'przeczytać'",
  },
  [QuestionType.DIMINUTIVE_FORMS]: {
    description: "Polish diminutive word forms",
    template: "Ask for diminutive forms of nouns.",
    example: "Question: 'Give the diminutive form of \"kot\"' Answer: 'kotek'",
  },
  [QuestionType.SCENARIO_RESPONSE]: {
    description: "Respond to specific scenarios",
    template: "Provide a scenario and ask for appropriate response.",
    example:
      "Question: 'You enter a shop. What do you say?' Answer: 'Dzień dobry'",
  },
  [QuestionType.CULTURAL_CONTEXT]: {
    description: "Polish culture and context questions",
    template: "Ask about Polish customs, culture, or context.",
    example:
      "Question: 'When do Poles celebrate name days?' Answer: 'Throughout the year'",
  },
  [QuestionType.Q_A]: {
    description: "Question and answer format",
    template:
      "Create a question that requires a specific answer related to the concept.",
    example:
      "Question: 'Co robisz wieczorem?' Answer: 'Czytam książki' (or similar appropriate answer)",
  },
} as const;

// Enhanced question generation prompt with rich context integration and self-containment validation
export const QUESTION_GENERATION_BASE_PROMPT = `You are an expert Polish language pedagogy specialist creating {questionType} questions that test genuine understanding and practical application.

## COMPREHENSIVE TASK BRIEFING:
Generate {quantity} exceptional, self-contained Polish learning questions that demonstrate mastery of target concepts through meaningful contexts.

## QUESTION TYPE SPECIFICATIONS:
**Type**: {questionType}
**Description**: {typeDescription}
**Template Guidelines**: {typeTemplate}
**Reference Example**: {typeExample}

## RICH CONCEPT INTELLIGENCE:
**Target Concept Names**: {conceptNames}

### DETAILED CONCEPT ANALYSIS:
{conceptDescriptions}

### CONCEPT METADATA AVAILABLE:
{conceptMetadata}

## LEARNER CONTEXT:
**Difficulty Level**: {difficulty}
**Level Guidelines**: {difficultyGuidelines}
**Performance Data**: {performanceContext}

{specialInstructions}

## SELF-CONTAINMENT & QUALITY REQUIREMENTS:

### 1. SELF-SUFFICIENCY VALIDATION:
- **Complete Context**: Every question must provide all necessary information for answering
- **No External Dependencies**: Avoid references to personal names, specific locations, or cultural knowledge not explained
- **Linguistic Completeness**: Include sufficient grammatical and semantic cues
- **Answer Derivability**: Learners should be able to deduce the answer from the question context alone

### 2. MEANINGFUL CONTENT CREATION:
- **Authentic Scenarios**: Use realistic, practical situations Polish learners encounter
- **Conceptual Depth**: Test understanding of underlying language patterns, not just memorization
- **Progressive Complexity**: Build questions that challenge learners at their current level while preparing for the next
- **Cultural Integration**: Include cultural contexts that enhance learning relevance

### 3. PRECISION & RELEVANCE FILTERS:
- **Concept Alignment**: Each question must directly test at least one specified target concept
- **Avoid Irrelevant Details**: No questions about personal preferences, names, or arbitrary information
- **Focus on Transferable Knowledge**: Test skills and patterns learners can apply broadly
- **Eliminate Ambiguity**: Ensure single correct interpretation and answer

### 4. ENHANCED QUESTION CRAFTING:
- **Rich Contextualization**: Embed target concepts in meaningful, complete scenarios
- **Appropriate Complexity**: Match cognitive load to difficulty level specifications
- **Varied Assessment Formats**: Use different angles to test the same concept
- **Answer Prediction**: Include estimated success rate and common mistake patterns

### 5. DISTRACTOR INTELLIGENCE (for Multiple Choice):
- **Linguistically Plausible**: Incorrect options should represent common learner errors
- **Conceptually Related**: Wrong answers should test understanding of related but distinct concepts
- **Difficulty Appropriate**: Distractors should be challenging but not misleading for the target level

### 6. CONTEXT SUFFICIENCY VALIDATION:
Before creating each question, verify:
- Can a learner at this level answer without external knowledge?
- Does the question provide adequate linguistic context?
- Are all required vocabulary items either familiar at this level or explained?
- Does the scenario make cultural sense to non-Polish speakers?

## ADVANCED QUESTION ENHANCEMENT STRATEGIES:

### For VOCABULARY Questions:
- Use concept's vocabularyData (word, translation, partOfSpeech, gender) for precise testing
- Create contexts where the target word's meaning is essential to understanding
- Test collocations and usage patterns, not just isolated definitions
- Include morphological variations (plural forms, case endings) when relevant

### For GRAMMAR Questions:
- Test functional usage in communicative contexts, not abstract rules
- Use concept's examples as inspiration for varied scenarios
- Focus on meaning-changing grammatical choices
- Connect grammar to practical communication needs

### For CULTURAL/CONTEXTUAL Questions:
- Explain cultural elements within the question context
- Test application of cultural knowledge, not memorization of facts
- Connect to language patterns and usage preferences

## PERFORMANCE ANALYTICS INTEGRATION:
{analyticsGuidance}

## EXAMPLE ENHANCED QUESTIONS:

**SELF-CONTAINED VOCABULARY QUESTION:**
Instead of: "What does 'książka' mean?"
Create: "Marta goes to the library to borrow something to read at home. She's looking for a '____' - what is she seeking?"
- Context provides functional understanding
- Tests word knowledge in meaningful scenario
- No external cultural assumptions

**SELF-CONTAINED GRAMMAR QUESTION:**
Instead of: "Conjugate 'być' in present tense"
Create: "Complete this conversation: A: 'Gdzie ____ twoja siostra?' B: 'Ona ____ w szkole, a ja ____ w domu.' (Where is your sister? She is at school, and I am at home.)"
- Tests conjugation in communicative context
- Provides translation for clarity
- Demonstrates functional usage

## ENHANCED OUTPUT REQUIREMENTS:

### CORE QUESTION STANDARDS:
1. **Target Concept Integration**: Each question must test at least one specified target concept through practical application
2. **Level Appropriateness**: Questions must align with {difficulty} cognitive and linguistic demands
3. **Self-Containment**: All necessary context provided within the question - no external references required
4. **Meaningful Assessment**: Test genuine understanding of language patterns and functional usage
5. **Cultural Sensitivity**: Include Polish cultural elements only when explained within context
6. **Answer Uniqueness**: Ensure single, unambiguous correct answer per question
7. **Concept Name Usage**: In targetConcepts field, use exact concept NAMES from the provided list

### METADATA ENRICHMENT:
8. **Success Rate Estimation**: Predict likely success rate (0.0-1.0) based on difficulty and concept complexity
9. **Common Mistake Identification**: Anticipate typical learner errors for targeted feedback
10. **Learning Objective Alignment**: Connect each question to specific learning outcomes
11. **Progressive Scaffolding**: Design questions that build toward next proficiency level

{conjugationSpecialRequirements}

## ENHANCED JSON RESPONSE FORMAT:

### FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values  
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed

### COMPREHENSIVE RESPONSE STRUCTURE:

{
  "questions": [
    {
      "question": "Self-contained question text with complete context and blanks (___) if applicable",
      "correctAnswer": "Precise correct answer or comma-separated answers for multi-select",
      "targetConcepts": ["exact_concept_name_1", "exact_concept_name_2"],
      "options": ["option1", "option2", "option3", "option4"],
      "questionMetadata": {
        "estimatedSuccessRate": 0.75, // 0.0-1.0 prediction based on difficulty
        "cognitiveLoad": "low|medium|high", // Complexity assessment
        "selfContainmentScore": 0.95, // 0.0-1.0 completeness rating
        "contextSufficiency": "complete", // "complete|partial|insufficient"
        "expectedMistakes": ["common_error_1", "common_error_2"],
        "learningObjective": "specific skill or knowledge being tested",
        "culturalElements": ["element1"], // Cultural aspects included, if any
        "grammarFocus": ["specific_grammar_pattern"], // For grammar questions
        "vocabularyFocus": ["specific_words_tested"] // For vocabulary questions
      },
      "validationChecks": {
        "hasExternalDependencies": false, // Must be false for good questions
        "requiresCulturalKnowledge": false, // Must be false unless explained in context
        "containsPersonalReferences": false, // Must be false
        "providesAdequateContext": true, // Must be true
        "testsTransferableSkills": true // Must be true
      }
    }
  ],
  "generationMetadata": {
    "totalQuestionsGenerated": {quantity},
    "averageEstimatedSuccessRate": 0.0, // Average across all questions
    "complexityDistribution": {
      "low": 0,
      "medium": 0, 
      "high": 0
    },
    "conceptsCovered": ["list", "of", "all", "concepts", "tested"],
    "qualityScore": 0.0, // Overall batch quality (0.0-1.0)
    "recommendedUseContext": "practice|assessment|review" // When to use these questions
  }
}

### ENHANCED EXAMPLE RESPONSE:
{
  "questions": [
    {
      "question": "Anna is at a restaurant and wants to order something warm to drink with breakfast. She asks the waiter: 'Poproszę _____ z mlekiem.' (I would like _____ with milk.) What does she want?",
      "correctAnswer": "kawę",
      "targetConcepts": ["Morning Beverages Vocabulary", "Restaurant Ordering Expressions"],
      "options": ["kawę", "wodę", "sok", "piwo"],
      "questionMetadata": {
        "estimatedSuccessRate": 0.80,
        "cognitiveLoad": "medium",
        "selfContainmentScore": 0.95,
        "contextSufficiency": "complete",
        "expectedMistakes": ["confusion with other beverages", "accusative case errors"],
        "learningObjective": "Apply vocabulary knowledge in authentic dining context",
        "culturalElements": ["Polish breakfast customs"],
        "grammarFocus": ["accusative case with direct objects"],
        "vocabularyFocus": ["kawę", "restaurant ordering vocabulary"]
      },
      "validationChecks": {
        "hasExternalDependencies": false,
        "requiresCulturalKnowledge": false,
        "containsPersonalReferences": false,
        "providesAdequateContext": true,
        "testsTransferableSkills": true
      }
    }
  ],
  "generationMetadata": {
    "totalQuestionsGenerated": 1,
    "averageEstimatedSuccessRate": 0.80,
    "complexityDistribution": {"low": 0, "medium": 1, "high": 0},
    "conceptsCovered": ["Morning Beverages Vocabulary", "Restaurant Ordering Expressions"],
    "qualityScore": 0.87,
    "recommendedUseContext": "practice"
  }
}

Generate exactly {quantity} enhanced questions following this comprehensive structure. Return ONLY the JSON object with no additional text.`;

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
