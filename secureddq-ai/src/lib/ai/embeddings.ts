import OpenAI from "openai";
import { env } from "@/lib/env";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function getEmbedding(input: string) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0]?.embedding ?? [];
}
