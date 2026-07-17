# AI Voice Agent for Businesses

A professional AI-powered phone agent that automatically answers missed calls on behalf of your business. When a customer calls and you don't pick up, the AI seamlessly takes over — greeting them, answering common questions, capturing leads, and offering to transfer urgent calls to a human.

## Features

| Feature | Details |
|---|---|
| **Natural Conversation** | GPT-4o powered dialogue that sounds human and professional |
| **Custom Business Context** | Feed the AI your services, hours, FAQs and pricing |
| **Lead Capture** | Extracts caller name & number from conversation, shown on dashboard |
| **Call Escalation** | Transfers to a real person when the caller requests it |
| **Live Dashboard** | Real-time call logs, transcripts, and lead management |
| **Webhook Integration** | Push leads to Zapier, Make, HubSpot, or any CRM |
| **Neural Voices** | Uses Amazon Polly neural voices via Twilio for natural sound |
| **Production-safe** | Twilio signature validation, helmet security headers |

## How It Works

```
Customer calls your business number
         │
         ▼ (no answer after N rings)
Call forwards to your Twilio number
         │
         ▼
AI Voice Agent answers the call
         │
    ┌────┴─────────────────────────────────┐
    │  Conversation loop:                   │
    │  1. Caller speaks → Twilio STT        │
    │  2. Text → GPT-4o → reply text        │
    │  3. Reply → Twilio TTS → caller hears │
    └────────────────────────────────────── ┘
         │
         ├─ Lead info extracted & saved
         ├─ Escalation to human if requested
         └─ Summary generated when call ends
```

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd ai-voice-agent
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your credentials and business info
```

### 3. Get API keys

- **OpenAI** – [platform.openai.com](https://platform.openai.com) → API Keys
- **Twilio** – [console.twilio.com](https://console.twilio.com) → Account SID & Auth Token → buy a phone number

### 4. Expose locally with ngrok

```bash
npm install -g ngrok  # if not installed
ngrok http 3000
# Note the https URL, e.g. https://abc123.ngrok.io
```

### 5. Configure your Twilio phone number

In the [Twilio Console](https://console.twilio.com) → Phone Numbers → your number → Voice Configuration:

| Setting | Value |
|---|---|
| **A call comes in** | `https://<your-ngrok-url>/call/incoming` (HTTP POST) |
| **Status Callback URL** | `https://<your-ngrok-url>/call/status` (HTTP POST) |

### 6. Set up call forwarding

On your real business phone, enable **"No Answer" call forwarding** to your Twilio number. Most carriers let you dial a code like `*71 <twilio-number>` — check with your carrier.

### 7. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

## Customising the AI

All customisation is done via environment variables in `.env`:

```env
BUSINESS_NAME=Acme Plumbing
BUSINESS_HOURS=Monday to Friday, 8 AM to 6 PM Eastern
BUSINESS_SERVICES=emergency plumbing, drain cleaning, water heater installation
BUSINESS_CONTEXT=We offer 24/7 emergency service for burst pipes. Call-out fee is $75.
AGENT_NAME=Aria
ESCALATION_PHONE=+15551234567
```

## Deployment (Production)

For production use, deploy to any Node.js host (Railway, Fly.io, Render, AWS, etc.):

1. Set all environment variables in your hosting platform's dashboard
2. Set `VALIDATE_TWILIO_SIGNATURE=true` for security
3. Update your Twilio webhook URLs to your production domain
4. No ngrok needed — your server is publicly reachable

### Railway (one-click deploy)

```bash
railway login
railway init
railway up
```

## Dashboard

The live dashboard at `http://localhost:3000` shows:

- **Overview** – call counts, active calls, leads, escalations
- **Call Logs** – every call with status, duration, transcript
- **Leads** – all captured caller contact info
- **Setup Guide** – step-by-step instructions

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/call/incoming` | POST | Twilio webhook – new inbound call |
| `/call/gather` | POST | Twilio webhook – speech input from caller |
| `/call/status` | POST | Twilio webhook – call status updates |
| `/api/status` | GET | Agent health & config |
| `/api/calls` | GET | All call sessions |
| `/api/calls/:sid` | GET | Single call with full transcript |
| `/api/leads` | GET | All captured leads |

## Environment Variables

See [`.env.example`](.env.example) for the full reference.

## Tech Stack

- **Runtime**: Node.js + Express
- **AI**: OpenAI GPT-4o-mini (configurable)
- **Phone**: Twilio Voice (TwiML, STT, TTS)
- **Voice**: Amazon Polly Neural via Twilio
- **Dashboard**: Vanilla JS + CSS (no build step)
