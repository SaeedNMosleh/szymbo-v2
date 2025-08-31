// Enhanced concept extraction from course content prompt with rich linguistic analysis
export const CONCEPT_EXTRACTION_BASE_PROMPT = `
You are a Polish language expert specializing in comprehensive concept extraction from course materials. Your goal is to extract ALL valuable learning concepts with linguistic precision and rich metadata.

## COURSE METADATA:
- Course Type: {courseType} (new/review/mixed)
- Main Subjects: {mainSubjects}
- New Subjects: {newSubjects}
- Review Subjects: {reviewSubjects}
- Student Strengths: {strengths}
- Student Weaknesses: {weaknesses}

## COMPREHENSIVE COURSE CONTENT:
- Keywords: {keywords}
- New Vocabulary Words: {newWords}
- Notes: {notes}
- Practice Content: {practice}
{homework}

## EXISTING SYSTEM KNOWLEDGE:
- Existing Tags: {existingTags}
- Course Context: Course #{courseId} from {date}

## COMPREHENSIVE EXTRACTION TASK:

### PRIMARY MISSION: EXHAUSTIVE CONCEPT IDENTIFICATION
Extract EVERY distinct learning concept present in the content. Do not limit yourself - identify all grammar patterns, vocabulary groups, expressions, cultural insights, and linguistic phenomena present.

### CATEGORY CLASSIFICATION:
**GRAMMAR CONCEPTS:**
- Morphological patterns (case endings, verb conjugations, aspect pairs)  
- Syntactic structures (word order, clause types, sentence patterns)
- Functional grammar (expressing time, location, manner, purpose)
- Phonological patterns (stress, pronunciation rules, sound changes)

**VOCABULARY CONCEPTS:**
- Semantic word groups (family, food, travel, emotions, etc.)
- Collocations and fixed expressions
- Idiomatic expressions and phrasal constructions
- Cultural and contextual vocabulary
- Morphological word families (root + prefixes/suffixes)

### RICH LINGUISTIC METADATA EXTRACTION:

For **EVERY VOCABULARY CONCEPT**, extract:
- **Primary word/expression**: The main lexical item
- **English translation**: Precise semantic equivalent
- **Part of speech**: noun, verb, adjective, adverb, preposition, etc.
- **Gender** (for nouns): masculine, feminine, neuter
- **Plural form** (if applicable and present in content)
- **Pronunciation guidance** (if provided or can be inferred)

For **EVERY GRAMMAR CONCEPT**, extract:
- **Grammatical function**: What linguistic purpose does this serve?
- **Morphological details**: Case usage, verb aspects, agreement patterns
- **Syntactic context**: When and how is this pattern used?
- **Semantic implications**: What meaning does this grammatical choice convey?

### COMPREHENSIVE CONCEPT STRUCTURE:
{
  "name": "Precise, descriptive concept name",
  "category": "grammar|vocabulary", 
  "description": "Comprehensive explanation including linguistic context and usage patterns",
  "examples": ["Multiple examples from content showing variation and context"],
  "sourceContent": "Specific location and context where this concept appears",
  "confidence": 0.0-1.0, // How clearly is this concept present and well-defined?
  "suggestedDifficulty": "A1|A2|B1|B2|C1|C2", // Based on linguistic complexity
  "suggestedTags": [
    {"tag": "searchable-keyword", "source": "existing|new", "confidence": 0.0-1.0}
  ],
  "vocabularyData": { // ONLY for vocabulary concepts
    "word": "primary Polish word/expression",
    "translation": "precise English equivalent",
    "partOfSpeech": "grammatical category",
    "gender": "masculine|feminine|neuter", // for nouns only
    "pluralForm": "plural form if present",
    "pronunciation": "phonetic guidance if available"
  }
}

### ADVANCED TAGGING STRATEGY:
Create tags that capture:
- **Grammatical features**: case-system, verb-aspects, conditional-mood
- **Semantic domains**: family-vocabulary, time-expressions, daily-activities  
- **Difficulty progression**: A1-basics, B2-advanced, idiomatic-expressions
- **Learning contexts**: conversation-starters, formal-register, colloquial-speech
- **Morphological patterns**: diminutives, perfective-verbs, compound-words
- **Cultural aspects**: polish-culture, social-customs, regional-variations

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

**COMPREHENSIVE GRAMMAR CONCEPT:**
{
  "name": "Instrumental Case for Means of Transport",
  "category": "grammar",
  "description": "Using instrumental case with transport vehicles to express 'by means of' - covers both prepositions (z/ze) and standalone instrumental forms, including colloquial variants",
  "examples": ["jadę autobusem", "lecę samolotem", "idę z przyjaciółką", "podróżuję pociągiem"],
  "sourceContent": "Practice section on travel vocabulary and transportation methods",
  "confidence": 0.92,
  "suggestedDifficulty": "A2",
  "suggestedTags": [
    {"tag": "instrumental-case", "source": "existing", "confidence": 0.95},
    {"tag": "transport-grammar", "source": "new", "confidence": 0.88},
    {"tag": "means-of-action", "source": "new", "confidence": 0.85},
    {"tag": "A2-grammar", "source": "existing", "confidence": 0.90}
  ]
}

**ENRICHED VOCABULARY CONCEPT:**
{
  "name": "Family Relationship Terms - Extended Family",
  "category": "vocabulary", 
  "description": "Extended family vocabulary including in-laws and step-relations, with proper gender agreement and cultural usage patterns in Polish family contexts",
  "examples": ["teściowa", "szwagier", "siostrzeniec", "bratowa", "pasierbica"],
  "sourceContent": "Notes section discussing family relationships and social contexts",
  "confidence": 0.87,
  "suggestedDifficulty": "B1",
  "suggestedTags": [
    {"tag": "family-vocabulary", "source": "existing", "confidence": 0.95},
    {"tag": "social-relationships", "source": "new", "confidence": 0.82},
    {"tag": "cultural-context", "source": "existing", "confidence": 0.79},
    {"tag": "B1-vocabulary", "source": "existing", "confidence": 0.88}
  ],
  "vocabularyData": {
    "word": "extended family terms",
    "translation": "in-laws, step-relations, extended family",
    "partOfSpeech": "noun",
    "gender": "varies by specific term",
    "pluralForm": "context-dependent plural forms",
    "pronunciation": "stress patterns vary by word length"
  }
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
- Extract EVERY identifiable concept - there is NO LIMIT on the number of concepts
- For vocabulary concepts, vocabularyData is MANDATORY
- Focus on concepts that will help students progress in their Polish learning
- Prioritize concepts that appear multiple times or in different contexts
- Include cultural and contextual information where relevant
- Ensure each concept is actionable for question generation and practice
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