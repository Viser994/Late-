import OpenAI from "openai";
import { db } from "@/lib/db";
import {
  generateEmbedding,
  cosineSimilarity,
  generateEmbeddings,
} from "./embeddings";
import {
  getOpenAI,
  CHAT_MODEL,
  ADVANCED_CHAT_MODEL,
  EMBEDDING_MODEL,
  logAiUsage,
} from "./openai";
import type { AnswerStyle } from "@prisma/client";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber?: number | null;
  section?: string | null;
  score: number;
}

export async function retrieveRelevantChunks(
  organizationId: string,
  query: string,
  limit = 8
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query, organizationId);

  const chunks = await db.documentChunk.findMany({
    where: {
      document: {
        organizationId,
        status: "READY",
        archivedAt: null,
      },
    },
    include: {
      document: { select: { id: true, name: true } },
      embedding: true,
    },
    take: 500,
  });

  const scored: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    let score = 0;
    if (chunk.embedding) {
      const embeddingResult = await db.$queryRaw<{ embedding: string }[]>`
        SELECT embedding::text FROM "ChunkEmbedding" WHERE "chunkId" = ${chunk.id}
      `;
      if (embeddingResult[0]?.embedding) {
        const stored = parseVector(embeddingResult[0].embedding);
        score = cosineSimilarity(queryEmbedding, stored);
      }
    } else {
      const lowerContent = chunk.content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const words = lowerQuery.split(/\s+/).filter((w) => w.length > 3);
      score =
        words.filter((w) => lowerContent.includes(w)).length /
        Math.max(words.length, 1);
    }

    if (score > 0.1) {
      scored.push({
        chunkId: chunk.id,
        documentId: chunk.document.id,
        documentName: chunk.document.name,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        section: chunk.section,
        score,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function parseVector(text: string): number[] {
  return text
    .replace(/[\[\]]/g, "")
    .split(",")
    .map(Number);
}

const STYLE_PROMPTS: Record<AnswerStyle, string> = {
  CONCISE: "Provide a brief, direct answer in 1-2 sentences.",
  DETAILED: "Provide a comprehensive answer with relevant details.",
  TECHNICAL: "Provide a technical answer with specific controls and implementations.",
  EXECUTIVE: "Provide a high-level executive summary suitable for business stakeholders.",
};

export interface GeneratedAnswer {
  content: string;
  confidence: number;
  isUncertain: boolean;
  citations: Array<{
    documentId: string;
    documentName: string;
    chunkId: string;
    excerpt: string;
    pageNumber?: number | null;
    relevance: number;
  }>;
}

export async function generateAnswer(params: {
  organizationId: string;
  question: string;
  style?: AnswerStyle;
  useAdvancedModel?: boolean;
}): Promise<GeneratedAnswer> {
  const chunks = await retrieveRelevantChunks(
    params.organizationId,
    params.question
  );

  if (chunks.length === 0) {
    return {
      content:
        "Unable to find relevant documentation to answer this question. Please upload security documentation to the knowledge base.",
      confidence: 0,
      isUncertain: true,
      citations: [],
    };
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.documentName}${c.pageNumber ? `, p.${c.pageNumber}` : ""}]\n${c.content}`
    )
    .join("\n\n---\n\n");

  const style = params.style ?? "DETAILED";
  const model = params.useAdvancedModel ? ADVANCED_CHAT_MODEL : CHAT_MODEL;
  const openai = getOpenAI();

  const systemPrompt = `You are a cybersecurity compliance expert assistant for an enterprise security team.
Answer questions based ONLY on the provided documentation context.
${STYLE_PROMPTS[style]}

CRITICAL RULES:
- Only use information from the provided sources
- If the documentation doesn't contain enough information, say so clearly
- Never invent or assume security controls not mentioned in the sources
- Reference specific controls, policies, or procedures when available
- Be accurate and professional`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Context from security documentation:\n\n${context}\n\n---\n\nQuestion: ${params.question}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1500,
  });

  const content =
    response.choices[0]?.message?.content ??
    "Unable to generate an answer.";

  await logAiUsage({
    organizationId: params.organizationId,
    operation: "generate_answer",
    model,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  });

  const avgScore =
    chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;
  const confidence = Math.min(avgScore * 1.2, 0.99);
  const isUncertain =
    confidence < 0.5 ||
    content.toLowerCase().includes("unable to find") ||
    content.toLowerCase().includes("don't have enough") ||
    content.toLowerCase().includes("not mentioned");

  return {
    content,
    confidence,
    isUncertain,
    citations: chunks.slice(0, 5).map((c) => ({
      documentId: c.documentId,
      documentName: c.documentName,
      chunkId: c.chunkId,
      excerpt: c.content.slice(0, 300),
      pageNumber: c.pageNumber,
      relevance: c.score,
    })),
  };
}

export async function chatWithKnowledgeBase(params: {
  organizationId: string;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{
  content: string;
  citations: GeneratedAnswer["citations"];
}> {
  const chunks = await retrieveRelevantChunks(
    params.organizationId,
    params.message,
    10
  );

  const context =
    chunks.length > 0
      ? chunks
          .map(
            (c, i) =>
              `[${i + 1}] ${c.documentName}: ${c.content}`
          )
          .join("\n\n")
      : "No relevant documentation found.";

  const openai = getOpenAI();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are SecureDDQ AI, a security knowledge assistant. Answer based only on provided documentation. Always cite sources using [1], [2] notation. If information isn't in the docs, say so.

Documentation:
${context}`,
    },
    ...(params.history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: params.message },
  ];

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 2000,
  });

  await logAiUsage({
    organizationId: params.organizationId,
    operation: "chat",
    model: CHAT_MODEL,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  });

  return {
    content:
      response.choices[0]?.message?.content ??
      "I couldn't process your request.",
    citations: chunks.slice(0, 5).map((c) => ({
      documentId: c.documentId,
      documentName: c.documentName,
      chunkId: c.chunkId,
      excerpt: c.content.slice(0, 200),
      pageNumber: c.pageNumber,
      relevance: c.score,
    })),
  };
}

export async function storeChunkEmbeddings(
  organizationId: string,
  chunkIds: string[],
  contents: string[]
) {
  const embeddings = await generateEmbeddings(contents, organizationId);

  for (let i = 0; i < chunkIds.length; i++) {
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await db.$executeRaw`
      INSERT INTO "ChunkEmbedding" (id, "chunkId", embedding, model, "createdAt")
      VALUES (gen_random_uuid()::text, ${chunkIds[i]}, ${vectorStr}::vector, ${EMBEDDING_MODEL}, NOW())
      ON CONFLICT ("chunkId") DO UPDATE SET embedding = ${vectorStr}::vector
    `;
  }
}
