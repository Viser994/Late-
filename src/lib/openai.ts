import OpenAI from "openai";

import { env, requireEnv } from "@/lib/env";

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY")
  });
}

export async function embedText(input: string) {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input
  });

  return response.data[0]?.embedding ?? [];
}
