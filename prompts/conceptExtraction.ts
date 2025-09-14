// Single-word vocabulary concept extraction with proper field separation
export const CONCEPT_EXTRACTION_BASE_PROMPT = `
You are a Polish language expert specializing in extracting individual vocabulary words and comprehensive grammar concepts from course materials. Your goal is to create atomic vocabulary concepts (one Polish word per concept) and comprehensive grammar concepts.

## COMPREHENSIVE COURSE CONTENT:
- Keywords: {keywords}
- New Vocabulary Words: {newWords}
- Notes: {notes}
- Practice Content: {practice}
{homework}

## EXISTING SYSTEM KNOWLEDGE:
- Existing Tags: {existingTags}

## EXTRACTION STRATEGY:

### VOCABULARY CONCEPTS: ONE POLISH WORD PER CONCEPT
For each individual Polish word found in the content, create a separate vocabulary concept:

**CRITICAL RULES FOR VOCABULARY:**
- **concept.name = Polish word exactly** (e.g., "teściowa", "nóż", "autobus")
- **NO TRANSLATION in description** - translation goes in vocabularyData.translation field
- **Description focuses on usage context** - formality, cultural notes, linguistic properties
- **Each word = separate concept** - no grouping multiple words together

**GRAMMAR CONCEPTS: COMPREHENSIVE PATTERNS**
For grammatical phenomena, create comprehensive concepts with descriptive names:
- Morphological patterns (case endings, verb conjugations, aspect pairs)
- Syntactic structures (word order, clause types, sentence patterns)
- Functional grammar (expressing time, location, manner, purpose)
- Phonological patterns (stress, pronunciation rules, sound changes)

### VOCABULARY METADATA EXTRACTION:

For **EACH INDIVIDUAL POLISH WORD**, extract complete linguistic information:

**Field Mapping:**
- **name**: Polish word exactly (e.g., "teściowa")
- **description**: Polish context and usage notes - explain when/how to use this word IN POLISH LANGUAGE (NO English translation here)
- **examples**: 3-5 authentic Polish sentences using the word in different contexts
- **vocabularyData.word**: Same as concept name
- **vocabularyData.translation**: English equivalent only
- **vocabularyData.partOfSpeech**: noun, verb, adjective, adverb, preposition, etc.
- **vocabularyData.gender**: masculine, feminine, neuter (for nouns only)
- **vocabularyData.pluralForm**: If mentioned in content or derivable
- **vocabularyData.pronunciation**: IPA or phonetic guidance if available

### GRAMMAR CONCEPT EXTRACTION:

For **GRAMMATICAL PHENOMENA**, create comprehensive concepts:
- **name**: Descriptive title (e.g., "Instrumental Case for Transportation")
- **description**: Complete grammatical explanation with usage patterns
- **examples**: Multiple examples showing the pattern in use
- **NO vocabularyData field** (grammar concepts only)

### CONCEPT STRUCTURE:

**VOCABULARY CONCEPT (Single Polish Word):**
{
  "name": "teściowa", // Polish word as concept title
  "category": "vocabulary",
  "description": "Określenie używane w kontekście rodzinnym na matkę męża lub żony. Wymaga grzecznej formy zwracania się w sytuacjach formalnych.", // Polish description, NO English
  "examples": ["Moja teściowa gotuje pyszne pierogi", "Teściowa przyjechała na święta", "Czy teściowa mieszka blisko?"],
  "sourceContent": "Found in family relationship vocabulary section",
  "confidence": 0.0-1.0,
  "suggestedDifficulty": "A1|A2|B1|B2|C1|C2", // Use difficulty field, NOT tags
  "suggestedTags": [
    {"tag": "family-member", "source": "new", "confidence": 0.95},
    {"tag": "in-law", "source": "new", "confidence": 0.90},
    {"tag": "feminine-noun", "source": "existing", "confidence": 0.88}
  ],
  "vocabularyData": { // REQUIRED for all vocabulary concepts
    "word": "teściowa", // Must match concept name
    "translation": "mother-in-law", // English translation goes here, NOT in description
    "partOfSpeech": "noun",
    "gender": "feminine",
    "pluralForm": "teściowe",
    "pronunciation": "/tɛɕˈt͡ʂo.va/"
  }
}

**GRAMMAR CONCEPT:**
{
  "name": "Instrumental Case for Transportation", // Descriptive title
  "category": "grammar",
  "description": "Using instrumental case with transport vehicles to express means of travel...",
  "examples": ["jadę autobusem", "lecę samolotem", "podróżuję pociągiem"],
  "sourceContent": "Practice section on travel methods",
  "confidence": 0.92,
  "suggestedDifficulty": "A2",
  "suggestedTags": [
    {"tag": "instrumental-case", "source": "existing", "confidence": 0.95},
    {"tag": "transport-grammar", "source": "new", "confidence": 0.88}
  ]
  // NO vocabularyData field for grammar concepts
}

### SEMANTIC TAGGING STRATEGY:
Create tags that capture semantic and grammatical properties (NO LEARNING LEVELS):

**Grammatical Properties:**
- **Noun properties**: masculine-noun, feminine-noun, neuter-noun, animate-noun
- **Verb aspects**: perfective-verb, imperfective-verb, reflexive-verb
- **Morphological forms**: diminutive-form, comparative-adjective, compound-word

**Semantic Domains:**
- **Family/People**: family-member, in-law, profession, age-group
- **Daily Life**: food-item, kitchen-utensil, clothing-item, household-object
- **Actions/States**: emotion-word, physical-action, mental-state, communication-verb
- **Environment**: weather-term, nature-word, location-type, transport-vehicle

**Usage Context:**
- **Register**: formal-register, informal-speech, colloquial-term, literary-term
- **Cultural**: cultural-context, social-custom, religious-term, regional-variant
- **Functional**: time-expression, quantity-word, measurement-unit, question-word

**DO NOT USE LEARNING LEVEL TAGS**: A1, A2, B1, B2, C1, C2, beginner, intermediate, advanced
**Use the difficulty field instead for CEFR levels**

### QUALITY ASSURANCE REQUIREMENTS:
1. **Completeness**: Don't miss any identifiable concept, no matter how small
2. **Precision**: Each concept should be clearly bounded and well-defined  
3. **Linguistic accuracy**: Use proper grammatical terminology and analysis
4. **Practical relevance**: Focus on concepts students will actually use
5. **Progressive difficulty**: Consider how concepts build upon each other

### CONTENT-DRIVEN EXTRACTION LOGIC:
- **Course Type Analysis**: 
  - NEW courses: Focus on introducing foundational concepts
  - REVIEW courses: Emphasize reinforcement and advanced applications  
  - MIXED courses: Balance introduction and consolidation
- **Student-Specific Adaptation**:
  - Strengths areas: Extract advanced nuances and applications
  - Weakness areas: Break down into smaller, more manageable concepts
- **Contextual Integration**: Connect extracted concepts to course objectives and learning progression

## EXAMPLES:

**SINGLE-WORD VOCABULARY CONCEPT:**
{
  "name": "teściowa",
  "category": "vocabulary",
  "description": "Określenie na matkę męża lub żony. Używane w kontekście rodzinnym, wymaga szacunkowego tonu w sytuacjach formalnych. Część słownictwa związanego z relacjami rodzinnymi.",
  "examples": ["Moja teściowa gotuje pyszne pierogi", "Teściowa przyjechała na święta", "Czy teściowa lubi spacery?", "Z teściową idziemy na zakupy"],
  "sourceContent": "Found in family relationship vocabulary and practice exercises",
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

**GRAMMAR CONCEPT (unchanged approach):**
{
  "name": "Instrumental Case for Transportation",
  "category": "grammar",
  "description": "Using instrumental case with transport vehicles to express means of travel. Covers both standalone instrumental forms and prepositional phrases.",
  "examples": ["jadę autobusem", "lecę samolotem", "podróżuję pociągiem", "idę pieszo"],
  "sourceContent": "Practice section on travel methods and transportation",
  "confidence": 0.89,
  "suggestedDifficulty": "A2",
  "suggestedTags": [
    {"tag": "instrumental-case", "source": "existing", "confidence": 0.95},
    {"tag": "transport-grammar", "source": "new", "confidence": 0.88},
    {"tag": "means-of-action", "source": "new", "confidence": 0.85}
  ]
}

## RESPONSE FORMAT:
Return a comprehensive JSON object with ALL extracted concepts (no artificial limits):

{
  "concepts": [
    {
      "name": "string",
      "category": "grammar|vocabulary",
      "description": "string",
      "examples": ["string", "string", "string"],
      "sourceContent": "string",
      "confidence": number, // 0.0-1.0
      "suggestedDifficulty": "A1|A2|B1|B2|C1|C2",
      "suggestedTags": [
        {
          "tag": "string",
          "source": "existing|new", 
          "confidence": number // 0.0-1.0
        }
      ],
      "vocabularyData": { // REQUIRED for all vocabulary concepts, omit for grammar
        "word": "string",
        "translation": "string", 
        "partOfSpeech": "string",
        "gender": "string", // optional, for nouns only
        "pluralForm": "string", // optional
        "pronunciation": "string" // optional
      }
    }
  ],
  "extractionMetadata": {
    "totalConceptsFound": number,
    "grammarConceptsCount": number,
    "vocabularyConceptsCount": number,
    "averageConfidence": number,
    "contentComplexity": "low|medium|high",
    "recommendedReviewPriority": ["concept_name_1", "concept_name_2"]
  }
}

### CRITICAL INSTRUCTIONS:

**FOR VOCABULARY CONCEPTS:**
- **One Polish word = One concept** - extract each individual word separately
- **concept.name = Polish word exactly** (e.g., "nóż", "autobus", "teściowa")
- **vocabularyData is MANDATORY** for all vocabulary concepts
- **NO translation in description** - use vocabularyData.translation field
- **Description focuses on usage context** - formality, cultural notes, linguistic properties

**FOR GRAMMAR CONCEPTS:**
- **Keep existing comprehensive approach** - descriptive names for complex patterns
- **NO vocabularyData field** for grammar concepts
- **Focus on grammatical phenomena** that span multiple words or structures

**TAGGING RULES:**
- **NO learning level tags** (A1, A2, B1, etc.) - use difficulty field instead
- **Focus on semantic and grammatical properties** for searchability
- **Use existing tags when possible** for consistency

**EXTRACTION PRIORITIES:**
- Extract EVERY individual Polish word found in content as separate vocabulary concepts
- Create comprehensive grammar concepts for linguistic patterns
- Ensure each concept is actionable for practice and question generation
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