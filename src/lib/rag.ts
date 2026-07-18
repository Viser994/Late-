import { prisma } from "./prisma";
import { generateEmbedding, generateAnswer } from "./openai";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const TOP_K = 5;

export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE) {
      if (current) {
        chunks.push(current.trim());
        // Keep overlap
        const words = current.split(" ");
        const overlapWords = words.slice(
          -Math.floor(CHUNK_OVERLAP / 5)
        );
        current = overlapWords.join(" ") + " " + sentence;
      } else {
        chunks.push(sentence.trim());
        current = "";
      }
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 50);
}

export async function indexDocument(
  documentId: string,
  text: string
): Promise<void> {
  const chunks = splitTextIntoChunks(text);

  // Delete existing chunks
  await prisma.documentChunk.deleteMany({ where: { documentId } });

  // Create new chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    await (prisma as any).$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", "tokenCount", embedding, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${documentId},
        ${chunk},
        ${i},
        ${Math.ceil(chunk.length / 4)},
        ${JSON.stringify(embedding)}::vector,
        NOW()
      )
    `;
  }
}

export async function searchSimilarChunks(
  organizationId: string,
  query: string,
  topK: number = TOP_K
): Promise<
  Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    content: string;
    similarity: number;
  }>
> {
  const embedding = await generateEmbedding(query);

  const results = await (prisma as any).$queryRaw<
    Array<{
      chunk_id: string;
      document_id: string;
      document_name: string;
      content: string;
      similarity: number;
    }>
  >`
    SELECT 
      dc.id as chunk_id,
      dc."documentId" as document_id,
      d.name as document_name,
      dc.content,
      1 - (dc.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d."organizationId" = ${organizationId}
      AND d.status = 'READY'
      AND d."isArchived" = false
    ORDER BY dc.embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${topK}
  `;

  return results.map((r: any) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    documentName: r.document_name,
    content: r.content,
    similarity: r.similarity,
  }));
}

export async function generateQuestionAnswer(
  organizationId: string,
  questionText: string,
  style: string = "professional"
): Promise<{
  answer: string;
  confidence: number;
  sources: Array<{ documentId: string; documentName: string; excerpt: string }>;
}> {
  const chunks = await searchSimilarChunks(organizationId, questionText);

  if (chunks.length === 0) {
    return {
      answer:
        "No relevant documentation found to answer this question. Please upload relevant security documentation to your knowledge base.",
      confidence: 0,
      sources: [],
    };
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.documentName}]\n${c.content}`
    )
    .join("\n\n---\n\n");

  const { answer, confidence } = await generateAnswer({
    question: questionText,
    context,
    style,
  });

  const sources = chunks.map((c) => ({
    documentId: c.documentId,
    documentName: c.documentName,
    excerpt: c.content.substring(0, 200) + "...",
  }));

  return { answer, confidence, sources };
}
