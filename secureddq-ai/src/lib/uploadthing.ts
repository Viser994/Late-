import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const uploadRouter = {
  documentUploader: f({
    "application/pdf": { maxFileSize: "32MB", maxFileCount: 4 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 4,
    },
    "text/plain": { maxFileSize: "8MB", maxFileCount: 4 },
    "text/csv": { maxFileSize: "8MB", maxFileCount: 4 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new Error("Unauthorized");
      }
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        key: file.key,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
