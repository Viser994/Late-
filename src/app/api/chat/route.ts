import { NextResponse } from "next/server";
import { z } from "zod";

import { generateEvidenceBackedAnswer } from "@/lib/ai/answer-engine";
import { searchKnowledgeBase } from "@/lib/search";

const requestSchema = z.object({
  organizationId: z.string(),
  question: z.string().min(3),
  style: z
    .enum([
      "concise",
      "customer_ready",
      "technical",
      "risk_assessment",
      "yes_no_with_context"
    ])
    .default("customer_ready")
});

export async function POST(request: Request) {
  const body = requestSchema.parse(await request.json());
  const results = await searchKnowledgeBase({
    organizationId: body.organizationId,
    query: body.question
  });

  const answer = await generateEvidenceBackedAnswer({
    question: body.question,
    style: body.style,
    chunks: results.map((chunk) => ({
      id: chunk.id,
      documentTitle: chunk.document.title,
      section: chunk.section,
      page: chunk.page,
      content: chunk.content,
      similarity: 0.75
    }))
  });

  return NextResponse.json(answer);
}
