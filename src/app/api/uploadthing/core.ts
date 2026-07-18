import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  evidenceDocument: f({
    pdf: { maxFileSize: "64MB", maxFileCount: 10 },
    text: { maxFileSize: "16MB", maxFileCount: 10 },
    blob: { maxFileSize: "64MB", maxFileCount: 10 }
  })
    .middleware(async () => ({
      uploadedBy: "system",
      organizationId: "demo"
    }))
    .onUploadComplete(async ({ file, metadata }) => ({
      storageKey: file.key,
      fileName: file.name,
      uploadedBy: metadata.uploadedBy,
      organizationId: metadata.organizationId
    }))
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
