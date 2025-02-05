import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/dbConnect"
import PracticeSession from "@/datamodels/practice.model"

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json()
    const session = new PracticeSession(body)
    await session.save()
    return NextResponse.json({ success: true, session }, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Failed to save practice session" }, { status: 500 })
  }
}
