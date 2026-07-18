import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieveRelevantChunks } from "@/lib/ai/rag";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const [chunks, documents, questionnaires, answers] = await Promise.all([
      retrieveRelevantChunks(ctx.organizationId, q, 5),
      db.document.findMany({
        where: {
          organizationId: ctx.organizationId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      db.questionnaire.findMany({
        where: {
          organizationId: ctx.organizationId,
          title: { contains: q, mode: "insensitive" },
        },
        take: 5,
      }),
      db.answer.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
          question: { questionnaire: { organizationId: ctx.organizationId } },
        },
        take: 5,
        include: { question: { select: { text: true, questionnaireId: true } } },
      }),
    ]);

    const results = [
      ...chunks.map((c) => ({
        type: "document",
        id: c.documentId,
        title: c.documentName,
        excerpt: c.content.slice(0, 200),
        url: `/dashboard/documents/${c.documentId}`,
        score: c.score,
      })),
      ...documents.map((d) => ({
        type: "document",
        id: d.id,
        title: d.name,
        excerpt: d.description ?? d.fileName,
        url: `/dashboard/documents/${d.id}`,
      })),
      ...questionnaires.map((qn) => ({
        type: "questionnaire",
        id: qn.id,
        title: qn.title,
        excerpt: qn.description ?? `${qn.totalQuestions} questions`,
        url: `/dashboard/questionnaires/${qn.id}`,
      })),
      ...answers.map((a) => ({
        type: "answer",
        id: a.id,
        title: a.question.text.slice(0, 80),
        excerpt: a.content.slice(0, 200),
        url: `/dashboard/questionnaires/${a.question.questionnaireId}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
