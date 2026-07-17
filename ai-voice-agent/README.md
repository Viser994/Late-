# Professional AI Voice Agent for Missed Business Calls

This service answers inbound calls and runs a voice conversation agent for your business.  
It is designed for missed-call coverage and can escalate to a human when needed.

## What it does

- Picks up calls through Twilio voice webhooks.
- Uses OpenAI to generate professional spoken responses.
- Keeps short multi-turn call context per call.
- Escalates to a live number when the caller requests a person or the conversation is urgent.
- Falls back to voicemail + transcription if AI is unavailable.

## Architecture

- **Telephony**: Twilio Programmable Voice
- **AI**: OpenAI Chat Completions
- **Runtime**: Node.js + Express

Endpoints:

- `POST /voice/incoming` - first webhook when call arrives
- `POST /voice/respond` - handles caller speech and AI response loop
- `POST /voice/transcription` - receives voicemail transcription callback
- `POST /voice/status` - optional status callback to clean up memory
- `GET /health` - health check

## 1) Prerequisites

- Node.js 20+
- Twilio account + Twilio phone number with Voice enabled
- OpenAI API key

## 2) Install

```bash
cd ai-voice-agent
npm install
cp .env.example .env
```

Set values in `.env`:

- `OPENAI_API_KEY`: your API key
- `BUSINESS_NAME`: business display name for greeting
- `BUSINESS_DESCRIPTION`: short description for AI context
- `BUSINESS_HOURS`: business hours spoken to callers when relevant
- `FALLBACK_FORWARD_NUMBER`: optional live transfer number (E.164 format)

## 3) Run locally

```bash
npm run dev
```

Expose local server publicly (example using ngrok):

```bash
ngrok http 3000
```

Use the HTTPS ngrok URL in Twilio webhook settings.

## 4) Twilio configuration

In Twilio Console for your phone number:

- **A call comes in**: `POST https://<your-domain>/voice/incoming`
- **Status callback URL** (optional): `POST https://<your-domain>/voice/status`

If your business line uses missed-call forwarding, forward to this Twilio number.

## 5) Production recommendations

- Deploy on a stable host (Fly.io, Render, Railway, AWS, GCP, Azure).
- Add HTTPS and request signature verification for Twilio webhooks.
- Replace in-memory conversation store with Redis for scale and reliability.
- Persist call logs/transcripts to your CRM or support system.
- Add alerting on `/health` and error logs.

## 6) Quick test script

1. Call your Twilio number.
2. Ask: "Can I book an appointment for tomorrow?"
3. Say: "I need a human agent now."
4. Confirm it transfers to `FALLBACK_FORWARD_NUMBER` when configured.

---

This starter gives you a professional baseline.  
From here, you can add CRM integrations, appointment booking APIs, payment workflows, or multilingual support.
