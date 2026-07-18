import { z } from "zod";

import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";

export const answerStyleSchema = z.enum([
  "concise",
  "customer_ready",
  "technical",
  "risk_assessment",
  "yes_no_with_context"
]);

export type AnswerStyle = z.infer<typeof answerStyleSchema>;

export type RetrievedChunk = {
  id: string;
  documentTitle: string;
  section?: string | null;
  page?: number | null;
  content: string;
  similarity: number;
};

export type GeneratedAnswer = {
  answer: string;
  confidence: number;
  uncertaintyNote?: string;
  citations: Array<{
    chunkId: string;
    documentTitle: string;
    quote: string;
    relevance: number;
  }>;
};

const responseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  uncertaintyNote: z.string().optional(),
  citations: z.array(
    z.object({
      chunkId: z.string(),
      quote: z.string(),
      relevance: z.number().min(0).max(1)
    })
  )
});

export async function generateEvidenceBackedAnswer({
  question,
  chunks,
  style = "customer_ready"
}: {
  question: string;
  chunks: RetrievedChunk[];
  style?: AnswerStyle;
}): Promise<GeneratedAnswer> {
  if (chunks.length === 0) {
    return {
      answer:
        "The knowledge base does not currently contain enough evidence to answer this question.",
      confidence: 0,
      uncertaintyNote: "No relevant source documents were retrieved.",
      citations: []
    };
  }

  const client = getOpenAIClient();
  const evidence = chunks
    .map(
      (chunk) =>
        `Chunk ID: ${chunk.id}\nDocument: ${chunk.documentTitle}\nSection: ${
          chunk.section ?? "N/A"
        }\nPage: ${chunk.page ?? "N/A"}\nText:\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  const completion = await client.chat.completions.create({
    model: env.OPENAI_ANSWER_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are SecureDDQ AI. Answer security questionnaires using only the provided evidence. If evidence is missing, say so. Return JSON with answer, confidence, optional uncertaintyNote, and citations containing chunkId, quote, and relevance."
      },
      {
        role: "user",
        content: `Style: ${style}\n\nQuestion:\n${question}\n\nEvidence:\n${evidence}`
      }
    ]
  });

  const raw = completion.choices[0]?.message.content ?? "{}";
  const parsed = responseSchema.parse(JSON.parse(raw));

  return {
    answer: parsed.answer,
    confidence: parsed.confidence,
    uncertaintyNote: parsed.uncertaintyNote,
    citations: parsed.citations.map((citation) => {
      const chunk = chunks.find((candidate) => candidate.id === citation.chunkId);

      return {
        chunkId: citation.chunkId,
        documentTitle: chunk?.documentTitle ?? "Unknown document",
        quote: citation.quote,
        relevance: citation.relevance
      };
    })
  };
}
