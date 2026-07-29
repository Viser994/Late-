# J.A.R.V.I.S. — Just A Rather Very Intelligent System

A fully interactive AI voice assistant inspired by Tony Stark's JARVIS from Iron Man. Features a futuristic HUD interface, voice recognition, text-to-speech, and AI-powered responses via OpenAI GPT.

## Features

- **Futuristic HUD Interface** — Animated arc reactor, particle field, scanlines, and glowing panels inspired by Iron Man's suit
- **Voice Recognition** — Click the microphone and speak naturally (Chrome/Edge recommended)
- **Text-to-Speech** — JARVIS responds in a British voice using the Web Speech API
- **AI-Powered Responses** — Connect your OpenAI API key for full GPT-4o-mini intelligence
- **Built-in Fallback** — Works without an API key using smart rule-based responses
- **Boot Sequence Animation** — Authentic system startup with animated progress log
- **Quick Commands** — One-click buttons for common queries
- **Adjustable Voice** — Control speech rate, pitch, and toggle voice/sound FX
- **Comm Log** — Right panel logs all conversation history with timestamps
- **System Diagnostics** — Live animated diagnostic gauges

## Quick Start

### 1. Install dependencies

```bash
cd jarvis
npm install
```

### 2. Configure (optional — for full AI)

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Get a free API key at [platform.openai.com](https://platform.openai.com/api-keys).

### 3. Start JARVIS

```bash
npm start
```

Open your browser at **http://localhost:3000**

## Usage

| Action | How |
|--------|-----|
| Voice input | Click the microphone button and speak |
| Text input | Type in the input field and press Enter |
| Quick commands | Click the preset buttons on the left panel |
| Toggle voice | Use the VOICE OUTPUT toggle on the right panel |
| Clear chat | Click the CLEAR button on the right panel |

## AI Modes

| Mode | Description |
|------|-------------|
| **OpenAI GPT** | Full intelligence — JARVIS uses GPT-4o-mini for responses |
| **Built-in** | Rule-based responses for common queries (time, greetings, jokes, etc.) |

The current mode is displayed in the top status bar and right diagnostic panel.

## Browser Support

- **Chrome / Edge** — Full support (voice recognition + synthesis)
- **Firefox** — Text only (no speech recognition)
- **Safari** — Limited speech recognition support

## Project Structure

```
jarvis/
├── public/
│   ├── index.html    — Main HUD interface
│   ├── style.css     — Futuristic HUD styling
│   └── app.js        — Frontend logic (voice, UI, API calls)
├── server.js         — Express server + OpenAI integration
├── package.json
├── .env.example      — Environment variable template
└── README.md
```
