# Speech dictation — Next.js + AssemblyAI

Multilingual speech-to-text with **speaker diarization** and **automatic language detection**, built with the App Router, TypeScript, Tailwind CSS v4, and the [AssemblyAI](https://www.assemblyai.com/) Node SDK.

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

2. Add your AssemblyAI API key to `.env.local` as `ASSEMBLYAI_API_KEY`.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Features

- **Record** from the microphone with start / pause / stop and a live waveform.
- **Upload** MP3, WAV, M4A, MP4, or WebM (audio is extracted server-side by AssemblyAI).
- **Transcribe** via `POST /api/transcribe` with `speaker_labels` and `language_detection`.
- **Seek** by clicking timestamped speaker cards.
- **Export** captions as `.srt`, `.vtt`, or `.txt`.

## Production

Deploy with the `ASSEMBLYAI_API_KEY` secret set in your host’s environment (never commit real keys).
