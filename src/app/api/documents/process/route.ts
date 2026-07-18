import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { indexDocument } from "@/lib/rag";
import { z } from "zod";

const requestSchema = z.object({
  documentId: z.string(),
  organizationId: z.string(),
  text: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, organizationId, text } = requestSchema.parse(body);

    // Verify access
    const member = await prisma.organizationMember.findFirst({
      where: {
        organization: { id: organizationId },
        user: { clerkId: userId },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify document belongs to org
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Update status
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    // Index document (async in production - here we do it synchronously)
    await indexDocument(documentId, text);

    // Update status to ready
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        processedAt: new Date(),
        wordCount: text.split(/\s+/).length,
      },
    });

    const chunkCount = await prisma.documentChunk.count({
      where: { documentId },
    });

    return NextResponse.json({ success: true, chunks: chunkCount });
  } catch (error) {
    console.error("Document processing error:", error);

    // Mark as failed
    const body = await req.json().catch(() => null);
    if (body?.documentId) {
      await prisma.document.update({
        where: { id: body.documentId },
        data: { status: "FAILED", errorMessage: String(error) },
      }).catch(console.error);
    }

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
