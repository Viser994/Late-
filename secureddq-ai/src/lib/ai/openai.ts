import OpenAI from "openai";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export function getOpenAI(): OpenAI {
  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return globalForOpenAI.openai;
}

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const CHAT_MODEL = "gpt-4o-mini";
export const ADVANCED_CHAT_MODEL = "gpt-4o";

export async function logAiUsage(params: {
  organizationId: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
}) {
  await db.aiUsageLog.create({
    data: {
      organizationId: params.organizationId,
      operation: params.operation,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
