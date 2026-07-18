import { prisma } from "@/lib/prisma";

export async function searchKnowledgeBase({
  organizationId,
  query,
  limit = 8
}: {
  organizationId: string;
  query: string;
  limit?: number;
}) {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  return prisma.documentChunk.findMany({
    where: {
      document: {
        organizationId,
        status: "READY"
      },
      OR: terms.map((term) => ({
        content: {
          contains: term,
          mode: "insensitive"
        }
      }))
    },
    include: {
      document: true
    },
    take: limit
  });
}

export function semanticSearchSql() {
  return `
    SELECT c.*, 1 - (c.embedding <=> $1::vector) AS similarity
    FROM "DocumentChunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE d."organizationId" = $2 AND d.status = 'READY'
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3;
  `;
}
