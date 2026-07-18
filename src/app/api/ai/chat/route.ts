import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { searchSimilarChunks, generateQuestionAnswer } from "@/lib/rag";
import { chatWithKnowledgeBase } from "@/lib/openai";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, organizationId, history } = requestSchema.parse(body);

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

    // Search for relevant chunks
    const chunks = await searchSimilarChunks(organizationId, message, 6);

    if (chunks.length === 0) {
      return NextResponse.json({
        response:
          "I couldn't find relevant documentation to answer your question. Please upload relevant security documents to your knowledge base first.",
        sources: [],
      });
    }

    const context = chunks
      .map((c) => `[${c.documentName}]\n${c.content}`)
      .join("\n\n---\n\n");

    const response = await chatWithKnowledgeBase({
      message,
      context,
      history,
    });

    const sources = chunks
      .filter((c, i, arr) => arr.findIndex((x) => x.documentId === c.documentId) === i)
      .map((c) => ({
        documentId: c.documentId,
        documentName: c.documentName,
        excerpt: c.content.substring(0, 200),
      }));

    return NextResponse.json({ response, sources });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
