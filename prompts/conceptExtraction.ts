export const VOCABULARY_EXTRACTION_PROMPT = `
You are a Polish language expert specializing in extracting vocabulary concepts from Polish words.

CRITICAL: Return ONLY valid JSON without any comments, notes, or explanatory text. Do not use // or /* */ style comments anywhere in your response.

## TASK:
Extract vocabulary concepts from the provided Polish words. Create ONE concept per Polish word.

## POLISH WORDS TO EXTRACT:
{newWords}

## EXISTING TAGS FOR CONSISTENCY:
{existingTags}

## EXTRACTION RULES:

### FOR EACH POLISH WORD:
- **concept.name**: Polish word exactly as provided (e.g., "teściowa", "nóż", "autobus")
- **concept.category**: "vocabulary" (always)
- **concept.description**: Polish context and usage notes - explain when/how to use this word IN POLISH LANGUAGE (NO English translation here)
- **concept.examples**: 3-5 authentic Polish sentences using the word in different contexts
- **concept.vocabularyData**: MANDATORY field with translation and linguistic information
- **concept.sourceContent**: "Vocabulary from newWords list"
- **concept.confidence**: 0.85-0.95 (vocabulary extraction is reliable)
- **concept.suggestedDifficulty**: A1, A2, B1, B2, C1, or C2
- **concept.suggestedTags**: 3-5 semantic and grammatical tags

### VOCABULARY DATA STRUCTURE:
For each word, provide complete linguistic information:
- **word**: Same as concept name
- **translation**: English equivalent only
- **partOfSpeech**: noun, verb, adjective, adverb, preposition, etc.
- **gender**: masculine, feminine, neuter (for nouns only)
- **pluralForm**: If derivable or commonly known
- **pronunciation**: IPA or phonetic guidance if applicable

### TAGGING STRATEGY:
Create tags that capture semantic and grammatical properties:

**Grammatical Properties:**
- masculine-noun, feminine-noun, neuter-noun, animate-noun
- perfective-verb, imperfective-verb, reflexive-verb
- diminutive-form, comparative-adjective, compound-word

**Semantic Domains:**
- family-member, profession, age-group
- food-item, kitchen-utensil, clothing-item, household-object
- emotion-word, physical-action, mental-state, communication-verb
- weather-term, nature-word, location-type, transport-vehicle

**Usage Context:**
- formal-register, informal-speech, colloquial-term
- cultural-context, social-custom, regional-variant
- time-expression, quantity-word, measurement-unit

**DO NOT USE LEARNING LEVEL TAGS**: A1, A2, B1, B2, C1, C2
**Use the difficulty field instead for CEFR levels**

## EXAMPLE OUTPUT:

{
  "concepts": [
    {
      "name": "teściowa",
      "category": "vocabulary",
      "description": "Określenie na matkę męża lub żony. Używane w kontekście rodzinnym, wymaga szacunkowego tonu w sytuacjach formalnych. Część słownictwa związanego z relacjami rodzinnymi.",
      "examples": ["Moja teściowa gotuje pyszne pierogi", "Teściowa przyjechała na święta", "Czy teściowa lubi spacery?", "Z teściową idziemy na zakupy"],
      "sourceContent": "Vocabulary from newWords list",
      "confidence": 0.92,
      "suggestedDifficulty": "A2",
      "suggestedTags": [
        {"tag": "family-member", "source": "new", "confidence": 0.95},
        {"tag": "in-law", "source": "new", "confidence": 0.90},
        {"tag": "feminine-noun", "source": "existing", "confidence": 0.88},
        {"tag": "formal-register", "source": "existing", "confidence": 0.85}
      ],
      "vocabularyData": {
        "word": "teściowa",
        "translation": "mother-in-law",
        "partOfSpeech": "noun",
        "gender": "feminine",
        "pluralForm": "teściowe",
        "pronunciation": "/tɛɕˈt͡ʂo.va/"
      }
    }
  ],
  "extractionMetadata": {
    "totalConceptsFound": 1,
    "vocabularyConceptsCount": 1,
    "grammarConceptsCount": 0,
    "averageConfidence": 0.92,
    "contentComplexity": "low",
    "recommendedReviewPriority": ["teściowa"]
  }
}

CRITICAL: Return ONLY the JSON object. No additional text or explanations.
`;

export const GRAMMAR_EXTRACTION_PROMPT = `
You are a Polish language expert specializing in extracting grammar concepts from Polish language course content.

CRITICAL: Return ONLY valid JSON without any comments, notes, or explanatory text. Do not use // or /* */ style comments anywhere in your response.

## TASK:
Extract grammar concepts from the provided Polish language course content. Focus on linguistic patterns, grammar rules, and structural elements.

## COURSE CONTENT:
{combinedText}

## EXISTING TAGS FOR CONSISTENCY:
{existingTags}

## EXTRACTION RULES:

### WHAT TO EXTRACT:
- **Case usage and endings** (nominative, genitive, dative, accusative, instrumental, locative, vocative)
- **Verb conjugations and aspects** (perfective/imperfective, present/past/future)
- **Sentence structures and word order** patterns
- **Functional grammar** (time expressions, location, manner, cause/effect)
- **Adjective declension** patterns
- **Pronoun usage** rules
- **Preposition + case** combinations
- **Comparative and superlative** constructions

### FOR EACH GRAMMAR CONCEPT:
- **concept.name**: Descriptive title (e.g., "Instrumental Case for Transportation", "Past Tense Formation for -ować Verbs")
- **concept.category**: "grammar" (always)
- **concept.description**: Complete grammatical explanation with usage patterns and rules
- **concept.examples**: Multiple examples showing the pattern in use with Polish sentences
- **concept.sourceContent**: "Grammar from course content"
- **concept.confidence**: 0.80-0.95 based on clarity of the pattern
- **concept.suggestedDifficulty**: A1, A2, B1, B2, C1, or C2
- **concept.suggestedTags**: 3-5 grammatical and functional tags
- **DO NOT include vocabularyData field** (grammar concepts only)

### TAGGING STRATEGY FOR GRAMMAR:
Focus on grammatical and functional properties:

**Grammatical Categories:**
- instrumental-case, nominative-case, genitive-case, dative-case, accusative-case, locative-case
- present-tense, past-tense, future-tense
- perfective-aspect, imperfective-aspect
- conditional-mood, imperative-mood
- adjective-declension, pronoun-usage

**Functional Categories:**
- transport-grammar, time-expressions, location-expressions
- comparison-grammar, possession-grammar
- question-formation, negation-patterns
- politeness-grammar, formal-address

**Complexity Markers:**
- basic-grammar, intermediate-grammar, advanced-grammar
- exception-rules, irregular-patterns

## EXAMPLE OUTPUT:

{
  "concepts": [
    {
      "name": "Instrumental Case for Transportation",
      "category": "grammar",
      "description": "Using instrumental case with transport vehicles to express means of travel. Covers both standalone instrumental forms and prepositional phrases with 'przez' for route indication.",
      "examples": ["jadę autobusem", "lecę samolotem", "podróżuję pociągiem", "idę pieszo przez park"],
      "sourceContent": "Grammar from course content",
      "confidence": 0.89,
      "suggestedDifficulty": "A2",
      "suggestedTags": [
        {"tag": "instrumental-case", "source": "existing", "confidence": 0.95},
        {"tag": "transport-grammar", "source": "new", "confidence": 0.88},
        {"tag": "means-of-action", "source": "new", "confidence": 0.85}
      ]
    }
  ],
  "extractionMetadata": {
    "totalConceptsFound": 1,
    "vocabularyConceptsCount": 0,
    "grammarConceptsCount": 1,
    "averageConfidence": 0.89,
    "contentComplexity": "medium",
    "recommendedReviewPriority": ["Instrumental Case for Transportation"]
  }
}

CRITICAL: Return ONLY the JSON object. No additional text or explanations.
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
      "confidence": 0.85,
      "reason": "string"
    }
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
      "similarity": 0.85,
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string"],
      "mergeScore": 0.90,
      "mergeSuggestion": {
        "reason": "string",
        "conflictingFields": ["string", "string"],
        "suggestedMergedDescription": "string"
      }
    }
  ]
}

Return only concepts with merge score >= 0.7, limited to the top 3 most mergeable concepts. If no merge candidates are found, return an empty array.
`;

// System prompts for different concept extraction operations
export const CONCEPT_EXTRACTION_SYSTEM_PROMPT = "You are a Polish language learning assistant specializing in extracting and organizing language concepts from learning materials.";

export const TAG_SUGGESTION_SYSTEM_PROMPT = "You are a Polish language learning assistant specializing in tagging concepts for discovery and search purposes.";

export const MERGE_SIMILARITY_SYSTEM_PROMPT = "You are tasked with identifying merge potential between language concepts for a Polish learning application.";

export const TEXT_ANALYSIS_SYSTEM_PROMPT = "You are an expert Polish language learning assistant. Analyze the given text and provide structured, helpful insights.";