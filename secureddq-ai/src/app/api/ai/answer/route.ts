import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateEvidenceBackedAnswer } from "@/lib/ai/rag";
import { apiRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  organizationId: z.string().min(1),
  question: z.string().min(10),
  style: z.enum(["brief", "standard", "detailed"]).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await apiRateLimit.limit(`ai-answer:${userId}`);
  if (!rate.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await generateEvidenceBackedAnswer(parsed.data);
  return NextResponse.json(result);
}
