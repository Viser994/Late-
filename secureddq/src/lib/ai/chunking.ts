export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

/** Rough token estimate (~4 chars/token) sufficient for budgeting. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into overlapping chunks on paragraph/sentence boundaries.
 * Overlap preserves context across chunk edges for better retrieval.
 */
export function chunkText(
  text: string,
  { maxTokens = 400, overlapTokens = 60 }: { maxTokens?: number; overlapTokens?: number } = {}
): TextChunk[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let buffer = "";

  const flush = () => {
    const content = buffer.trim();
    if (content) {
      chunks.push({ index: chunks.length, content, tokenCount: estimateTokens(content) });
    }
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (estimateTokens(candidate) > maxTokens && buffer) {
      flush();
      // Seed the next buffer with a trailing overlap for context continuity.
      const overlapChars = overlapTokens * 4;
      const prev = chunks[chunks.length - 1]?.content ?? "";
      buffer = `${prev.slice(-overlapChars)}\n\n${paragraph}`.trim();
    } else {
      buffer = candidate;
    }
  }
  flush();

  return chunks;
}
