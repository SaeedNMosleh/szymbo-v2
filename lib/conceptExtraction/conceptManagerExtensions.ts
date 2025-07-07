import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptManager } from "@/lib/conceptExtraction/conceptManager";
import { z } from "zod";
import { ConceptCategory } from "@/lib/enum";

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
    const query: any = {};

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
ConceptManager.prototype.getConceptCount = async function (query: any) {
  const Concept = require("@/datamodels/concept.model").default;
  return await Concept.countDocuments(query);
};

// Helper method to get concepts matching query with pagination
ConceptManager.prototype.getConceptsWithQuery = async function (
  query: any,
  skip: number,
  limit: number
) {
  const Concept = require("@/datamodels/concept.model").default;
  const concepts = await Concept.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return concepts.map((concept: any) => concept.toObject());
};
