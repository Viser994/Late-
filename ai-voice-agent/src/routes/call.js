/**
 * Twilio voice webhook routes.
 *
 * Flow:
 *  POST /call/incoming  – Twilio calls this when a new call arrives
 *  POST /call/gather    – Twilio calls this with the caller's speech input
 *  POST /call/status    – Twilio calls this when a call ends (status callback)
 */

const express = require("express");
const twilio = require("twilio");
const { VoiceResponse } = twilio.twiml;

const sessionManager = require("../services/sessionManager");
const { getNextReply, generateSummary } = require("../services/aiService");
const { saveLead } = require("../services/leadService");
const config = require("../config/business");

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a TwiML response that speaks `text` then either ends the call or
 * returns to /call/gather to collect the caller's next utterance.
 */
function buildTwiml(text, { end = false, callSid = "" } = {}) {
  const twiml = new VoiceResponse();

  if (end) {
    twiml.say({ voice: config.agentVoice, language: config.language }, text);
    twiml.hangup();
    return twiml.toString();
  }

  const gather = twiml.gather({
    input: "speech",
    action: `/call/gather?sid=${encodeURIComponent(callSid)}`,
    method: "POST",
    speechTimeout: config.speechTimeout,
    speechModel: config.speechModel,
    language: config.language,
    enhanced: "true",
  });

  gather.say({ voice: config.agentVoice, language: config.language }, text);

  // If no speech detected, loop back
  twiml.redirect({ method: "POST" }, `/call/gather?sid=${encodeURIComponent(callSid)}&noSpeech=1`);

  return twiml.toString();
}

/**
 * Return a TwiML that transfers the call to the escalation number.
 */
function buildEscalationTwiml() {
  const twiml = new VoiceResponse();
  twiml.say(
    { voice: config.agentVoice, language: config.language },
    config.escalationMessage
  );
  twiml.dial(config.escalationPhone);
  return twiml.toString();
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /call/incoming
 * Called by Twilio when a new inbound call arrives.
 */
router.post("/incoming", async (req, res) => {
  const { CallSid, From, To } = req.body;

  console.log(`[Call] Incoming – SID: ${CallSid} | From: ${From} | To: ${To}`);

  const session = sessionManager.getOrCreate(CallSid, { caller: From, to: To });

  try {
    // First turn: just speak the greeting and ask what brought them in
    const openingLine = config.greeting +
      " I'm " + config.agentName + ". How can I help you today?";

    session.messages.push({ role: "assistant", content: openingLine });

    const twiml = buildTwiml(openingLine, { callSid: CallSid });
    res.type("text/xml").send(twiml);
  } catch (err) {
    console.error("[Call/incoming] Error:", err);
    const twiml = new VoiceResponse();
    twiml.say(
      { voice: config.agentVoice },
      "We're sorry, we're experiencing technical difficulties. Please call back later."
    );
    twiml.hangup();
    res.type("text/xml").send(twiml.toString());
  }
});

/**
 * POST /call/gather
 * Called by Twilio after collecting speech from the caller.
 */
router.post("/gather", async (req, res) => {
  const { SpeechResult, CallSid, From, Confidence } = req.body;
  const { sid, noSpeech } = req.query;

  // sid from query is the canonical CallSid when Twilio doesn't include it in body
  const callSid = CallSid || sid;
  const session = sessionManager.getOrCreate(callSid, { caller: From });

  console.log(
    `[Call] Gather – SID: ${callSid} | Speech: "${SpeechResult || "(none)"}" | Confidence: ${Confidence || "n/a"}`
  );

  // Handle silence / no speech detected
  if (noSpeech === "1" || !SpeechResult) {
    const silenceCount = (session.silenceCount || 0) + 1;
    session.silenceCount = silenceCount;

    if (silenceCount >= 3) {
      const twiml = buildTwiml(
        "I didn't catch that. We'll have someone call you back shortly. Goodbye!",
        { end: true }
      );
      return res.type("text/xml").send(twiml);
    }

    const prompt = silenceCount === 1
      ? "I'm sorry, I didn't catch that. Could you please repeat what you said?"
      : "I'm still having trouble hearing you. Could you speak a little louder?";

    return res.type("text/xml").send(buildTwiml(prompt, { callSid }));
  }

  // Reset silence counter on successful speech
  session.silenceCount = 0;

  try {
    // Check for escalation keywords
    const speechLower = SpeechResult.toLowerCase();
    const escalationWords = ["speak to a human", "talk to someone", "real person", "transfer", "emergency"];
    if (config.escalationPhone && escalationWords.some((w) => speechLower.includes(w))) {
      session.escalated = true;
      return res.type("text/xml").send(buildEscalationTwiml());
    }

    // Get AI response
    const { reply, shouldEnd, leadInfo } = await getNextReply(session, SpeechResult);

    // Capture lead if extracted
    if (leadInfo && config.captureLeads) {
      await saveLead({
        name: leadInfo.name,
        phone: leadInfo.phone,
        callSid,
        callerPhone: session.callerPhone,
        summary: null, // will be added on call end
      });
    }

    const twiml = buildTwiml(reply, { end: shouldEnd, callSid });
    res.type("text/xml").send(twiml);
  } catch (err) {
    console.error("[Call/gather] Error:", err);
    const twiml = buildTwiml(
      "I'm sorry, I ran into a problem. Please try calling back or we'll reach out to you soon.",
      { end: true }
    );
    res.type("text/xml").send(twiml);
  }
});

/**
 * POST /call/status
 * Twilio status callback — fired when a call ends.
 */
router.post("/status", async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  console.log(`[Call] Status update – SID: ${CallSid} | Status: ${CallStatus} | Duration: ${CallDuration}s`);

  const session = sessionManager.get(CallSid);
  if (session && session.messages.length > 0) {
    try {
      const summary = await generateSummary(session);
      sessionManager.update(CallSid, { summary, endedAt: new Date().toISOString(), duration: CallDuration });
      console.log(`[Call] Summary – SID: ${CallSid}: ${summary}`);
    } catch (err) {
      console.error("[Call/status] Summary error:", err.message);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
