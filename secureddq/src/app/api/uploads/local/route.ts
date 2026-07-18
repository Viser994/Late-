import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Local development upload endpoint used when S3 is not configured. Accepts a
 * PUT/POST and acknowledges receipt. In production, uploads go directly to S3
 * via a presigned URL (see `@/lib/storage`).
 */
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  return NextResponse.json({ stored: true, key });
}

export async function POST(req: Request) {
  return PUT(req);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  return NextResponse.json({ key, note: "Local dev storage stub" });
}
