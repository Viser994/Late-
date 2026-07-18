import { AI_CONFIG } from "./config";
import { getOpenAI } from "./openai";
import type { RetrievedChunk } from "./retrieval";

export interface ChatAnswer {
  content: string;
  citations: { documentTitle: string; quote: string }[];
}

const CHAT_SYSTEM = `You are the SecureDDQ AI assistant. Answer questions about the organization's
security posture using ONLY the provided document excerpts. Always ground claims in the
excerpts and cite the document titles. If the excerpts do not answer the question, say so
plainly rather than guessing.`;

/**
 * Answer a chat question with retrieval-augmented generation. Falls back to a
 * grounded synthesis of retrieved chunks when OpenAI is not configured.
 */
export async function answerChat(question: string, retrieved: RetrievedChunk[]): Promise<ChatAnswer> {
  const citations = retrieved
    .filter((r) => r.score > 0)
    .slice(0, 3)
    .map((r) => ({ documentTitle: r.documentTitle, quote: excerpt(r.content) }));

  const client = getOpenAI();
  if (client && retrieved.length > 0) {
    const context = retrieved.map((r, i) => `[${i + 1}] (${r.documentTitle})\n${r.content}`).join("\n\n");
    const completion = await client.chat.completions.create({
      model: AI_CONFIG.chatModel,
      temperature: 0.3,
      messages: [
        { role: "system", content: CHAT_SYSTEM },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    });
    return { content: completion.choices[0]?.message?.content?.trim() ?? "", citations };
  }

  if (retrieved.length === 0) {
    return {
      content:
        "I couldn't find anything in the knowledge base that answers that. Try uploading the relevant document, or rephrase your question.",
      citations: [],
    };
  }
  return {
    content: `Here's what our documentation says: ${retrieved
      .slice(0, 2)
      .map((r) => excerpt(r.content))
      .join(" ")}`,
    citations,
  };
}

function excerpt(text: string): string {
  const sentence = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/)?.[0] ?? text;
  return sentence.trim().slice(0, 220);
}
