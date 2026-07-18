import { embedText } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/jobs/inngest";

export const processDocument = inngest.createFunction(
  { id: "process-document", triggers: { event: "document/uploaded" } },
  async ({ event, step }) => {
    const documentId = event.data.documentId as string;

    const document = await step.run("load-document", () =>
      prisma.document.findUniqueOrThrow({
        where: { id: documentId },
        include: { chunks: true }
      })
    );

    await step.run("mark-processing", () =>
      prisma.document.update({
        where: { id: document.id },
        data: { status: "PROCESSING" }
      })
    );

    for (const chunk of document.chunks) {
      const embedding = await step.run(`embed-${chunk.id}`, () =>
        embedText(chunk.content)
      );

      await step.run(`store-embedding-${chunk.id}`, () =>
        prisma.$executeRawUnsafe(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          `[${embedding.join(",")}]`,
          chunk.id
        )
      );
    }

    await step.run("mark-ready", () =>
      prisma.document.update({
        where: { id: document.id },
        data: { status: "READY" }
      })
    );

    return { documentId };
  }
);

export const functions = [processDocument];
