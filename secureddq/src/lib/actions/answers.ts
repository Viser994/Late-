"use server";

import type { AnswerStyle } from "@prisma/client";
import { generateAnswer, type GeneratedAnswer } from "@/lib/ai/answer-engine";
import { retrieveRelevant } from "@/lib/ai/retrieval";
import { getDemoCorpus } from "@/lib/ai/demo-corpus";

/**
 * Generate (or regenerate) an evidence-backed answer for a single question.
 * In production this also persists the answer + citations and records AI usage.
 */
export async function generateAnswerForQuestion(
  prompt: string,
  style: AnswerStyle = "DETAILED"
): Promise<GeneratedAnswer> {
  const corpus = getDemoCorpus();
  const retrieved = await retrieveRelevant(prompt, corpus, 5);
  return generateAnswer(prompt, retrieved, style);
}
