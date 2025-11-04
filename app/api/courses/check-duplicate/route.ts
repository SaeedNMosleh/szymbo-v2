import { connectToDatabase } from "@/lib/dbConnect";
import Course, { type ICourse } from "@/datamodels/course.model";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseIdParam = searchParams.get("courseId");

    if (!courseIdParam) {
      return createErrorResponse("courseId parameter is required", 400);
    }

    const courseId = parseInt(courseIdParam, 10);

    if (isNaN(courseId) || courseId <= 0) {
      return createErrorResponse("courseId must be a positive number", 400);
    }

    await connectToDatabase();

    const existingCourse = await Course.findOne({ courseId }).lean<ICourse & { createdAt?: Date }>();

    if (existingCourse) {
      logger.info("Duplicate courseId detected", {
        operation: "check_duplicate_course",
        courseId,
      });

      return createSuccessResponse({
        isDuplicate: true,
        message: `Course ID ${courseId} already exists`,
        existingCourse: {
          courseId: existingCourse.courseId,
          date: existingCourse.date,
          courseType: existingCourse.courseType,
          createdAt: existingCourse.createdAt,
        }
      });
    }

    logger.info("CourseId is available", {
      operation: "check_duplicate_course",
      courseId,
    });

    return createSuccessResponse({
      isDuplicate: false,
      message: `Course ID ${courseId} is available`,
    });
  } catch (error) {
    logger.error("Error checking duplicate course", error as Error);
    return createErrorResponse("Failed to check course ID", 500);
  }
}
