import { getOpenAI, EMBEDDING_MODEL, logAiUsage } from "./openai";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(" ");
      const overlap = words.slice(-Math.floor(CHUNK_OVERLAP / 5)).join(" ");
      current = overlap + "\n\n" + paragraph;
    } else {
      current += (current ? "\n\n" : "") + paragraph;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

export async function generateEmbedding(
  text: string,
  organizationId?: string
): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  if (organizationId) {
    await logAiUsage({
      organizationId,
      operation: "embedding",
      model: EMBEDDING_MODEL,
      inputTokens: response.usage?.total_tokens ?? 0,
      outputTokens: 0,
    });
  }

  return response.data[0].embedding;
}

export async function generateEmbeddings(
  texts: string[],
  organizationId?: string
): Promise<number[][]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, 8000)),
  });

  if (organizationId) {
    await logAiUsage({
      organizationId,
      operation: "embedding_batch",
      model: EMBEDDING_MODEL,
      inputTokens: response.usage?.total_tokens ?? 0,
      outputTokens: 0,
    });
  }

  return response.data.map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
