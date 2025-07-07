// app/api/practice-new/session/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/dbConnect";
import { ConceptPracticeEngine } from "@/lib/practiceEngine/conceptPracticeEngine";

// GET /api/practice-new/session/stats - Get practice statistics  
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default";

    const practiceEngine = new ConceptPracticeEngine();
    
    // Get practice statistics
    const stats = await practiceEngine.getPracticeStats(userId);

    return NextResponse.json({
      success: true,
      data: stats
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching practice stats:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch practice statistics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}