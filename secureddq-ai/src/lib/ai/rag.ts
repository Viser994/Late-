import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getEmbedding } from "@/lib/ai/embeddings";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  fileName: string;
  score: number;
};

export async function retrieveChunks(organizationId: string, query: string, limit = 8) {
  const embedding = await getEmbedding(query);

  if (embedding.length === 0) {
    return [];
  }

  const vector = `[${embedding.join(",")}]`;

  const rows = await db.$queryRaw<RetrievedChunk[]>(Prisma.sql`
    SELECT
      c.id,
      c."documentId",
      c.content,
      d."fileName",
      1 - (c.embedding <=> ${vector}::vector) AS score
    FROM "DocumentChunk" c
    INNER JOIN "Document" d ON d.id = c."documentId"
    WHERE d."organizationId" = ${organizationId}
      AND d.status = 'ACTIVE'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `);

  return rows;
}

export async function generateEvidenceBackedAnswer(params: {
  organizationId: string;
  question: string;
  style?: "brief" | "standard" | "detailed";
}) {
  const style = params.style ?? "standard";
  const chunks = await retrieveChunks(params.organizationId, params.question);
  const evidenceBlock = chunks
    .map((chunk, idx) => `Source ${idx + 1} (${chunk.fileName}):\n${chunk.content}`)
    .join("\n\n");

  if (chunks.length === 0) {
    return {
      answer:
        "Insufficient evidence in the current knowledge base. Upload or map relevant policy documents before answering.",
      confidence: 0,
      citations: [],
    };
  }

  const completion = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You are a cybersecurity questionnaire assistant.",
              "Only answer using the evidence provided.",
              "If evidence is insufficient, explicitly say so.",
              "Return concise enterprise-ready answers with citation markers [1], [2], etc.",
              `Answer style: ${style}.`,
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: `Question:\n${params.question}\n\nEvidence:\n${evidenceBlock}` }],
      },
    ],
  });

  const answer = completion.output_text?.trim() ?? "Unable to generate answer.";
  const confidence = Math.min(
    0.99,
    chunks.reduce((acc, chunk) => acc + chunk.score, 0) / Math.max(chunks.length, 1),
  );

  return {
    answer,
    confidence: Number(confidence.toFixed(2)),
    citations: chunks.map((chunk, idx) => ({
      index: idx + 1,
      documentId: chunk.documentId,
      chunkId: chunk.id,
      fileName: chunk.fileName,
      score: Number(chunk.score.toFixed(3)),
    })),
  };
}
