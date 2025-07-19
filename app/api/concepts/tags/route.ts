import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Concept from "@/datamodels/concept.model";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/concepts/tags
 * Returns all unique tags from concepts in the database
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    // Build aggregation pipeline to extract unique tags
    const pipeline: any[] = [];

    // Filter by course if specified
    if (courseId) {
      pipeline.push({
        $match: { courseId: parseInt(courseId) }
      });
    }

    // Unwind the tags array to get individual tags
    pipeline.push(
      { $unwind: "$tags" },
      // Group by tag to get unique values and count frequency
      {
        $group: {
          _id: "$tags",
          frequency: { $sum: 1 },
          courses: { $addToSet: "$courseId" }
        }
      },
      // Sort by frequency (most used first)
      { $sort: { frequency: -1, _id: 1 } },
      // Project to clean format
      {
        $project: {
          tag: "$_id",
          frequency: 1,
          courses: 1,
          _id: 0
        }
      }
    );

    const result = await Concept.aggregate(pipeline);

    // Extract just the tag names for simple autocomplete
    const tagNames = result.map((item: any) => item.tag);

    return createSuccessResponse({
      tags: tagNames,
      tagDetails: result,
      totalUniqueTags: result.length
    });

  } catch (error) {
    console.error("Error fetching concept tags:", error);
    return createErrorResponse(
      "Failed to fetch concept tags",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}