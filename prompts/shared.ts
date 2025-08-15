// Common JSON formatting requirements used across multiple prompts
export const JSON_FORMATTING_REQUIREMENTS = `CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Use DOUBLE QUOTES for all property names and string values
- NO single quotes, NO trailing commas, NO comments
- Ensure all brackets and braces are properly closed`;

// Common response format instruction
export const JSON_ONLY_INSTRUCTION = "Return ONLY the JSON object above with no additional text.";

// Common instruction for no markdown
export const NO_MARKDOWN_INSTRUCTION = "Do not include any additional text or explanations. Do not include \"\\`\\`\\`json\" or any other header or footer.";

// Polish language learning context
export const POLISH_LEARNING_CONTEXT = "You are working with a Polish language learning application designed to help students at various proficiency levels.";

// Common validation feedback guidelines
export const VALIDATION_FEEDBACK_GUIDELINES = `FEEDBACK GUIDELINES:
- Use simple A1 level Polish language for feedback when applicable
- Be helpful and encouraging
- For typos or similar forms: Give hints that they're almost correct
- Don't be overly strict, focus on learning assistance`;

// Common difficulty level references
export const DIFFICULTY_LEVEL_REFERENCE = "Difficulty levels follow CEFR standards: A1 (beginner), A2 (elementary), B1 (intermediate), B2 (upper-intermediate), C1 (advanced), C2 (proficient).";

// Common concept categories reference
export const CONCEPT_CATEGORIES = `Concept categories:
- GRAMMAR: Sentence structures, verb conjugation patterns, case usage, prepositions, etc.
- VOCABULARY: Word groups, expressions, idioms, colloquialisms, thematic vocabulary, etc.`;