import type { AnswerStyle } from "@prisma/client";
import { AI_CONFIG } from "./config";
import { getOpenAI } from "./openai";
import type { RetrievedChunk } from "./retrieval";

export interface GeneratedAnswer {
  content: string;
  confidence: number;
  citations: { documentTitle: string; quote: string; relevance: number }[];
  aiGenerated: boolean;
}

const STYLE_INSTRUCTIONS: Record<AnswerStyle, string> = {
  CONCISE: "Answer in 1-2 tight sentences. No preamble.",
  DETAILED: "Answer thoroughly in a short paragraph with concrete specifics.",
  FORMAL: "Answer in formal, audit-ready language suitable for a security questionnaire.",
  TECHNICAL: "Answer with precise technical detail, naming systems, algorithms, and controls.",
};

const SYSTEM_PROMPT = `You are a security compliance analyst answering a vendor security questionnaire.
Rules:
- Answer ONLY using the provided context excerpts.
- If the context does not contain the answer, say you do not have sufficient documentation and lower your confidence.
- Never invent controls, certifications, or facts.
- Cite the source documents you relied on.`;

/**
 * Generate an evidence-backed answer for a question using retrieved context.
 * Uses OpenAI when available; otherwise composes a grounded answer from the
 * highest-scoring retrieved chunks so the workflow stays testable offline.
 */
export async function generateAnswer(
  question: string,
  retrieved: RetrievedChunk[],
  style: AnswerStyle = "DETAILED"
): Promise<GeneratedAnswer> {
  const citations = retrieved
    .filter((r) => r.score > 0)
    .slice(0, 4)
    .map((r) => ({
      documentTitle: r.documentTitle,
      quote: firstSentences(r.content, 2),
      relevance: Number(r.score.toFixed(2)),
    }));

  const confidence = computeConfidence(retrieved);
  const client = getOpenAI();

  if (client && retrieved.length > 0) {
    const context = retrieved
      .map((r, i) => `[${i + 1}] (${r.documentTitle})\n${r.content}`)
      .join("\n\n");
    const completion = await client.chat.completions.create({
      model: AI_CONFIG.chatModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n${STYLE_INSTRUCTIONS[style]}` },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    });
    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return { content, confidence, citations, aiGenerated: true };
  }

  // Offline fallback: synthesize a grounded answer from retrieved evidence.
  if (retrieved.length === 0 || confidence < 0.15) {
    return {
      content:
        "We do not currently have documentation in the knowledge base that directly answers this question. Please upload the relevant policy or evidence, or route this question to a security manager for a manual response.",
      confidence: Math.min(confidence, 0.3),
      citations,
      aiGenerated: true,
    };
  }
  const top = retrieved.slice(0, 2).map((r) => firstSentences(r.content, 2)).join(" ");
  return {
    content: `Based on our security documentation: ${top}`,
    confidence,
    citations,
    aiGenerated: true,
  };
}

/** Confidence derived from top retrieval scores and evidence breadth. */
function computeConfidence(retrieved: RetrievedChunk[]): number {
  if (retrieved.length === 0) return 0;
  const top = retrieved[0]!.score;
  const breadth = Math.min(retrieved.filter((r) => r.score > 0.2).length / 3, 1);
  return Number(Math.min(0.35 * breadth + 0.65 * top, 0.99).toFixed(2));
}

function firstSentences(text: string, count: number): string {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, count).join(" ").trim();
}
