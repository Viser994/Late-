import { logger, task } from "@trigger.dev/sdk";
import { db } from "@/lib/db";
import { getEmbedding } from "@/lib/ai/embeddings";
import { splitIntoChunks } from "@/lib/documents/parse";

export const indexDocumentTask = task({
  id: "index-document",
  run: async (payload: { documentId: string; extractedText: string }) => {
    const chunks = splitIntoChunks(payload.extractedText);
    logger.info("Indexing document", { documentId: payload.documentId, chunks: chunks.length });

    for (const [index, content] of chunks.entries()) {
      const embedding = await getEmbedding(content);
      await db.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" ("id","documentId","chunkIndex","content","tokenCount","embedding","createdAt","updatedAt")
         VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5::vector,NOW(),NOW())
         ON CONFLICT ("documentId","chunkIndex")
         DO UPDATE SET "content" = EXCLUDED."content","tokenCount" = EXCLUDED."tokenCount","embedding" = EXCLUDED."embedding","updatedAt" = NOW()`,
        payload.documentId,
        index,
        content,
        Math.ceil(content.length / 4),
        `[${embedding.join(",")}]`,
      );
    }

    await db.document.update({
      where: { id: payload.documentId },
      data: { status: "ACTIVE" },
    });

    logger.info("Document indexing complete", { documentId: payload.documentId });
  },
});
