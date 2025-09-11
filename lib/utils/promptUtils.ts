/**
 * Utility functions for handling AI prompts and their limitations
 */

import { OPENAI_LIMITS } from "../enum";

/**
 * Configuration for prompt truncation
 */
interface PromptTruncationConfig {
  maxLength: number;
  preservePrefix?: string;
  preserveSuffix?: string;
  truncationIndicator?: string;
}

/**
 * Intelligently truncate a prompt while preserving important structural elements
 */
export function truncatePrompt(
  prompt: string,
  config: PromptTruncationConfig
): { truncated: string; wasTruncated: boolean; originalLength: number } {
  const {
    maxLength,
    preservePrefix = "",
    preserveSuffix = "",
    truncationIndicator = "\n\n[...content truncated for length...]",
  } = config;

  if (prompt.length <= maxLength) {
    return {
      truncated: prompt,
      wasTruncated: false,
      originalLength: prompt.length,
    };
  }

  // Calculate available space for content after preserving prefix, suffix, and indicator
  const reservedSpace =
    preservePrefix.length + preserveSuffix.length + truncationIndicator.length;
  const availableSpace = maxLength - reservedSpace;

  if (availableSpace <= 0) {
    // If we can't even fit the preserved parts, just truncate brutally
    return {
      truncated: prompt.substring(0, maxLength - 3) + "...",
      wasTruncated: true,
      originalLength: prompt.length,
    };
  }

  // Try to find good truncation points (end of sentences, paragraphs, etc.)
  const content = prompt.substring(
    preservePrefix.length,
    prompt.length - preserveSuffix.length
  );

  if (content.length <= availableSpace) {
    return {
      truncated: prompt,
      wasTruncated: false,
      originalLength: prompt.length,
    };
  }

  // Find a good truncation point
  const truncationTarget = availableSpace - truncationIndicator.length;
  let truncationPoint = truncationTarget;

  // Try to find a good breaking point (sentence end, line break, etc.)
  const breakPoints = [". ", "\n\n", "\n", ": ", ", "];

  for (const breakPoint of breakPoints) {
    const lastBreakIndex = content.lastIndexOf(breakPoint, truncationTarget);
    if (lastBreakIndex > truncationTarget * 0.7) {
      // Only use if we're not cutting too much
      truncationPoint = lastBreakIndex + breakPoint.length;
      break;
    }
  }

  const truncatedContent = content.substring(0, truncationPoint);
  const result =
    preservePrefix + truncatedContent + truncationIndicator + preserveSuffix;

  return {
    truncated: result,
    wasTruncated: true,
    originalLength: prompt.length,
  };
}

/**
 * Truncate image generation prompt while preserving key structure
 */
export function truncateImagePrompt(prompt: string): {
  truncated: string;
  wasTruncated: boolean;
  originalLength: number;
} {
  // For image prompts, preserve the objective and core requirements
  const objectiveMatch = prompt.match(/## OBJECTIVE:([\s\S]*?)(?=##|$)/);
  const requirementsMatch = prompt.match(
    /## EDUCATIONAL REQUIREMENTS:([\s\S]*?)(?=##|$)/
  );
  const styleMatch = prompt.match(/## VISUAL STYLE:([\s\S]*?)(?=##|$)/);

  let preservePrefix = "";
  let preserveSuffix = "";

  if (objectiveMatch) {
    preservePrefix += "## OBJECTIVE:" + objectiveMatch[1];
  }

  if (requirementsMatch && styleMatch) {
    preserveSuffix =
      "## EDUCATIONAL REQUIREMENTS:" +
      requirementsMatch[1] +
      "## VISUAL STYLE:" +
      styleMatch[1];
  } else if (requirementsMatch) {
    preserveSuffix = "## EDUCATIONAL REQUIREMENTS:" + requirementsMatch[1];
  } else if (styleMatch) {
    preserveSuffix = "## VISUAL STYLE:" + styleMatch[1];
  }

  return truncatePrompt(prompt, {
    maxLength: OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH,
    preservePrefix,
    preserveSuffix,
    truncationIndicator: "\n\n[Dynamic context truncated for length...]",
  });
}

/**
 * Validate and prepare prompt for OpenAI image generation
 */
export function validateImagePrompt(prompt: string): {
  isValid: boolean;
  prompt: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (prompt.length > OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH) {
    const { truncated, wasTruncated, originalLength } =
      truncateImagePrompt(prompt);

    if (wasTruncated) {
      warnings.push(
        `Prompt truncated from ${originalLength} to ${truncated.length} characters to meet DALL-E 3 limit`
      );
    }

    return {
      isValid: true,
      prompt: truncated,
      warnings,
    };
  }

  return {
    isValid: true,
    prompt,
    warnings,
  };
}
