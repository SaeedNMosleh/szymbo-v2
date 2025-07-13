/**
 * Utilities for sanitizing and parsing LLM JSON responses
 */

export interface JSONSanitizationResult {
  success: boolean;
  data?: any;
  error?: string;
  originalResponse?: string;
  sanitizedResponse?: string;
}

/**
 * Sanitizes and parses potentially malformed JSON from LLM responses
 */
export function sanitizeAndParseJSON(response: string): JSONSanitizationResult {
  const originalResponse = response.trim();
  
  try {
    // First, try parsing as-is
    const data = JSON.parse(originalResponse);
    return { success: true, data, originalResponse };
  } catch (initialError) {
    // If that fails, try sanitization
    try {
      const sanitized = sanitizeJSONString(originalResponse);
      const data = JSON.parse(sanitized);
      return { 
        success: true, 
        data, 
        originalResponse, 
        sanitizedResponse: sanitized 
      };
    } catch (sanitizationError) {
      return {
        success: false,
        error: `JSON parsing failed: ${sanitizationError instanceof Error ? sanitizationError.message : 'Unknown error'}`,
        originalResponse,
      };
    }
  }
}

/**
 * Sanitizes common JSON formatting issues in LLM responses
 */
function sanitizeJSONString(jsonString: string): string {
  let sanitized = jsonString;

  // Remove markdown code blocks
  sanitized = sanitized.replace(/```json\s*/gi, '');
  sanitized = sanitized.replace(/```\s*/g, '');

  // Extract JSON from text if it's embedded
  const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    sanitized = jsonMatch[0];
  }

  // Fix common issues
  sanitized = sanitized
    // Replace single quotes with double quotes for property names and string values
    .replace(/'([^']*)':/g, '"$1":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    
    // Fix unquoted property names
    .replace(/(\w+):/g, '"$1":')
    
    // Remove trailing commas before closing brackets/braces
    .replace(/,(\s*[}\]])/g, '$1')
    
    // Fix escaped quotes
    .replace(/\\'/g, "'")
    
    // Remove any leading/trailing whitespace
    .trim();

  // Ensure the JSON starts and ends properly
  if (!sanitized.startsWith('{') && !sanitized.startsWith('[')) {
    // Try to find the start of JSON
    const jsonStart = sanitized.search(/[{\[]/);
    if (jsonStart !== -1) {
      sanitized = sanitized.substring(jsonStart);
    }
  }

  return sanitized;
}

/**
 * Validates that a parsed object matches expected question generation schema
 */
export function validateQuestionResponse(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check if it has questions array
  if (!Array.isArray(data.questions)) {
    return false;
  }

  // Validate each question has required fields
  return data.questions.every((question: any) => 
    question &&
    typeof question.question === 'string' &&
    typeof question.correctAnswer === 'string' &&
    Array.isArray(question.targetConcepts)
  );
}

/**
 * Attempts to extract and fix partial JSON responses
 */
export function extractPartialJSON(response: string): any {
  const trimmed = response.trim();
  
  // Try to find incomplete JSON and complete it
  let attempt = trimmed;
  
  // If it looks like it starts with JSON but is incomplete
  if (attempt.startsWith('{') && !attempt.endsWith('}')) {
    // Count open braces vs close braces
    const openBraces = (attempt.match(/\{/g) || []).length;
    const closeBraces = (attempt.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    // Add missing closing braces
    attempt += '}'.repeat(missingBraces);
  }
  
  // Try to parse the completed JSON
  try {
    return JSON.parse(attempt);
  } catch {
    // If still failing, try to extract what we can
    return null;
  }
}

/**
 * Logs detailed information about JSON parsing failures for debugging
 */
export function logJSONParsingError(response: string, error: Error): void {
  console.error('JSON Parsing Error Details:', {
    error: error.message,
    responseLength: response.length,
    responsePreview: response.substring(0, 300),
    responseSuffix: response.length > 300 ? response.substring(response.length - 100) : '',
    containsCodeBlocks: response.includes('```'),
    containsSingleQuotes: response.includes("'"),
    containsTrailingCommas: /,\s*[}\]]/.test(response),
  });
}