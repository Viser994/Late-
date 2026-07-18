import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs/processor";

const f = createUploadthing();

async function getOrgContext(input: { organizationId: string }) {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new UploadThingError("User not found");

  const membership = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: user.id,
      },
    },
  });

  if (!membership) throw new UploadThingError("Forbidden");

  return { user, organizationId: input.organizationId };
}

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    blob: { maxFileSize: "32MB", maxFileCount: 5 },
    text: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 5,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "32MB",
      maxFileCount: 5,
    },
  })
    .input(z.object({ organizationId: z.string() }))
    .middleware(async ({ input }) => {
      const ctx = await getOrgContext(input);
      return ctx;
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const document = await db.document.create({
        data: {
          organizationId: metadata.organizationId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          status: "PENDING",
        },
      });

      await enqueueJob({
        organizationId: metadata.organizationId,
        type: "DOCUMENT_PROCESS",
        payload: { documentId: document.id },
      });

      await db.activityLog.create({
        data: {
          organizationId: metadata.organizationId,
          userId: metadata.user.id,
          action: "document.uploaded",
          description: `Uploaded document "${document.name}"`,
          metadata: { documentId: document.id },
        },
      });

      return { documentId: document.id };
    }),

  questionnaireUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({ organizationId: z.string() }))
    .middleware(async ({ input }) => {
      const ctx = await getOrgContext(input);
      return ctx;
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const questionnaire = await db.questionnaire.create({
        data: {
          organizationId: metadata.organizationId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileUrl: file.ufsUrl,
          status: "DRAFT",
        },
      });

      await db.activityLog.create({
        data: {
          organizationId: metadata.organizationId,
          userId: metadata.user.id,
          action: "questionnaire.uploaded",
          description: `Uploaded questionnaire "${questionnaire.title}"`,
          metadata: { questionnaireId: questionnaire.id },
        },
      });

      return { questionnaireId: questionnaire.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
