"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const questionnaireSchema = z.object({
  organizationId: z.string(),
  projectId: z.string().optional(),
  name: z.string().min(2),
  sourceType: z.string().default("manual"),
  questions: z.array(
    z.object({
      prompt: z.string().min(3),
      section: z.string().optional(),
      fieldType: z.string().default("long_text"),
      required: z.boolean().default(false)
    })
  )
});

export async function createQuestionnaire(input: z.input<typeof questionnaireSchema>) {
  const parsed = questionnaireSchema.parse(input);

  const questionnaire = await prisma.questionnaire.create({
    data: {
      organizationId: parsed.organizationId,
      projectId: parsed.projectId,
      name: parsed.name,
      sourceType: parsed.sourceType,
      questions: {
        create: parsed.questions.map((question, order) => ({
          ...question,
          order
        }))
      }
    },
    include: { questions: true }
  });

  revalidatePath("/questionnaires");

  return questionnaire;
}
