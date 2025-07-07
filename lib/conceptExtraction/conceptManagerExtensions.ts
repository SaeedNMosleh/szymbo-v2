// Import only what's needed
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { ConceptCategory } from "@/lib/enum";
import ConceptModel, { IConcept } from "@/datamodels/concept.model";

// Add type declaration to extend ConceptManager's prototype
declare module "@/lib/conceptExtraction/conceptManager" {
  interface ConceptManager {
    getConceptsPaginated(options: {
      page?: number;
      limit?: number;
      category?: ConceptCategory | null;
      isActive?: boolean;
    }): Promise<{
      success: boolean;
      data: IConcept[];
      total: number;
      error?: string;
    }>;

    getConceptCount(query: {
      isActive?: boolean;
      category?: ConceptCategory | null;
    }): Promise<number>;

    getConceptsWithQuery(
      query: {
        isActive?: boolean;
        category?: ConceptCategory | null;
      },
      skip: number,
      limit: number
    ): Promise<IConcept[]>;
  }
}

// This is a helper file that extends the ConceptManager with methods for pagination and filtering

// Extend the ConceptManager with a new method for paginated concepts with filters
ConceptManager.prototype.getConceptsPaginated = async function (options: {
  page?: number;
  limit?: number;
  category?: ConceptCategory | null;
  isActive?: boolean;
}) {
  const { page = 1, limit = 20, category = null, isActive = true } = options;

  try {
    // Build query based on filters
    const query: {
      isActive?: boolean;
      category?: ConceptCategory | null;
    } = {};

    // Filter by active status
    if (isActive !== null) {
      query.isActive = isActive;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Get total count for pagination
    const total = await this.getConceptCount(query);

    // Get paginated data
    const skip = (page - 1) * limit;
    const concepts = await this.getConceptsWithQuery(query, skip, limit);

    return {
      success: true,
      data: concepts,
      total,
    };
  } catch (error) {
    console.error("Error fetching paginated concepts:", error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Helper method to get count of concepts matching query
ConceptManager.prototype.getConceptCount = async function (query: {
  isActive?: boolean;
  category?: ConceptCategory | null;
}) {
  return await ConceptModel.countDocuments(query);
};

// Helper method to get concepts matching query with pagination
ConceptManager.prototype.getConceptsWithQuery = async function (
  query: {
    isActive?: boolean;
    category?: ConceptCategory | null;
  },
  skip: number,
  limit: number
) {
  const concepts = await ConceptModel.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return concepts.map((concept) => concept.toObject());
};
