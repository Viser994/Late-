# LinguaScribe AI

A Next.js App Router website for multilingual speech dictation and subtitle generation.

## Features

- Browser microphone recording with pause, stop, and live waveform visualization
- Drag-and-drop upload for `.mp3`, `.wav`, `.m4a`, `.mp4`, and `.webm`
- AssemblyAI transcription with speaker diarization and automatic language detection
- Timestamped speaker transcript cards that seek the media player when clicked
- Caption export as `.srt`, `.vtt`, or `.txt`
- Modern SaaS-style dark UI built with Tailwind CSS

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your AssemblyAI API key:

```bash
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

Run the app:

```bash
npm run dev
```
