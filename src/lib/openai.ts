import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

export async function generateAnswer({
  question,
  context,
  style = "professional",
}: {
  question: string;
  context: string;
  style?: string;
}): Promise<{ answer: string; confidence: number }> {
  const systemPrompt = `You are a cybersecurity expert helping to answer security questionnaires and vendor assessments. 
Your task is to provide accurate, ${style} answers based ONLY on the provided context documents.

Rules:
1. Only use information from the provided context
2. If the context doesn't contain enough information to answer confidently, say so
3. Be specific and cite relevant details from the context
4. Use ${style} language appropriate for enterprise security assessments
5. Do not fabricate or hallucinate information
6. If you cannot answer from the context, indicate what additional information would be needed

Format your response as JSON with fields:
- answer: the actual answer text
- confidence: a number between 0 and 1 indicating your confidence
- caveats: any important caveats or missing information`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Context Documents:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  return {
    answer: parsed.answer,
    confidence: parsed.confidence ?? 0.7,
  };
}

export async function chatWithKnowledgeBase({
  message,
  context,
  history,
}: {
  message: string;
  context: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const systemPrompt = `You are a cybersecurity knowledge assistant for an enterprise organization.
Answer questions based ONLY on the provided security documentation context.
Always cite specific documents or sections when relevant.
If information is not available in the context, clearly say so.
Be concise but thorough.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Context:\n${context}` },
    ...(history ?? []),
    { role: "user", content: message },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.3,
  });

  return response.choices[0].message.content ?? "";
}
