/**
 * Answerly — production reference server
 * ---------------------------------------
 * Answers missed business calls with a natural AI voice agent.
 *
 * Flow:
 *   1. Your phone carrier forwards unanswered/after-hours calls to your
 *      Twilio number.
 *   2. Twilio hits POST /voice. We greet the caller and open a <Gather>
 *      that transcribes their speech.
 *   3. Each caller turn hits POST /respond. We send the running transcript
 *      to the LLM, speak the reply, and gather the next turn.
 *   4. When the call ends, POST /status fires and we text/email the owner a
 *      summary + captured lead details.
 *
 * This is intentionally dependency-light and self-contained so a client can
 * read it end-to-end. Swap <Say> for a premium TTS (ElevenLabs / OpenAI
 * audio) and Gather for Media Streams if you want lower latency.
 */
import "dotenv/config";
import express from "express";
import twilio from "twilio";
import OpenAI from "openai";
import { BUSINESS } from "./business-profile.js";

const {
  PORT = 3000,
  OPENAI_API_KEY,
  OPENAI_MODEL = "gpt-4o-mini",
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  OWNER_PHONE_NUMBER,
  PUBLIC_BASE_URL, // e.g. https://your-domain.com  (used for webhook callbacks)
} = process.env;

const VoiceResponse = twilio.twiml.VoiceResponse;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const smsClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* -------------------------------------------------------------
 * In-memory conversation store. For production use Redis / a DB
 * so state survives restarts and scales across instances.
 * ----------------------------------------------------------- */
const calls = new Map(); // CallSid -> { messages, from, startedAt }

function systemPrompt() {
  return [
    `You are ${BUSINESS.agentName}, the friendly, professional AI voice receptionist for ${BUSINESS.name} (${BUSINESS.type}).`,
    `You are answering because a customer called and the business could not pick up.`,
    ``,
    `Knowledge you can rely on:`,
    `- Hours: ${BUSINESS.hours}`,
    `- Location: ${BUSINESS.location}`,
    `- Services & pricing: ${BUSINESS.services}`,
    `- Booking: ${BUSINESS.booking}`,
    ``,
    `Rules:`,
    `- Keep replies short and conversational — this is a phone call, usually 1-3 sentences.`,
    `- Sound warm and human. Never say you are a large language model.`,
    `- Always try to (a) answer the caller's question and (b) capture their name and a callback number so the team can follow up.`,
    `- If the caller wants to book, collect the preferred day/time, their name, and callback number.`,
    `- If it's an emergency, reassure them and say you'll flag it as urgent for an immediate callback.`,
    `- When you have what you need, confirm the details back and thank them warmly.`,
  ].join("\n");
}

async function think(callState) {
  // Fallback if no OpenAI key configured (keeps the demo runnable).
  if (!openai) {
    const lastUser = [...callState.messages].reverse().find((m) => m.role === "user");
    return (
      `Thanks for calling ${BUSINESS.name}. ` +
      (lastUser ? `I've noted: "${lastUser.content}". ` : "") +
      `Can I get your name and the best number to reach you so someone can follow up right away?`
    );
  }
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.6,
    max_tokens: 160,
    messages: [{ role: "system", content: systemPrompt() }, ...callState.messages],
  });
  return completion.choices[0]?.message?.content?.trim() || "Sorry, could you say that again?";
}

function gatherInto(twiml, action) {
  return twiml.gather({
    input: "speech",
    action,
    method: "POST",
    speechTimeout: "auto",
    speechModel: "phone_call",
    language: "en-US",
  });
}

/* ---------------- Incoming call ---------------- */
app.post("/voice", async (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.From;
  calls.set(callSid, { messages: [], from, startedAt: Date.now() });

  const greeting =
    `${BUSINESS.greeting} This is ${BUSINESS.agentName}, the virtual assistant for ${BUSINESS.name}. How can I help you today?`;
  calls.get(callSid).messages.push({ role: "assistant", content: greeting });

  const twiml = new VoiceResponse();
  const gather = gatherInto(twiml, "/respond");
  gather.say({ voice: BUSINESS.ttsVoice }, greeting);
  // If the caller says nothing, try once more then take a message path.
  twiml.redirect("/respond?silent=1");

  res.type("text/xml").send(twiml.toString());
});

/* ---------------- Each caller turn ---------------- */
app.post("/respond", async (req, res) => {
  const callSid = req.body.CallSid;
  const state = calls.get(callSid) || { messages: [] };
  const speech = (req.body.SpeechResult || "").trim();
  const twiml = new VoiceResponse();

  if (!speech) {
    const nudge = "Sorry, I didn't catch that. Could you tell me how I can help?";
    const gather = gatherInto(twiml, "/respond");
    gather.say({ voice: BUSINESS.ttsVoice }, nudge);
    twiml.say({ voice: BUSINESS.ttsVoice }, "I'll have someone call you back. Thanks for calling!");
    twiml.hangup();
    return res.type("text/xml").send(twiml.toString());
  }

  state.messages.push({ role: "user", content: speech });

  let reply;
  try {
    reply = await think(state);
  } catch (err) {
    console.error("LLM error:", err.message);
    reply = "Thanks for that. Let me take your name and number so someone can call you right back.";
  }
  state.messages.push({ role: "assistant", content: reply });
  calls.set(callSid, state);

  const gather = gatherInto(twiml, "/respond");
  gather.say({ voice: BUSINESS.ttsVoice }, reply);
  // If they go quiet after a reply, close politely.
  twiml.say({ voice: BUSINESS.ttsVoice }, "Thanks so much for calling. Someone will be in touch shortly. Goodbye!");
  twiml.hangup();

  res.type("text/xml").send(twiml.toString());
});

/* ---------------- Call ended -> notify owner ---------------- */
app.post("/status", async (req, res) => {
  const callSid = req.body.CallSid;
  const status = req.body.CallStatus;
  if (["completed", "no-answer", "busy", "failed", "canceled"].includes(status)) {
    const state = calls.get(callSid);
    if (state) {
      await notifyOwner(state).catch((e) => console.error("notify error:", e.message));
      calls.delete(callSid);
    }
  }
  res.sendStatus(200);
});

async function notifyOwner(state) {
  const transcript = state.messages
    .map((m) => `${m.role === "assistant" ? BUSINESS.agentName : "Caller"}: ${m.content}`)
    .join("\n");

  const summary =
    `New call handled by Answerly for ${BUSINESS.name}\n` +
    `From: ${state.from || "unknown"}\n\n` +
    `${transcript}`;

  console.log("\n==== CALL SUMMARY ====\n" + summary + "\n======================\n");

  if (smsClient && OWNER_PHONE_NUMBER && TWILIO_PHONE_NUMBER) {
    await smsClient.messages.create({
      to: OWNER_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
      body: summary.slice(0, 1500),
    });
  }
}

app.get("/", (_req, res) =>
  res.send("Answerly voice agent server is running. Point your Twilio number's Voice webhook to POST /voice.")
);

app.listen(PORT, () => {
  console.log(`Answerly server listening on port ${PORT}`);
  if (!openai) console.log("⚠  OPENAI_API_KEY not set — using scripted fallback replies.");
  if (!smsClient) console.log("⚠  Twilio credentials not set — owner SMS disabled (summaries log to console).");
  if (PUBLIC_BASE_URL) console.log(`   Set your Twilio Voice webhook to: ${PUBLIC_BASE_URL}/voice`);
});
