import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { DocumentType } from "@prisma/client";

const f = createUploadthing();

function getMimeTypeCategory(mimeType: string): DocumentType {
  if (mimeType.includes("pdf")) return "PDF";
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword")
  )
    return "DOCX";
  if (
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("ms-excel")
  )
    return "XLSX";
  if (mimeType.includes("csv")) return "CSV";
  if (mimeType.includes("markdown") || mimeType.includes("md"))
    return "MARKDOWN";
  if (mimeType.includes("text")) return "TXT";
  return "OTHER";
}

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 10,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "32MB",
      maxFileCount: 10,
    },
    "text/csv": { maxFileSize: "16MB", maxFileCount: 10 },
    "text/plain": { maxFileSize: "16MB", maxFileCount: 10 },
    "text/markdown": { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      const url = new URL(req.url);
      const organizationId = url.searchParams.get("organizationId");
      if (!organizationId) throw new Error("Organization ID required");

      return { userId, organizationId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const doc = await prisma.document.create({
        data: {
          organizationId: metadata.organizationId,
          name: file.name,
          originalName: file.name,
          fileUrl: file.ufsUrl,
          fileKey: file.key,
          fileSize: file.size,
          mimeType: file.type,
          type: getMimeTypeCategory(file.type),
          status: "UPLOADING",
        },
      });

      return { documentId: doc.id };
    }),

  questionnaireUploader: f({
    pdf: { maxFileSize: "32MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "32MB",
    },
    "text/csv": { maxFileSize: "16MB" },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      const url = new URL(req.url);
      const organizationId = url.searchParams.get("organizationId");
      if (!organizationId) throw new Error("Organization ID required");

      return { userId, organizationId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        fileUrl: file.ufsUrl,
        fileKey: file.key,
        fileName: file.name,
        organizationId: metadata.organizationId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
