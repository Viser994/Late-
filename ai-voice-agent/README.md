# Answerly — AI Voice Agent for Missed Business Calls

When a business misses a call, **Answerly** picks it up. It answers instantly in a
natural voice, understands what the caller needs, answers common questions, books
appointments, and texts the owner every lead — 24/7.

This project has two parts:

| Part | What it is | Runs where |
|------|------------|------------|
| **`index.html` + `styles.css` + `agent.js`** | A polished landing page **and a fully working in‑browser voice demo**. You can literally simulate a missed call and talk to the AI — no phone number, no server, no keys. | Any static host (GitHub Pages, Netlify, or just open the file). |
| **`server/`** | A production reference server (Node.js + Twilio + OpenAI) that runs the same agent on a **real phone number**. | Any Node host (Render, Railway, Fly.io, a VPS…). |

---

## 1. The browser demo (no setup)

Open `index.html` in Chrome, Edge, or Safari and click **“Simulate a Missed Call.”**

- The phone “rings,” the AI answers, and **speaks out loud** using your browser’s
  built‑in speech engine.
- Allow the microphone and **talk to it like a real caller** — ask about hours,
  pricing, or say “I’d like to book an appointment.”
- No microphone? Click **“Type instead”** and type the caller’s side.
- Watch the right‑hand panel capture the **reason, name, callback number, and notes**,
  then see the **lead summary that gets texted to the owner** when the call ends.
- Click **“Switch business type”** to see it answer as a dental clinic, barbershop,
  plumber, or restaurant — each with its own script and knowledge.

### Serve it locally

```bash
cd ai-voice-agent
python3 -m http.server 8080
# then open http://localhost:8080
```

> Speech recognition needs `https://` or `localhost` (browsers block the mic on
> plain `http://` remote origins). The typing fallback always works.

### Browser support

| Feature | Chrome | Edge | Safari | Firefox |
|---|---|---|---|---|
| AI voice (SpeechSynthesis) | ✅ | ✅ | ✅ | ✅ |
| Caller mic (SpeechRecognition) | ✅ | ✅ | ✅ | ⚠️ use “Type instead” |

---

## 2. Going live on a real phone number (`server/`)

The demo proves the experience; `server/` makes it real. It uses **Twilio** for the
phone line and **OpenAI** for the conversation.

### How it works

```
Caller ──▶ Business line (unanswered)
                │  call forwarding
                ▼
        Twilio number ──▶  POST /voice     (greet + gather speech)
                           POST /respond   (LLM reply, spoken back, loop)
                           POST /status    (call ended → text owner the lead)
```

### Run it

```bash
cd ai-voice-agent/server
npm install
cp .env.example .env      # fill in your keys (optional for a dry run)
npm start
```

It runs **without any keys** for a dry run — it uses scripted replies and prints the
call summary to the console. Add `OPENAI_API_KEY` for real conversations and Twilio
credentials to text the owner.

### Connect a phone number

1. Buy a number in the [Twilio Console](https://console.twilio.com/) (Voice‑capable).
2. Expose your server publicly (e.g. `ngrok http 3000`) and set `PUBLIC_BASE_URL`.
3. In the number’s **Voice configuration**, set:
   - **A call comes in** → Webhook → `POST https://<your-url>/voice`
   - **Call status changes** → `POST https://<your-url>/status`
4. On your business phone, turn on **“forward on no answer”** (and/or after hours) to
   the Twilio number. Now every missed call is answered by the AI.

### Customize per business

Edit **`server/business-profile.js`** — name, greeting, hours, services, pricing,
booking rules, and the voice. That single file is everything the agent knows, so
onboarding a new client is a quick edit.

### Production hardening (next steps)

- Swap Twilio `<Say>` for **premium neural TTS** (ElevenLabs / OpenAI audio) and
  **Media Streams** for lower latency, barge‑in, and more human voices.
- Persist conversations in **Redis/Postgres** instead of memory.
- Add **calendar integration** (Google Calendar / Calendly) for real bookings.
- Validate Twilio webhook signatures and add rate limiting.

---

## Project structure

```
ai-voice-agent/
├── index.html            # Landing page + live browser demo
├── styles.css            # Styling
├── agent.js              # The in-browser voice agent (Web Speech API)
├── README.md
└── server/
    ├── index.js            # Twilio + OpenAI phone agent
    ├── business-profile.js # Per-client configuration
    ├── package.json
    └── .env.example
```

## Disclaimer

Answerly is a demo product for illustration. It is not affiliated with any carrier,
Twilio, or OpenAI. Configure consent/recording notices to match your local laws.
