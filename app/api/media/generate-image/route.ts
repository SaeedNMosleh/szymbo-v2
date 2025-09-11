import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/apiResponse";
import { OpenAIService } from "@/lib/services/llm/openAIService";
import { LLMServiceError } from "@/lib/utils/errors";
import { validateImagePrompt } from "@/lib/utils/promptUtils";
import { OPENAI_LIMITS } from "@/lib/enum";

/**
 * Creates sophisticated educational image prompts that test comprehension without revealing answers
 */
function createEducationalImagePrompt(
  basePrompt: string,
  polishWord: string
): string {
  // Generate semantic context without revealing the target word
  const semanticCategories = {
    // Household items
    household: [
      "kitchen scene",
      "living room setting",
      "bedroom environment",
      "bathroom context",
    ],
    // Animals
    animals: [
      "natural habitat",
      "farm setting",
      "forest scene",
      "domestic environment",
    ],
    // Food items
    food: [
      "dining table setup",
      "kitchen preparation area",
      "market stall",
      "restaurant scene",
    ],
    // Clothing
    clothing: [
      "wardrobe setting",
      "shopping scene",
      "seasonal context",
      "formal/casual situation",
    ],
    // Vehicles
    transport: [
      "street scene",
      "travel context",
      "urban environment",
      "transportation hub",
    ],
    // Actions/verbs
    actions: [
      "daily activity scene",
      "workplace setting",
      "recreational context",
      "social situation",
    ],
    // Body parts
    body: [
      "healthcare setting",
      "exercise context",
      "daily routine scene",
      "medical illustration",
    ],
    // Colors
    colors: [
      "art studio",
      "nature scene",
      "decorative context",
      "rainbow/spectrum setting",
    ],
    // Numbers
    numbers: [
      "counting context",
      "mathematical setting",
      "clock/time scene",
      "quantity illustration",
    ],
    // Weather
    weather: [
      "seasonal landscape",
      "outdoor activity",
      "climate visualization",
      "atmospheric scene",
    ],
  };

  // Analyze the Polish word to determine category and create contextual scene
  const wordLower = polishWord.toLowerCase();
  let sceneContext = "everyday life scene";
  let visualNarrative = "";

  // Sophisticated category detection and scene creation
  if (
    wordLower.match(
      /(dom|mieszkanie|pokój|kuchnia|łazienka|stół|krzesło|łóżko)/
    )
  ) {
    sceneContext = getRandomElement(semanticCategories.household);
    visualNarrative =
      "Show a detailed interior scene where this item would naturally be found and used";
  } else if (wordLower.match(/(kot|pies|ptak|koń|krowa|ryba)/)) {
    sceneContext = getRandomElement(semanticCategories.animals);
    visualNarrative =
      "Illustrate the natural environment where this creature lives and thrives";
  } else if (
    wordLower.match(/(chleb|mięso|owoc|warzywo|mleko|ser|jajko|ryż)/)
  ) {
    sceneContext = getRandomElement(semanticCategories.food);
    visualNarrative =
      "Depict a culinary context showing how this ingredient is used or prepared";
  } else if (wordLower.match(/(ubranie|spodnie|koszula|buty|czapka|płaszcz)/)) {
    sceneContext = getRandomElement(semanticCategories.clothing);
    visualNarrative =
      "Show a fashion or dressing context where this item would be worn";
  } else if (wordLower.match(/(samochód|autobus|pociąg|samolot|rower)/)) {
    sceneContext = getRandomElement(semanticCategories.transport);
    visualNarrative =
      "Create a transportation scene showing this vehicle in action";
  } else if (wordLower.match(/(biegać|czytać|pisać|gotować|spać|jeść)/)) {
    sceneContext = getRandomElement(semanticCategories.actions);
    visualNarrative =
      "Illustrate someone performing this activity in an appropriate setting";
  } else {
    // Default: create contextual scene based on base prompt
    visualNarrative = `Create an educational illustration that shows the concept of "${basePrompt}" without text`;
    sceneContext = "contextually appropriate educational setting";
  }

  // Build comprehensive educational prompt
  return `Educational illustration for Polish language learning:

SCENE: ${sceneContext}
VISUAL NARRATIVE: ${visualNarrative}

STYLE REQUIREMENTS:
- Clear, cartoon-style illustration with bright, engaging colors
- Clean, uncluttered composition suitable for language learning
- High contrast and clear visual elements
- Professional educational artwork quality
- NO TEXT, words, letters, or written language visible anywhere in the image
- NO labels or captions of any kind

EDUCATIONAL FOCUS:
- Visual should help learners understand the concept through context and setting
- Include relevant environmental details that provide cultural context
- Show realistic usage or natural context
- Make the visual relationship clear and meaningful for Polish language learners

TECHNICAL SPECS:
- Bright, appealing color palette suitable for educational materials  
- Clean background that doesn't distract from the main subject
- Professional illustration quality with clear details
- Appropriate for all ages and cultural backgrounds

Remember: This image will be used to test comprehension - learners should understand what it represents through visual context alone, without any text clues.`;
}

/**
 * Helper function to get random element from array
 */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const GenerateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(
      OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH,
      `Prompt too long (max ${OPENAI_LIMITS.DALLE_3_PROMPT_MAX_LENGTH} characters)`
    ),
  polishWord: z
    .string()
    .min(1, "Polish word is required")
    .max(100, "Polish word too long"),
  size: z
    .enum(["1024x1024", "1024x1536", "1536x1024"])
    .optional()
    .default("1024x1024"),
  questionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = GenerateImageSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse("Invalid request parameters", 400, {
        validationErrors: validationResult.error.issues,
      });
    }

    const { prompt, polishWord, size, questionId } = validationResult.data;

    // Create sophisticated educational prompt that hides the answer while maintaining learning value
    const enhancedPrompt = createEducationalImagePrompt(
      prompt,
      polishWord
    );

    // Validate the enhanced prompt for length constraints
    const validation = validateImagePrompt(enhancedPrompt);

    if (validation.warnings.length > 0) {
      console.warn("Image prompt validation warnings:", validation.warnings);
    }

    // Initialize OpenAI service
    const openAIService = new OpenAIService({
      apiKey: process.env.OPENAI_API_KEY!,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Generate image using validated prompt
    const imageUrl = await openAIService.generateImage(validation.prompt, size);

    return createSuccessResponse({
      imageUrl,
      size,
      polishWord,
      originalPrompt: prompt,
      enhancedPrompt,
      questionId,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    if (error instanceof LLMServiceError) {
      const context = error.context as { status?: number; provider?: string };
      return createErrorResponse(error.message, context?.status || 500, {
        provider: context?.provider,
      });
    }

    if (error instanceof Error) {
      return createErrorResponse("Image generation failed", 500, {
        message: error.message,
      });
    }

    return createErrorResponse("Unknown error occurred", 500);
  }
}
