import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatWithKnowledgeBase } from "@/lib/ai/rag";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const { message, sessionId, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    let session = sessionId
      ? await db.chatSession.findFirst({
          where: { id: sessionId, organizationId: ctx.organizationId },
        })
      : null;

    if (!session) {
      session = await db.chatSession.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.user.id,
          title: message.slice(0, 100),
        },
      });
    }

    await db.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    const response = await chatWithKnowledgeBase({
      organizationId: ctx.organizationId,
      message,
      history,
    });

    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response.content,
        citations: response.citations,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      content: response.content,
      citations: response.citations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
