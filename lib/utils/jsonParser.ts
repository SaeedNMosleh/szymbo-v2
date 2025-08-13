/**
 * Comprehensive JSON parser utility for LLM responses
 * Consolidates all JSON parsing logic used throughout the application
 */

import { logger } from "./logger";

export interface JsonParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  originalResponse?: string;
  sanitizedResponse?: string;
}

/**
 * Universal LLM JSON response parser that handles all common cases
 * Replaces multiple scattered parsing utilities across the codebase
 */
export function parseJsonFromLLMResponse<T = unknown>(
  response: string
): JsonParseResult<T> {
  try {
    const originalResponse = response.trim();

    // Step 1: Try direct parsing first (fastest path)
    try {
      const data = JSON.parse(originalResponse) as T;
      return {
        success: true,
        data,
        originalResponse,
      };
    } catch {
      // Continue to more complex parsing
    }

    // Step 2: Extract and clean the response
    let cleanedResponse = originalResponse;

    // Remove markdown code blocks (```json ... ```)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const codeBlockMatch = cleanedResponse.match(codeBlockRegex);

    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    } else {
      // Handle incomplete markdown (starts with ```json but no closing)
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, "");
      }
      // Remove any trailing backticks
      cleanedResponse = cleanedResponse.replace(/`+$/, "");
    }

    // Step 3: Extract JSON object/array if embedded in text
    const jsonObjectMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    const jsonArrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);

    if (
      jsonObjectMatch &&
      (!jsonArrayMatch || jsonObjectMatch.index! < jsonArrayMatch.index!)
    ) {
      cleanedResponse = jsonObjectMatch[0];
    } else if (jsonArrayMatch) {
      cleanedResponse = jsonArrayMatch[0];
    }

    // Step 4: Apply common fixes
    cleanedResponse = fixCommonJsonIssues(cleanedResponse);

    // Step 5: Validate structure
    if (!cleanedResponse.startsWith("{") && !cleanedResponse.startsWith("[")) {
      return {
        success: false,
        error: "Response does not contain valid JSON structure",
        originalResponse,
        sanitizedResponse: cleanedResponse,
      };
    }

    // Step 6: Check for incomplete JSON
    if (isIncompleteJson(cleanedResponse)) {
      return {
        success: false,
        error: "JSON appears to be incomplete or truncated",
        originalResponse,
        sanitizedResponse: cleanedResponse,
      };
    }

    // Step 7: Final parse attempt
    const parsedData = JSON.parse(cleanedResponse) as T;

    logger.debug("Successfully parsed LLM JSON response", {
      operation: "json_parser",
      hadMarkdown: originalResponse.includes("```"),
      dataType: Array.isArray(parsedData) ? "array" : typeof parsedData,
      dataKeys:
        typeof parsedData === "object" && parsedData !== null
          ? Object.keys(parsedData)
          : undefined,
    });

    return {
      success: true,
      data: parsedData,
      originalResponse,
      sanitizedResponse:
        cleanedResponse !== originalResponse ? cleanedResponse : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error";

    logger.warn("Failed to parse JSON from LLM response", {
      operation: "json_parser",
      error: errorMessage,
      responseLength: response.length,
      responsePreview: response.substring(0, 200),
    });

    return {
      success: false,
      error: errorMessage,
      originalResponse: response,
    };
  }
}

/**
 * Comprehensive JSON sanitization incorporating logic from multiple existing utilities
 * Combines fixes from questionGeneration/jsonUtils.ts and other parsers
 */
function fixCommonJsonIssues(jsonString: string): string {
  let fixed = jsonString.trim();

  // Replace single quotes with double quotes for property names and string values
  fixed = fixed.replace(/'([^']*)':/g, '"$1":');
  fixed = fixed.replace(/:\s*'([^']*)'/g, ': "$1"');

  // Fix unquoted property names (basic approach)
  fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Remove trailing commas before closing braces/brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

  // Fix escaped quotes
  fixed = fixed.replace(/\\'/g, "'");

  // Remove any extra whitespace around colons and commas
  fixed = fixed.replace(/\s*:\s*/g, ":").replace(/\s*,\s*/g, ",");

  // Add proper spacing after colons and commas for readability
  fixed = fixed.replace(/:/g, ": ").replace(/,/g, ", ");

  // Clean up any double spaces created
  fixed = fixed.replace(/\s+/g, " ");

  return fixed;
}

/**
 * Checks if JSON appears to be incomplete based on brace/bracket matching
 */
function isIncompleteJson(jsonString: string): boolean {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
      } else if (char === "[") {
        bracketCount++;
      } else if (char === "]") {
        bracketCount--;
      }
    }
  }

  // JSON is incomplete if we have unmatched braces or brackets
  return braceCount !== 0 || bracketCount !== 0;
}

/**
 * Factory function that creates a parser callback for use with LLM services
 * This standardizes JSON parsing across all LLM interactions
 */
export function createLLMJsonParser<T = unknown>(
  fallbackData?: T,
  options?: {
    enableRepair?: boolean;
    logErrors?: boolean;
  }
): (rawResponse: string) => T {
  return (rawResponse: string): T => {
    const parseResult = parseJsonFromLLMResponse<T>(rawResponse);

    if (!parseResult.success) {
      const shouldLog = options?.logErrors !== false;

      if (shouldLog) {
        logger.warn("LLM JSON parsing failed", {
          error: parseResult.error,
          response: rawResponse.substring(0, 200),
          originalResponse: parseResult.originalResponse?.substring(0, 200),
        });
      }

      // Attempt repair if enabled
      if (
        options?.enableRepair &&
        (parseResult.error?.includes("incomplete") ||
          parseResult.error?.includes("truncated"))
      ) {
        try {
          const repairedJson = attemptJsonRepair(rawResponse);
          const repairResult = parseJsonFromLLMResponse<T>(repairedJson);

          if (repairResult.success) {
            if (shouldLog) {
              logger.info("Successfully repaired LLM JSON response", {
                operation: "json_repair",
                success: true,
              });
            }
            return repairResult.data as T;
          }
        } catch (repairError) {
          if (shouldLog) {
            logger.warn("JSON repair failed", {
              operation: "json_repair",
              error:
                repairError instanceof Error
                  ? repairError.message
                  : "Unknown error",
            });
          }
        }
      }

      if (fallbackData !== undefined) {
        if (shouldLog) {
          logger.info("Using fallback data for failed JSON parsing", {
            operation: "json_parser_fallback",
          });
        }
        return fallbackData;
      }

      throw new Error(
        `Failed to parse LLM JSON response: ${parseResult.error}`
      );
    }

    return parseResult.data as T;
  };
}
export function attemptJsonRepair(jsonString: string): string {
  let repaired = jsonString.trim();

  // First, try to fix incomplete string values that are cut off
  // Look for unclosed quotes at the end
  const lastQuoteIndex = repaired.lastIndexOf('"');
  const beforeLastQuote = repaired.substring(0, lastQuoteIndex);
  const afterLastQuote = repaired.substring(lastQuoteIndex + 1);

  // If there's an unclosed quote and no closing quote after it, try to close it
  if (lastQuoteIndex > 0 && afterLastQuote && !afterLastQuote.includes('"')) {
    // Check if this looks like an incomplete value (no comma or brace after)
    if (!afterLastQuote.trim().match(/^[,}]/)) {
      repaired = beforeLastQuote + '"' + afterLastQuote.trim();
      // Add a comma if needed before closing
      if (!repaired.endsWith(",") && !repaired.endsWith("{")) {
        repaired += ",";
      }
    }
  }

  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;

  // Count unmatched braces and brackets
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
      } else if (char === "[") {
        bracketCount++;
      } else if (char === "]") {
        bracketCount--;
      }
    }
  }

  // Remove trailing comma if it exists before adding closing braces
  repaired = repaired.replace(/,\s*$/, "");

  // Add missing closing brackets first
  while (bracketCount > 0) {
    repaired += "]";
    bracketCount--;
  }

  // Add missing closing braces
  while (braceCount > 0) {
    repaired += "}";
    braceCount--;
  }

  return repaired;
}
