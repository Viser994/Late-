# LingoScribe — Multilingual Dictation & Subtitle Studio

A Next.js (App Router) + Tailwind CSS + TypeScript web app that turns speech
in any language into timestamped, speaker-labelled subtitles.

Record from your microphone or upload an audio/video file, transcribe it
server-side with [AssemblyAI](https://www.assemblyai.com/), then click
transcript cards to seek the player, rename speakers, search, and export
`.srt`, `.vtt`, or `.txt` captions.

## Features

- **Web audio recorder** — start / pause / resume / stop with a live
  Web Audio waveform visualizer and timer
- **File upload dropzone** — drag & drop or browse for
  `.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm` (up to 200 MB)
- **AssemblyAI backend** — `app/api/transcribe/route.ts` uses the
  `assemblyai` Node SDK with `speaker_labels: true` (diarization) and
  `language_detection: true` (automatic language detection); the API key is
  read server-side from `ASSEMBLYAI_API_KEY` and never sent to the browser
- **Audio/video player & subtitle cards** — clickable waveform, ±5s skip,
  playback speed, and timestamped cards coloured per speaker (falling back
  to word-level turn reconstruction when utterances aren't returned)
- **Interactive seeking** — clicking any transcript card seeks the player
  to that exact second and plays; the active card highlights and
  auto-scrolls as media plays
- **Exports** — download captions as `.srt`, `.vtt`, or `.txt`, with any
  speaker renames applied
- **Demo mode** — no API key? Load the built-in demo transcript and try
  seeking, renaming, searching, and exporting instantly

## Getting started

```bash
npm install
cp .env.example .env.local   # then paste your AssemblyAI API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get a free API key at
[assemblyai.com/dashboard/signup](https://www.assemblyai.com/dashboard/signup),
set it as `ASSEMBLYAI_API_KEY` in `.env.local`, and restart the dev server.
The header badge in the app shows whether the key is detected.

## How transcription flows

1. The browser uploads the file (or browser recording) as multipart form
   data to `POST /api/transcribe`.
2. The server route validates the file type/size, reads
   `ASSEMBLYAI_API_KEY`, and calls `client.transcripts.transcribe()` with
   `speaker_labels: true` and `language_detection: true`.
3. The route normalizes AssemblyAI's millisecond utterances into seconds
   and returns `{ text, language, languageConfidence, audioDuration, utterances }`.
4. The UI renders utterances as clickable subtitle cards synced to the
   media player, and generates SRT/VTT/TXT client-side from the same data.

## Project structure

```
app/
  api/transcribe/route.ts   # AssemblyAI server route (Node runtime)
  layout.tsx                # Fonts + metadata
  page.tsx                  # Home page → <Studio />
components/
  Studio.tsx                # Main app orchestration, exports, stats
  Recorder.tsx              # Microphone recorder (MediaRecorder)
  LiveWaveform.tsx          # Canvas waveform from an AnalyserNode
  Dropzone.tsx              # Drag-and-drop file upload
  MediaPlayer.tsx           # Player + clickable waveform + seeking API
  TranscriptList.tsx        # Searchable, renamable subtitle cards
lib/
  types.ts                  # Shared transcript types
  subtitles.ts              # SRT / VTT / TXT formatting + download helpers
  demo.ts                   # Built-in demo transcript
```

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```
