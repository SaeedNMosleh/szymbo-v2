// Course validation and improvement prompt
export const COURSE_VALIDATION_PROMPT = `Please review this course information and suggest any improvements or corrections in terms of typos, grammar issues, or any suggestions to clarify. 

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY valid JSON - no markdown, no explanations, no code blocks
- Do NOT wrap your response in \`\`\`json or any other formatting
- Return ONLY the JSON object starting with { and ending with }
- Keep the original content of any field if there are no suggestions for improvement
- If a field is empty in the input, keep it empty unless you have a specific improvement

Course information to review:
{courseData}

Return the improved version with the exact same structure, fixing any typos, grammar issues, and providing clearer language where needed. Respond with raw JSON only.`;

// System prompt for course validation
export const COURSE_VALIDATION_SYSTEM_PROMPT = "You are an AI assistant that validates and improves course information. You must respond with ONLY valid JSON - no markdown formatting, no explanations, no code blocks. Your response must be parseable by JSON.parse() directly.";