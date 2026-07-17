import express from "express";
import twilio from "twilio";
import { settings } from "./config.js";
import { generateAgentReply } from "./openaiClient.js";

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;
const conversations = new Map();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function getConversation(callSid) {
  if (!conversations.has(callSid)) {
    conversations.set(callSid, []);
  }
  return conversations.get(callSid);
}

function buildGather(response, prompt) {
  const gather = response.gather({
    input: "speech dtmf",
    speechTimeout: "auto",
    action: "/voice/respond",
    method: "POST",
    language: "en-US",
    hints:
      "appointment, booking, order status, support, callback, sales, human representative"
  });
  gather.say(
    {
      voice: "Polly.Joanna",
      language: "en-US"
    },
    prompt
  );
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ai-missed-call-agent" });
});

app.post("/voice/incoming", (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid || "unknown";

  buildGather(
    twiml,
    `Thanks for calling ${settings.BUSINESS_NAME}. I'm the virtual assistant and I can help right away. Please tell me how I can help you today.`
  );

  conversations.set(callSid, []);

  res.type("text/xml").send(twiml.toString());
});

app.post("/voice/respond", async (req, res) => {
  const twiml = new VoiceResponse();
  const callSid = req.body.CallSid || "unknown";
  const speechResult = (req.body.SpeechResult || "").trim();
  const digits = (req.body.Digits || "").trim();

  if (!speechResult && !digits) {
    buildGather(
      twiml,
      "I didn't catch that. Please say your request one more time."
    );
    return res.type("text/xml").send(twiml.toString());
  }

  const callerMessage = speechResult || `DTMF input: ${digits}`;
  const history = getConversation(callSid);

  const turnsSoFar =
    history.filter((msg) => msg.role === "assistant").length + 1;

  if (turnsSoFar > settings.MAX_TURNS_PER_CALL) {
    twiml.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Thank you for calling. I've captured your request, and our team will follow up as soon as possible."
    );
    twiml.hangup();
    conversations.delete(callSid);
    return res.type("text/xml").send(twiml.toString());
  }

  try {
    history.push({ role: "user", content: callerMessage });

    const aiReply = await generateAgentReply({
      callerMessage,
      conversationHistory: history,
      callSid
    });

    history.push({ role: "assistant", content: aiReply.spokenText });
    conversations.set(callSid, history);

    twiml.say(
      { voice: "Polly.Joanna", language: "en-US" },
      aiReply.spokenText
    );

    if (aiReply.shouldEscalate && settings.FALLBACK_FORWARD_NUMBER) {
      twiml.say(
        { voice: "Polly.Joanna", language: "en-US" },
        "I'll connect you with a team member now."
      );
      twiml.dial(settings.FALLBACK_FORWARD_NUMBER);
      conversations.delete(callSid);
      return res.type("text/xml").send(twiml.toString());
    }

    buildGather(
      twiml,
      "Is there anything else I can help you with today?"
    );
    return res.type("text/xml").send(twiml.toString());
  } catch (error) {
    twiml.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "I apologize. I ran into a temporary issue. Please leave a brief message after the tone and our team will call you back."
    );
    twiml.record({
      maxLength: 90,
      playBeep: true,
      transcribe: true,
      transcribeCallback: "/voice/transcription"
    });
    twiml.hangup();
    conversations.delete(callSid);
    return res.type("text/xml").send(twiml.toString());
  }
});

app.post("/voice/transcription", (req, res) => {
  const { CallSid, TranscriptionText } = req.body;
  console.log("Voicemail transcription", {
    callSid: CallSid,
    transcription: TranscriptionText
  });
  res.status(204).send();
});

app.post("/voice/status", (req, res) => {
  const { CallSid, CallStatus } = req.body;
  if (CallStatus && ["completed", "busy", "failed", "no-answer"].includes(CallStatus)) {
    conversations.delete(CallSid);
  }
  res.status(204).send();
});

app.listen(settings.PORT, () => {
  console.log(
    `AI missed-call voice agent listening on http://localhost:${settings.PORT}`
  );
});
