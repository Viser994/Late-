import { db } from "@/lib/db";
import type { QuestionType } from "@prisma/client";

export interface ParsedQuestion {
  text: string;
  questionType: QuestionType;
  section?: string;
  options?: string[];
  required: boolean;
  orderIndex: number;
}

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  let currentSection = "General";
  let orderIndex = 0;

  for (const line of lines) {
    if (isSectionHeader(line)) {
      currentSection = line.replace(/^#+\s*/, "").replace(/[:.]$/, "");
      continue;
    }

    const questionMatch = line.match(
      /^(?:Q?\d+[\.\):\-]\s*|(?:\d+[\.\)]\s+))(.+)/i
    );
    if (questionMatch) {
      const text = questionMatch[1].trim();
      questions.push({
        text,
        questionType: detectQuestionType(text),
        section: currentSection,
        required: true,
        orderIndex: orderIndex++,
      });
      continue;
    }

    if (line.endsWith("?") && line.length > 15) {
      questions.push({
        text: line,
        questionType: detectQuestionType(line),
        section: currentSection,
        required: true,
        orderIndex: orderIndex++,
      });
    }
  }

  return questions;
}

function isSectionHeader(line: string): boolean {
  return (
    /^#{1,3}\s/.test(line) ||
    /^[A-Z][A-Z\s&]{3,}$/.test(line) ||
    /^(Section|Category|Domain)\s+\d/i.test(line)
  );
}

function detectQuestionType(text: string): QuestionType {
  const lower = text.toLowerCase();
  if (
    lower.includes("yes or no") ||
    lower.includes("yes/no") ||
    lower.startsWith("do you") ||
    lower.startsWith("does your") ||
    lower.startsWith("is there") ||
    lower.startsWith("are there")
  ) {
    return "YES_NO";
  }
  if (lower.includes("select all") || lower.includes("check all")) {
    return "CHECKBOX";
  }
  if (lower.includes("choose one") || lower.includes("select one")) {
    return "MULTIPLE_CHOICE";
  }
  if (text.length > 200) return "LONG_TEXT";
  return "TEXT";
}

export async function parseQuestionnaireFile(
  questionnaireId: string,
  text: string
): Promise<number> {
  const parsed = parseQuestionsFromText(text);
  const sections = new Map<string, string>();

  for (const q of parsed) {
    const sectionTitle = q.section ?? "General";
    if (!sections.has(sectionTitle)) {
      const section = await db.questionSection.create({
        data: {
          questionnaireId,
          title: sectionTitle,
          orderIndex: sections.size,
        },
      });
      sections.set(sectionTitle, section.id);
    }
  }

  for (const q of parsed) {
    await db.question.create({
      data: {
        questionnaireId,
        sectionId: sections.get(q.section ?? "General"),
        text: q.text,
        questionType: q.questionType,
        options: q.options ?? undefined,
        required: q.required,
        orderIndex: q.orderIndex,
      },
    });
  }

  await db.questionnaire.update({
    where: { id: questionnaireId },
    data: {
      totalQuestions: parsed.length,
      status: "IN_PROGRESS",
    },
  });

  return parsed.length;
}

export async function extractQuestionnaireText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const { extractTextFromBuffer } = await import("@/lib/documents/processor");
  return extractTextFromBuffer(buffer, mimeType);
}
