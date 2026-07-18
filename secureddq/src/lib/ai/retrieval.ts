import { cosineSimilarity, embedText } from "./embeddings";

export interface RetrievableChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  vector: number[];
}

export interface RetrievedChunk extends RetrievableChunk {
  score: number;
}

/**
 * In-memory semantic retrieval used by the demo/mock path. In production the
 * equivalent query runs in Postgres:
 *
 *   SELECT c.*, d.title
 *   FROM "Embedding" e
 *   JOIN "Chunk" c ON c.id = e."chunkId"
 *   JOIN "Document" d ON d.id = c."documentId"
 *   WHERE d."organizationId" = $orgId
 *   ORDER BY e.vector <=> $queryVector
 *   LIMIT $topK;
 */
export async function retrieveRelevant(
  query: string,
  corpus: RetrievableChunk[],
  topK = 5
): Promise<RetrievedChunk[]> {
  const queryVector = await embedText(query);
  return corpus
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryVector, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
