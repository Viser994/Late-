"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { chunkText, extractTextFromUpload } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

const uploadSchema = z.object({
  organizationId: z.string(),
  storageKey: z.string(),
  tags: z.array(z.string()).default([])
});

export async function createDocumentFromUpload(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Expected a document file upload.");
  }

  const input = uploadSchema.parse({
    organizationId: formData.get("organizationId"),
    storageKey: formData.get("storageKey") ?? file.name,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  });

  const extracted = await extractTextFromUpload(file);
  const chunks = chunkText(extracted.text);

  const document = await prisma.document.create({
    data: {
      organizationId: input.organizationId,
      title: extracted.title,
      mimeType: extracted.mimeType,
      storageKey: input.storageKey,
      tags: input.tags,
      status: chunks.length > 0 ? "PROCESSING" : "FAILED",
      chunks: {
        create: chunks.map((chunk) => ({
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          metadata: chunk.metadata as Prisma.InputJsonValue | undefined
        }))
      }
    }
  });

  revalidatePath("/documents");

  return document;
}
