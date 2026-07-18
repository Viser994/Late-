import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "secureddq-ai",
    timestamp: new Date().toISOString(),
  });
}
