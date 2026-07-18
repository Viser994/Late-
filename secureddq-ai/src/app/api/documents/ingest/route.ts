import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractTextFromFile, splitIntoChunks } from "@/lib/documents/parse";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const organizationId = String(formData.get("organizationId") ?? "");
  const file = formData.get("file");

  if (!organizationId || !(file instanceof File)) {
    return NextResponse.json({ error: "organizationId and file are required" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractTextFromFile(file.name, bytes);
  const chunks = splitIntoChunks(extractedText);

  const document = await db.document.create({
    data: {
      organizationId,
      title: file.name,
      fileKey: `local:${Date.now()}:${file.name}`,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      status: "ACTIVE",
      extractedText,
      chunks: {
        createMany: {
          data: chunks.map((content, index) => ({
            chunkIndex: index,
            content,
            tokenCount: Math.ceil(content.length / 4),
          })),
        },
      },
    },
    include: { chunks: true },
  });

  return NextResponse.json({
    documentId: document.id,
    chunksCreated: document.chunks.length,
  });
}
