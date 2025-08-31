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

// Performance analytics integration templates
export const PERFORMANCE_ANALYTICS_CONTEXT = `
## PERFORMANCE DATA INTEGRATION:

### CONCEPT SUCCESS METRICS:
{conceptSuccessRates}

### QUESTION TYPE ANALYTICS:
{questionTypePerformance}

### LEARNER PROFICIENCY INDICATORS:
{learnerProficiencyData}

### HISTORICAL ERROR PATTERNS:
{commonMistakePatterns}
`;

export const ANALYTICS_GUIDANCE_TEMPLATE = `
## ANALYTICS-INFORMED CONTENT GENERATION:

### ADAPTIVE DIFFICULTY CALIBRATION:
- **High Success Rate (>80%)**: Increase complexity, introduce advanced patterns
- **Moderate Success Rate (50-80%)**: Maintain current level, vary question formats  
- **Low Success Rate (<50%)**: Simplify approach, break into smaller concepts

### ERROR-INFORMED DESIGN:
- **Common Grammar Errors**: Create targeted practice for specific patterns
- **Vocabulary Confusion**: Design questions that clarify semantic boundaries
- **Cultural Misunderstandings**: Include contextual explanations and examples

### ENGAGEMENT OPTIMIZATION:
- **Question Type Preferences**: Prioritize formats with higher engagement
- **Concept Interest Patterns**: Emphasize topics with demonstrated learner interest
- **Difficulty Progression**: Optimize challenge level for sustained motivation

### RETENTION STRATEGIES:
- **Spaced Repetition Integration**: Schedule content based on forgetting curves
- **Weak Area Reinforcement**: Provide additional practice for struggling concepts
- **Strength Building**: Use mastered concepts as scaffolding for new learning
`;

export const CONCEPT_ANALYTICS_INTEGRATION = `
## CONCEPT-SPECIFIC ANALYTICS INTEGRATION:

For each target concept, consider:
- **Historical Success Rate**: {conceptSuccessRate}% success rate indicates {difficultyAssessment}
- **Common Mistake Patterns**: Students typically struggle with {commonErrors}
- **Learning Progression**: This concept typically requires {estimatedPracticeRounds} practice rounds
- **Transfer Potential**: Success here correlates with improvement in {relatedConcepts}
- **Optimal Question Types**: {preferredQuestionTypes} work best for this concept
`;

export const QUESTION_ANALYTICS_INTEGRATION = `
## QUESTION-LEVEL ANALYTICS INTEGRATION:

### SUCCESS RATE PREDICTION:
Based on similar questions, this should have approximately {predictedSuccessRate}% success rate.

### MISTAKE ANTICIPATION:
Expect common errors in: {anticipatedMistakes}

### ENGAGEMENT FACTORS:
- **Estimated Time**: {estimatedCompletionTime} seconds
- **Cognitive Load**: {cognitiveLoadLevel}
- **Interest Level**: {predictedEngagement}

### OPTIMIZATION RECOMMENDATIONS:
- **Difficulty Adjustment**: {difficultyRecommendation}
- **Format Suggestion**: {optimalFormat}
- **Context Enhancement**: {contextualImprovements}
`;