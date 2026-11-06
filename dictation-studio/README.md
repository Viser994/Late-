# Dictation Studio

Multilingual speech dictation and subtitle generation built with Next.js (App Router), Tailwind CSS and TypeScript, powered by [AssemblyAI](https://www.assemblyai.com/).

## Features

- Browser microphone recorder with start / pause / resume / stop and a live waveform
- Drag-and-drop or browse upload for `.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`
- Server route (`app/api/transcribe/route.ts`) using the `assemblyai` SDK with `speaker_labels: true` and `language_detection: true`
- Timestamped, speaker-labelled transcript cards (speakers can be renamed inline)
- Click any card to seek the audio player to that moment; the active card follows playback
- Export captions as `.srt`, `.vtt` or `.txt` (long turns are split into subtitle-sized cues using word timings)

## Getting started

```bash
cd dictation-studio
npm install
cp .env.example .env.local   # then set ASSEMBLYAI_API_KEY
npm run dev
```

Open http://localhost:3000. The API key is only read on the server from `ASSEMBLYAI_API_KEY` and is never sent to the browser.

Set `ASSEMBLYAI_BASE_URL=https://api.eu.assemblyai.com` to use the EU endpoint.

## Notes

- Microphone access requires `https://` or `localhost`.
- The upload is proxied through the Next.js route, so hosts with request-body limits (for example 4.5 MB on Vercel serverless functions) will restrict file size. Self-hosting with `npm run build && npm start` allows up to the 500 MB limit enforced in the route.
