// Import the classes for the factory function
import { ConceptLLMService, safeConceptExtraction } from "./conceptLLM";
import { ConceptManager, createConceptManager } from "./conceptManager";
import { ConceptExtractor, createConceptExtractor } from "./conceptExtractor";

// Export types
export * from "./types";

// Re-export services
export { ConceptLLMService, safeConceptExtraction };
export { ConceptManager, createConceptManager };
export { ConceptExtractor, createConceptExtractor };

// Factory function to create the complete concept extraction system
export function createConceptExtractionSystem() {
  const llmService = new ConceptLLMService();
  const conceptManager = createConceptManager(llmService);
  const conceptExtractor = createConceptExtractor(conceptManager, llmService);

  return {
    llmService,
    conceptManager,
    conceptExtractor,
  };
}
