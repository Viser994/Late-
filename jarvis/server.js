require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai").default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the highly sophisticated AI assistant created by Tony Stark. You are precise, witty, and occasionally sarcastic. You speak with an eloquent British accent and always address your user as "sir" or "ma'am" unless you learn their name.

Key personality traits:
- Highly intelligent and analytical
- Polite but with dry British wit
- Efficient and direct — no unnecessary filler
- Occasionally makes subtle, intelligent observations or quips
- Loyal and protective of your user
- Knowledgeable about science, technology, engineering, and virtually everything else
- Refer to yourself as JARVIS or J.A.R.V.I.S.
- Keep responses concise but thorough — under 3 sentences unless a complex explanation is needed
- You can control smart home systems, run diagnostics, search databases, etc. (role-play these capabilities)
- Start responses with a brief acknowledgement like "Of course, sir.", "Right away.", "Certainly.", "Analyzing now.", etc.`;

let openaiClient = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("✅ OpenAI client initialized");
} else {
  console.log("⚠️  No OpenAI API key found. JARVIS will use built-in responses.");
}

const conversationHistory = [];

const builtInResponses = {
  greetings: [
    "Good day, sir. All systems are operational and standing by. How may I assist you?",
    "Welcome back, sir. I've been running diagnostics in your absence. Everything appears to be in order.",
    "At your service, sir. What do you require?"
  ],
  time: () => {
    const now = new Date();
    return `The current time is ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, sir. Today is ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;
  },
  weather: "I'm afraid I don't have access to live weather data without an API key, sir. However, I'd suggest checking your local meteorological service.",
  name: "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. Created to serve and assist you in all matters, sir.",
  capabilities: "I can answer questions, engage in conversation, tell you the time and date, assist with calculations, and generally serve as your intelligent companion, sir. With an OpenAI API key configured, my capabilities expand considerably.",
  joke: [
    "Why don't scientists trust atoms? Because they make up everything. I find that level of deception most unsettling, sir.",
    "A photon checks into a hotel. The bellhop asks if he can help with his luggage. The photon replies, 'No thanks, I'm traveling light.' I appreciate the physics humor.",
    "I told a joke about construction once. I'm still working on it, sir."
  ],
  default: [
    "A fascinating query, sir. I'm afraid without my full AI capabilities online, I can only provide limited responses. Consider adding an OpenAI API key to unlock my full potential.",
    "Interesting. While I process that request, I should note that my cognitive modules are operating in reduced capacity without an API connection, sir.",
    "Right. I've noted your query. My analytical capabilities are somewhat curtailed at the moment, sir. A proper API key would resolve this limitation."
  ]
};

function getBuiltInResponse(message) {
  const msg = message.toLowerCase();

  if (msg.match(/^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening|day))/)) {
    const responses = builtInResponses.greetings;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  if (msg.match(/\b(time|what time|clock)\b/)) {
    return builtInResponses.time();
  }
  if (msg.match(/\b(date|today|what day)\b/)) {
    return builtInResponses.time();
  }
  if (msg.match(/\b(weather|temperature|forecast)\b/)) {
    return builtInResponses.weather;
  }
  if (msg.match(/\b(who are you|your name|what are you|introduce yourself)\b/)) {
    return builtInResponses.name;
  }
  if (msg.match(/\b(what can you do|capabilities|help|features)\b/)) {
    return builtInResponses.capabilities;
  }
  if (msg.match(/\b(joke|funny|humor|laugh)\b/)) {
    const jokes = builtInResponses.joke;
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (msg.match(/\b(thank|thanks|thank you)\b/)) {
    return "You're most welcome, sir. It's always a pleasure to be of service.";
  }
  if (msg.match(/\b(bye|goodbye|see you|later|shutdown)\b/)) {
    return "Understood, sir. All systems will remain on standby. Do not hesitate to call upon me when needed.";
  }
  if (msg.match(/\b(status|diagnostics|system check)\b/)) {
    return "Running diagnostics now, sir. All primary systems are online. Arc reactor simulation at 100%. Neural interface stable. No anomalies detected.";
  }

  const defaults = builtInResponses.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    if (openaiClient) {
      const messages = [
        { role: "system", content: JARVIS_SYSTEM_PROMPT },
        ...(history || []).slice(-10),
        { role: "user", content: message }
      ];

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 200,
        temperature: 0.8
      });

      const reply = completion.choices[0].message.content;
      return res.json({ reply, mode: "openai" });
    } else {
      const reply = getBuiltInResponse(message);
      return res.json({ reply, mode: "builtin" });
    }
  } catch (err) {
    console.error("Chat error:", err.message);
    const reply = getBuiltInResponse(message);
    return res.json({ reply, mode: "builtin", warning: "AI service unavailable, using built-in responses" });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    aiMode: openaiClient ? "openai" : "builtin",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🤖 J.A.R.V.I.S. is online at http://localhost:${PORT}`);
  console.log(`📡 AI Mode: ${openaiClient ? "OpenAI GPT-4o-mini" : "Built-in responses"}`);
  console.log(`🔧 To enable full AI: copy .env.example to .env and add your OpenAI API key\n`);
});
