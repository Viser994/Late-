import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { hasOpenAI } from "@/lib/ai/config";
import { hasStripe } from "@/lib/billing/stripe";
import { hasS3 } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Liveness + configured-integrations report. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    integrations: {
      database: hasDatabase(),
      openai: hasOpenAI(),
      stripe: hasStripe(),
      storage: hasS3(),
    },
  });
}
