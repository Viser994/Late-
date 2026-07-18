import { AI_CONFIG } from "./config";
import { getOpenAI } from "./openai";

/**
 * Generate an embedding vector for a piece of text. When no OpenAI key is
 * configured a deterministic hash-based pseudo-embedding is returned so the
 * retrieval pipeline stays fully functional in local/demo environments.
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getOpenAI();
  if (client) {
    const res = await client.embeddings.create({
      model: AI_CONFIG.embeddingModel,
      input: text,
    });
    return res.data[0]!.embedding;
  }
  return mockEmbedding(text);
}

/** Batch embedding with the same fallback semantics. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const client = getOpenAI();
  if (client) {
    const res = await client.embeddings.create({
      model: AI_CONFIG.embeddingModel,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
  return texts.map(mockEmbedding);
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic bag-of-words hashing embedding. Not semantically rich, but
 * stable and dependency-free — good enough to exercise the RAG plumbing.
 */
export function mockEmbedding(text: string): number[] {
  const dims = AI_CONFIG.embeddingDimensions;
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[(h >>> 0) % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
