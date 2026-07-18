import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { processDocument } from "@/lib/documents/processor";
import { parseQuestionnaireFile } from "@/lib/questionnaires/parser";
import { generateAnswer } from "@/lib/ai/rag";

export async function processPendingJobs(limit = 5): Promise<number> {
  const jobs = await db.backgroundJob.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    await db.backgroundJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 } },
    });

    try {
      const result = await executeJob(job.type, job.payload as Record<string, unknown>);
      await db.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: result ?? undefined,
          completedAt: new Date(),
        },
      });
      processed++;
    } catch (error) {
      const attempts = job.attempts + 1;
      await db.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: attempts >= job.maxAttempts ? "FAILED" : "PENDING",
          error: error instanceof Error ? error.message : "Job failed",
          scheduledAt: new Date(Date.now() + attempts * 60000),
        },
      });
    }
  }

  return processed;
}

async function executeJob(
  type: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  switch (type) {
    case "DOCUMENT_PROCESS":
      await processDocument(payload.documentId as string);
      return { success: true };

    case "QUESTIONNAIRE_PARSE": {
      const count = await parseQuestionnaireFile(
        payload.questionnaireId as string,
        payload.text as string
      );
      return { questionCount: count };
    }

    case "GENERATE_ANSWERS": {
      const questionnaireId = payload.questionnaireId as string;
      const organizationId = payload.organizationId as string;
      const questions = await db.question.findMany({
        where: { questionnaireId },
        include: { answers: true },
      });

      let generated = 0;
      for (const question of questions) {
        if (question.answers.length > 0) continue;

        const answer = await generateAnswer({
          organizationId,
          question: question.text,
        });

        const created = await db.answer.create({
          data: {
            questionId: question.id,
            content: answer.content,
            confidence: answer.confidence,
            isUncertain: answer.isUncertain,
            status: "DRAFT",
          },
        });

        for (const citation of answer.citations) {
          await db.evidence.create({
            data: {
              answerId: created.id,
              documentId: citation.documentId,
              chunkId: citation.chunkId,
              excerpt: citation.excerpt,
              pageNumber: citation.pageNumber ?? undefined,
              relevance: citation.relevance,
            },
          });
        }
        generated++;
      }

      const answeredCount = await db.answer.count({
        where: { question: { questionnaireId } },
      });

      await db.questionnaire.update({
        where: { id: questionnaireId },
        data: { answeredCount },
      });

      return { generated };
    }

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

export async function enqueueJob(params: {
  organizationId: string;
  type: "DOCUMENT_PROCESS" | "QUESTIONNAIRE_PARSE" | "GENERATE_ANSWERS" | "EMBEDDING_BATCH" | "EXPORT";
  payload: Record<string, unknown>;
}) {
  return db.backgroundJob.create({
    data: {
      organizationId: params.organizationId,
      type: params.type,
      payload: params.payload as Prisma.InputJsonValue,
    },
  });
}
