import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import Course from "@/datamodels/course.model";

export async function GET() {
  try {
    await connectToDatabase();
    const courses = await Course.find({}).sort({ date: 1 });
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

