import { connectToDatabase } from "@/lib/dbConnect";
import Course from "@/datamodels/course.model";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    await connectToDatabase();
    const courses = await Course.find({}).sort({ date: 1 });
    
    logger.info("Courses fetched successfully", {
      operation: "get_courses",
      count: courses.length,
    });
    
    return createSuccessResponse(courses);
  } catch (error) {
    logger.error("Error fetching courses", error as Error);
    return createErrorResponse("Failed to fetch courses", 500);
  }
}

