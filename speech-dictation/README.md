# Dictate — Multilingual Speech Dictation & Subtitle Studio

A Next.js (App Router) + TypeScript + Tailwind CSS web app that turns speech into
timestamped, speaker-labelled subtitles using the
[AssemblyAI](https://www.assemblyai.com/) Node SDK.

## Features

- **Microphone recorder** — start / pause / resume / stop controls with a live
  waveform visualizer driven by the Web Audio API.
- **Drag-and-drop upload** — `.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm` (up to 200 MB).
- **Automatic language detection** and **speaker diarization** via AssemblyAI
  (`language_detection: true`, `speaker_labels: true`).
- **Subtitle cards** — one card per speaker turn with speaker name, start/end
  timestamps and confidence. Clicking a card seeks the player to that moment;
  the active card highlights spoken words as playback progresses.
- **Media player** — play/pause, scrub bar, ±10s skip, playback speed, volume.
  Video files render inline.
- **Speaker renaming** — rename "Speaker A/B/…" to real names; exports use them.
- **Export** — download captions as `.srt`, `.vtt`, or `.txt`.
- Dark-mode SaaS UI built with Tailwind CSS v4.

## Getting started

```bash
cd speech-dictation
npm install
cp .env.example .env.local   # then add your AssemblyAI key
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable             | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `ASSEMBLYAI_API_KEY` | Your AssemblyAI API key. Read server-side only.         |

The key is only ever read inside the server route; it is never shipped to the
browser.

## How it works

1. The browser sends the recorded or uploaded media as `multipart/form-data`
   to `POST /api/transcribe` (`src/app/api/transcribe/route.ts`).
2. The route validates the file and calls
   `client.transcripts.transcribe({ audio, speaker_labels: true, language_detection: true, ... })`,
   which uploads the audio to AssemblyAI and polls until the transcript is ready.
3. The response is normalised into `TranscriptResult` (`src/lib/types.ts`):
   per-utterance segments with speaker, timing, text and word-level timings.
4. The client renders the segments as cards, drives seeking through the
   `AudioPlayer` handle, and builds SRT/VTT/TXT output locally
   (`src/lib/subtitles.ts`) — long utterances are split into readable captions
   using the word timings.

## Project structure

```
src/
  app/
    api/transcribe/route.ts   AssemblyAI server route
    layout.tsx, page.tsx      App shell and landing page
    globals.css               Tailwind theme + custom utilities
  components/
    Studio.tsx                Orchestrates recorder, upload, job state, results
    AudioRecorder.tsx         Mic controls + waveform
    Waveform.tsx              Canvas visualizer (AnalyserNode)
    FileDropzone.tsx          Drag-and-drop / file picker
    AudioPlayer.tsx           Media player with imperative seekTo()
    TranscriptCards.tsx       Timestamped speaker cards, active highlighting
    SpeakerLegend.tsx         Rename speakers
    ExportButtons.tsx         SRT / VTT / TXT downloads
  hooks/useRecorder.ts        MediaRecorder + Web Audio lifecycle
  lib/
    subtitles.ts              Caption chunking and format builders
    format.ts                 Time / size / language formatting
    speakers.ts               Speaker names + colour themes
    types.ts                  Shared types
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
