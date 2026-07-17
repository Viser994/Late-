# CallGuard AI — Professional AI Voice Agent

Never miss a business call again. CallGuard AI rings your team first, then picks up with a professional AI receptionist when no one answers.

## Features

- **Missed-call handling** — Rings your business phone first; AI answers only when unanswered
- **Natural conversations** — Powered by OpenAI with speech recognition via Twilio
- **Professional voices** — Amazon Polly neural voices (Joanna, Matthew, Amy, Brian)
- **Message taking** — Collects caller name, reason, and callback details
- **Business hours awareness** — Adjusts tone and messaging after hours
- **SMS summaries** — Optional text message to the business after each AI-handled call
- **Admin dashboard** — Configure your agent, view call logs, and track setup status

## Architecture

```
Caller → Twilio Number → Ring Business (20s) → No Answer? → AI Agent
                                              → Answered?  → Connected
```

| Component | Purpose |
|-----------|---------|
| **Twilio** | Phone calls, speech-to-text, text-to-speech |
| **OpenAI** | Intelligent conversation and call summaries |
| **Express** | Webhook server and admin API |
| **Dashboard** | Business configuration and call monitoring |

## Quick Start

### 1. Install

```bash
cd ai-voice-agent
npm install
cp .env.example .env
```

### 2. Configure `.env`

```env
PORT=3000
BASE_URL=https://your-public-url.com

TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+15551234567
BUSINESS_PHONE_NUMBER=+15559876543
RING_TIMEOUT_SECONDS=20

OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_MODEL=gpt-4o-mini

ENABLE_SMS_SUMMARY=false
```

### 3. Start the server

```bash
npm start
```

Open `http://localhost:3000` for the dashboard.

### 4. Expose to the internet

Twilio needs a public URL for webhooks. For local development:

```bash
ngrok http 3000
```

Set `BASE_URL` in `.env` to your ngrok URL (e.g. `https://abc123.ngrok.io`).

### 5. Configure Twilio

In [Twilio Console](https://console.twilio.com) → Phone Numbers → your number:

| Setting | Value |
|---------|-------|
| **Voice webhook (incoming)** | `https://your-url/voice/incoming` (HTTP POST) |
| **Status callback** | `https://your-url/voice/status` (HTTP POST) |

### 6. Test

Call your Twilio number. Your business phone rings first. Don't answer — the AI agent will pick up and greet the caller.

## Customization

Edit settings in the dashboard (**Configure Agent**) or edit `config/default-business.json`:

- Business name, hours, and timezone
- AI agent name, voice, and personality
- Greeting and after-hours messages
- Services the agent can help with
- FAQs (add to the `faqs` array in config)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/voice/incoming` | POST | Twilio webhook — incoming calls |
| `/voice/no-answer` | POST | Twilio callback — business didn't answer |
| `/voice/agent/respond` | POST | Processes caller speech |
| `/voice/status` | POST | Call status updates |
| `/api/config` | GET/PUT | Business configuration |
| `/api/calls` | GET | Recent call log |
| `/api/status` | GET | System health check |
| `/health` | GET | Server health |

## Deployment

Deploy to any Node.js host (Railway, Render, Fly.io, AWS, etc.):

1. Set environment variables from `.env.example`
2. Set `BASE_URL` to your production domain
3. Point Twilio webhooks to your production URL
4. Run `npm start`

## Cost Estimate

| Service | Approximate cost |
|---------|------------------|
| Twilio phone number | ~$1.15/month |
| Twilio voice | ~$0.013/min inbound |
| OpenAI GPT-4o-mini | ~$0.001 per conversation turn |

A typical 2-minute missed call costs roughly $0.03–0.05.

## License

MIT
