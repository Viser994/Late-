export const AI_CONFIG = {
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingDimensions: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536),
};

/** Whether a real OpenAI key is configured. When false, services use mocks. */
export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
