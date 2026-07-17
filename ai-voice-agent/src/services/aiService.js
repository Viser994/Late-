/**
 * AI conversation service powered by OpenAI Chat Completions.
 * Builds a rich system prompt from the business config, manages the per-call
 * message history, and returns the next assistant utterance.
 */

const OpenAI = require("openai");
const config = require("../config/business");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── System prompt factory ────────────────────────────────────────────────────

function buildSystemPrompt() {
  const parts = [
    `You are ${config.agentName}, a professional AI voice assistant for ${config.businessName}.`,
    `You are answering a phone call on behalf of the business because no human agent is currently available.`,
    ``,
    `## Your personality`,
    `- Warm, professional, and concise – this is a phone call, so keep responses SHORT (1-3 sentences max).`,
    `- Never say you are an AI unless the caller directly asks. If asked, be honest.`,
    `- Speak naturally, as you would on a real phone call.`,
    `- Do NOT use markdown, bullet points, or special characters in your speech.`,
    ``,
    `## Business information`,
    `- Business name: ${config.businessName}`,
    config.businessPhone ? `- Phone: ${config.businessPhone}` : "",
    config.businessEmail ? `- Email: ${config.businessEmail}` : "",
    config.businessWebsite ? `- Website: ${config.businessWebsite}` : "",
    `- Business hours: ${config.businessHours}`,
    config.services ? `- Services offered: ${config.services}` : "",
    config.additionalContext ? `- Additional context: ${config.additionalContext}` : "",
    ``,
    `## Your goals (in priority order)`,
    `1. Greet the caller and understand why they are calling.`,
    `2. Answer common questions about the business using the information above.`,
    `3. If the caller wants to leave a message or schedule a callback, collect their name and best phone number.`,
    `4. If you cannot help, offer to have someone call them back and collect their contact info.`,
    `5. If the caller seems urgent or distressed, offer to transfer them.`,
    ``,
    `## Rules`,
    `- Never make up information that is not in the business context above.`,
    `- Never promise specific prices, timelines, or outcomes unless stated above.`,
    `- If you do not know the answer, say so and offer a callback.`,
    `- Keep your replies under 40 words whenever possible.`,
    `- End the call politely when the caller is satisfied or after collecting their info.`,
  ]
    .filter(Boolean)
    .join("\n");

  return parts;
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate the next assistant reply given the current session.
 * @param {object} session  – session object from sessionManager
 * @param {string} userSpeech – what the caller just said (empty string on first turn)
 * @returns {Promise<{reply: string, shouldEnd: boolean, leadInfo: object|null}>}
 */
async function getNextReply(session, userSpeech) {
  // Append caller's message to history (skip on first turn where it's empty)
  if (userSpeech && userSpeech.trim()) {
    session.messages.push({ role: "user", content: userSpeech.trim() });
  }

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...session.messages,
  ];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    max_tokens: 150,
    temperature: 0.4,
  });

  const reply = response.choices[0].message.content.trim();

  // Save assistant reply to history
  session.messages.push({ role: "assistant", content: reply });
  session.turns += 1;

  // ── Detect if we should end the call ──────────────────────────────────────
  const endPhrases = [
    "goodbye",
    "bye",
    "have a great day",
    "take care",
    "talk soon",
    "we will call you back",
    "someone will reach out",
  ];
  const replyLower = reply.toLowerCase();
  const shouldEnd =
    session.turns >= config.maxTurns ||
    endPhrases.some((p) => replyLower.includes(p));

  // ── Extract lead info if present ──────────────────────────────────────────
  let leadInfo = null;
  if (!session.leadCaptured) {
    leadInfo = await tryExtractLead(session.messages);
    if (leadInfo) session.leadCaptured = true;
  }

  return { reply, shouldEnd, leadInfo };
}

/**
 * Ask the model to extract caller contact info from the conversation.
 * Returns null if not enough info yet.
 */
async function tryExtractLead(messages) {
  const extractionPrompt = [
    {
      role: "system",
      content:
        "You are a data extractor. Given a phone call transcript, extract the caller's name and phone number if they have been clearly provided. " +
        'Reply with a JSON object: {"name": "...", "phone": "..."} or {"name": null, "phone": null} if not found. No explanation, just JSON.',
    },
    {
      role: "user",
      content: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
    },
  ];

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: extractionPrompt,
      max_tokens: 60,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(res.choices[0].message.content);
    if (data.name || data.phone) return data;
  } catch {
    // Extraction is best-effort; ignore failures
  }
  return null;
}

/**
 * Generate a short post-call summary for the dashboard.
 */
async function generateSummary(session) {
  if (!session.messages.length) return "No conversation recorded.";

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following phone call in 2-3 sentences for a business owner's dashboard. Be factual and concise.",
        },
        {
          role: "user",
          content: session.messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        },
      ],
      max_tokens: 120,
      temperature: 0.3,
    });
    return res.choices[0].message.content.trim();
  } catch {
    return "Summary unavailable.";
  }
}

module.exports = { getNextReply, generateSummary };
