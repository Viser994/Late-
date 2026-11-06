# Speech Dictation & Subtitle Studio

Next.js (App Router) + TypeScript + Tailwind CSS web app for multilingual
speech dictation and subtitle generation.

## Features

- Browser microphone recording with start / pause / stop controls
- Live waveform visualization while recording
- Drag-and-drop file upload (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`)
- AssemblyAI transcription API route with:
  - `speaker_labels: true` (speaker diarization)
  - `language_detection: true` (automatic language detection)
- Transcript cards with timestamps and speaker names
- Interactive seeking (click a transcript card to jump audio playback)
- Caption export in `.srt`, `.vtt`, and `.txt`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Set your key in `.env.local`:

```bash
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Route

- `POST /api/transcribe`
- Accepts `multipart/form-data` with a `file` field
- Calls AssemblyAI SDK from `app/api/transcribe/route.ts`
