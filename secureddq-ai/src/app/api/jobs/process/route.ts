import { NextResponse } from "next/server";
import { processPendingJobs } from "@/lib/jobs/processor";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processPendingJobs(10);
  return NextResponse.json({ processed });
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "job-processor" });
}
