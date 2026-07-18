"use server";

import { answerChat, type ChatAnswer } from "@/lib/ai/chat";
import { retrieveRelevant } from "@/lib/ai/retrieval";
import { getDemoCorpus } from "@/lib/ai/demo-corpus";

/**
 * Answer a knowledge-base question with retrieval-augmented generation.
 * Retrieval runs over the org corpus (demo corpus when no DB is connected) and
 * generation is grounded in the retrieved passages with citations.
 */
export async function askKnowledgeBase(question: string): Promise<ChatAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { content: "Please enter a question.", citations: [] };
  }
  const corpus = getDemoCorpus();
  const retrieved = await retrieveRelevant(trimmed, corpus, 4);
  return answerChat(trimmed, retrieved);
}
