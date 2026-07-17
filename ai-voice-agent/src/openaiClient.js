import OpenAI from "openai";
import { settings } from "./config.js";

const client = new OpenAI({
  apiKey: settings.OPENAI_API_KEY
});

function sanitizeForVoice(text) {
  return text
    .replace(/[#*_`>-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 450);
}

export async function generateAgentReply({
  callerMessage,
  conversationHistory,
  callSid
}) {
  const systemPrompt = `
You are an elite front-desk voice agent for ${settings.BUSINESS_NAME}.

Business context:
- Description: ${settings.BUSINESS_DESCRIPTION}
- Hours: ${settings.BUSINESS_HOURS}

Your objectives:
1) Sound warm, concise, and highly professional on voice calls.
2) Help the caller quickly and gather useful details.
3) If the caller asks for a human, urgently needs support, or sounds frustrated, include "ESCALATE_TO_HUMAN" at the end of your response.
4) Keep each response under 80 spoken words.
5) Do not invent pricing, policy, or commitments.
6) Ask one focused follow-up question when needed.
`.trim();

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((item) => ({
      role: item.role,
      content: item.content
    })),
    { role: "user", content: callerMessage }
  ];

  const response = await client.chat.completions.create({
    model: settings.OPENAI_MODEL,
    messages,
    temperature: 0.4
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return {
      spokenText:
        "Thanks for your call. I can help take your details and have our team follow up shortly.",
      shouldEscalate: false
    };
  }

  const shouldEscalate = content.includes("ESCALATE_TO_HUMAN");
  const spokenText = sanitizeForVoice(
    content.replace("ESCALATE_TO_HUMAN", "").trim()
  );

  return {
    spokenText:
      spokenText ||
      "I can absolutely help and make sure the team receives your message.",
    shouldEscalate,
    debug: {
      callSid,
      model: settings.OPENAI_MODEL
    }
  };
}
