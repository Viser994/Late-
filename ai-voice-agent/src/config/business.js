/**
 * Business configuration loader.
 * Values are read from environment variables so each deployment can be
 * customised without touching code.
 */

const defaultGreeting =
  "Thank you for calling. Our team is currently unavailable, but our AI assistant is here to help you.";

const config = {
  // ── Identity ──────────────────────────────────────────────────────────────
  businessName: process.env.BUSINESS_NAME || "Our Business",
  businessPhone: process.env.BUSINESS_PHONE || "",
  businessEmail: process.env.BUSINESS_EMAIL || "",
  businessWebsite: process.env.BUSINESS_WEBSITE || "",

  // ── Hours ─────────────────────────────────────────────────────────────────
  businessHours: process.env.BUSINESS_HOURS || "Monday–Friday 9 AM – 5 PM",
  timezone: process.env.BUSINESS_TIMEZONE || "America/New_York",

  // ── Personality ───────────────────────────────────────────────────────────
  agentName: process.env.AGENT_NAME || "Aria",
  agentVoice: process.env.AGENT_VOICE || "Polly.Joanna-Neural", // Twilio / Amazon Polly
  greeting: process.env.BUSINESS_GREETING || defaultGreeting,

  // ── Services & context the AI should know about ───────────────────────────
  services: process.env.BUSINESS_SERVICES || "",
  additionalContext: process.env.BUSINESS_CONTEXT || "",

  // ── Call behaviour ────────────────────────────────────────────────────────
  maxTurns: parseInt(process.env.MAX_CONVERSATION_TURNS || "20", 10),
  speechTimeout: process.env.SPEECH_TIMEOUT || "3",       // seconds of silence
  speechModel: process.env.SPEECH_MODEL || "phone_call",  // Twilio STT model
  language: process.env.SPEECH_LANGUAGE || "en-US",

  // ── Lead capture ──────────────────────────────────────────────────────────
  captureLeads: process.env.CAPTURE_LEADS !== "false",
  leadWebhook: process.env.LEAD_WEBHOOK_URL || "",

  // ── Escalation ────────────────────────────────────────────────────────────
  escalationPhone: process.env.ESCALATION_PHONE || "",   // forward to human
  escalationMessage: process.env.ESCALATION_MESSAGE ||
    "Let me connect you with someone who can assist you further.",
};

module.exports = config;
