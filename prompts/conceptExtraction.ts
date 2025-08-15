// Concept extraction from course content prompt
export const CONCEPT_EXTRACTION_BASE_PROMPT = `
You are tasked with extracting language learning concepts from Polish language course materials and suggesting tags for discovery.

## COURSE CONTENT:
- Keywords: {keywords}
- New Vocabulary Words: {newWords}
- Notes: {notes}
- Practice Content: {practice}
{homework}

## EXISTING TAGS IN SYSTEM:
{existingTags}

## TASK:
Extract clearly defined language concepts from the above content, following these guidelines:

1. Categorize each concept as either GRAMMAR or VOCABULARY.
   - GRAMMAR: Sentence structures, verb conjugation patterns, case usage, etc.
   - VOCABULARY: Word groups, expressions, idioms, colloquialisms, etc.

2. For each concept:
   - Provide a clear, descriptive name
   - Write a concise but comprehensive description
   - Include 2-4 examples from the content
   - Note where in the content you found this concept
   - Assign a confidence score (0.0-1.0) indicating how clearly this concept is present
   - Suggest a difficulty level (A1, A2, B1, B2, C1, or C2)
   - Suggest 3-5 tags for discovery purposes

3. For suggested tags:
   - Use existing tags when appropriate for consistency
   - Create new tags when needed for better discovery
   - Focus on searchable keywords that help find concepts
   - Include grammatical features, semantic categories, difficulty markers
   - Each tag should have a confidence score (0.0-1.0)

## EXAMPLES:

Good GRAMMAR concept:
{
  "name": "Locative Case with Time Expressions",
  "category": "grammar",
  "description": "Using the locative case with preposition 'po' to express time in informal format",
  "examples": ["kwadrans po ósmej", "dwadzieścia po dziesiątej"],
  "sourceContent": "Found in practice section discussing time expressions",
  "confidence": 0.95,
  "suggestedDifficulty": "A2",
  "suggestedTags": [
    {"tag": "locative-case", "source": "new", "confidence": 0.9},
    {"tag": "time-expressions", "source": "existing", "confidence": 0.95},
    {"tag": "prepositions", "source": "existing", "confidence": 0.8},
    {"tag": "A2-level", "source": "new", "confidence": 0.9}
  ]
}

Good VOCABULARY concept:
{
  "name": "Time-Related Vocabulary",
  "category": "vocabulary",
  "description": "Essential vocabulary for telling time in Polish",
  "examples": ["kwadrans", "wpół do", "za pięć"],
  "sourceContent": "From notes section on telling time",
  "confidence": 0.9,
  "suggestedDifficulty": "A1",
  "suggestedTags": [
    {"tag": "time-vocabulary", "source": "new", "confidence": 0.95},
    {"tag": "daily-life", "source": "existing", "confidence": 0.8},
    {"tag": "A1-level", "source": "new", "confidence": 0.9},
    {"tag": "numbers", "source": "existing", "confidence": 0.7}
  ]
}

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of concepts:

{
  "concepts": [
    {
      "name": "string",
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "sourceContent": "string",
      "confidence": number, // 0.0-1.0
      "suggestedDifficulty": "A1|A2|B1|B2|C1|C2",
      "suggestedTags": [
        {
          "tag": "string",
          "source": "existing|new",
          "confidence": number // 0.0-1.0
        }
      ]
    },
    // Additional concepts...
  ]
}

Extract at least 3 concepts but no more than 10 concepts, focusing on the most important and clearly defined ones.
`;

// Tag suggestion prompt for a specific concept
export const TAG_SUGGESTION_PROMPT = `
You are tasked with suggesting tags for a Polish language learning concept to aid in discovery and search.

## CONCEPT TO TAG:
{concept}

## EXISTING TAGS IN SYSTEM:
{existingTags}

## TASK:
Suggest 3-5 tags for this concept that will help users discover it when searching for related concepts. Consider:

1. **Grammatical features**: cases, verb forms, sentence patterns, etc.
2. **Semantic categories**: daily life, emotions, travel, food, etc.
3. **Difficulty markers**: A1-level, beginner, intermediate, etc.
4. **Functional categories**: questions, polite-forms, informal-speech, etc.
5. **Learning contexts**: classroom, conversation, reading, etc.

Guidelines:
- Prefer existing tags when appropriate for consistency
- Create new tags when needed for better discovery
- Keep tags short and searchable (1-3 words)
- Use hyphens for multi-word tags (e.g., "time-expressions")
- Focus on what learners would search for

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of suggested tags:

{
  "tags": [
    {
      "tag": "string",
      "source": "existing|new",
      "confidence": number, // 0.0-1.0
      "reason": "string" // Brief explanation for why this tag is relevant
    },
    // Additional tags...
  ]
}

Provide 3-5 tags, prioritizing those that would be most helpful for discovery.
`;

// Merge similarity checking prompt
export const MERGE_SIMILARITY_PROMPT = `
You are tasked with identifying merge potential between a newly extracted language concept and existing concepts in our database.

## NEWLY EXTRACTED CONCEPT:
{extractedConcept}

## EXISTING CONCEPTS:
{existingConcepts}

## TASK:
Compare the newly extracted concept with the existing concepts and identify any that could potentially be merged. Focus on:

1. **Duplicate concepts**: Nearly identical content that should be merged
2. **Overlapping concepts**: Similar content that could be consolidated
3. **Complementary concepts**: Related concepts that might be better as one

For each potential merge:
- Assign a similarity score (0.0-1.0) for content similarity
- Assign a merge score (0.0-1.0) for merge potential
- Identify conflicting fields that would need resolution
- Suggest how to merge the descriptions

## MERGE GUIDELINES:
- 0.9-1.0: Highly recommended merge (near duplicates)
- 0.7-0.8: Recommended merge (significant overlap)
- 0.5-0.6: Possible merge (some overlap, manual review needed)
- 0.3-0.4: Unlikely merge (different concepts with minor overlap)
- 0.0-0.2: No merge recommended (clearly different concepts)

## RESPONSE FORMAT:
Respond strictly with a JSON object containing an array of matches:

{
  "matches": [
    {
      "conceptId": "string",
      "name": "string", 
      "similarity": number, // 0.0-1.0
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "mergeScore": number, // 0.0-1.0
      "mergeSuggestion": {
        "reason": "string",
        "conflictingFields": ["string", "string"],
        "suggestedMergedDescription": "string"
      }
    },
    // Additional matches...
  ]
}

Return only concepts with merge score >= 0.7, limited to the top 3 most mergeable concepts. If no merge candidates are found, return an empty array.
`;

// System prompts for different concept extraction operations
export const CONCEPT_EXTRACTION_SYSTEM_PROMPT = "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.";

export const TAG_SUGGESTION_SYSTEM_PROMPT = "You are a Polish language learning assistant specializing in tagging concepts for discovery and search purposes.";

export const MERGE_SIMILARITY_SYSTEM_PROMPT = "You are tasked with identifying merge potential between language concepts for a Polish learning application.";

export const TEXT_ANALYSIS_SYSTEM_PROMPT = "You are an expert Polish language learning assistant. Analyze the given text and provide structured, helpful insights.";