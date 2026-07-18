import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionAnswer } from "@/lib/rag";
import { z } from "zod";

const requestSchema = z.object({
  questionId: z.string(),
  organizationId: z.string(),
  style: z.string().optional().default("professional"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { questionId, organizationId, style } = requestSchema.parse(body);

    // Verify user has access to organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organization: { id: organizationId },
        user: { clerkId: userId },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { questionnaire: true },
    });

    if (!question || question.questionnaire.organizationId !== organizationId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Generate answer using RAG
    const { answer, confidence, sources } = await generateQuestionAnswer(
      organizationId,
      question.text,
      style
    );

    // Save answer to database
    const existingAnswer = await prisma.answer.findFirst({
      where: { questionId },
    });

    let savedAnswer;
    if (existingAnswer) {
      // Create version
      await prisma.answerVersion.create({
        data: {
          answerId: existingAnswer.id,
          content: existingAnswer.content,
          version: existingAnswer.content.length,
        },
      });

      savedAnswer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          content: answer,
          status: "AI_GENERATED",
          confidenceScore: confidence,
          isAiGenerated: true,
          aiModel: "gpt-4o",
        },
      });
    } else {
      savedAnswer = await prisma.answer.create({
        data: {
          questionId,
          content: answer,
          status: "AI_GENERATED",
          confidenceScore: confidence,
          isAiGenerated: true,
          aiModel: "gpt-4o",
        },
      });
    }

    // Save evidence
    if (sources.length > 0) {
      await prisma.evidence.deleteMany({ where: { answerId: savedAnswer.id } });
      await prisma.evidence.createMany({
        data: sources.map((s) => ({
          answerId: savedAnswer.id,
          questionId,
          documentId: s.documentId,
          excerpt: s.excerpt,
          relevanceScore: confidence,
        })),
      });
    }

    return NextResponse.json({
      answerId: savedAnswer.id,
      answer,
      confidence,
      sources,
    });
  } catch (error) {
    console.error("Error generating answer:", error);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
