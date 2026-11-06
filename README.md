# VoxScribe

A multilingual speech dictation and subtitle workspace built with Next.js,
TypeScript, Tailwind CSS, and AssemblyAI.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and add an AssemblyAI API key:

   ```bash
   cp .env.example .env.local
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

Then open [http://localhost:3000](http://localhost:3000).

## Features

- Live microphone recording with pause, resume, and waveform visualization
- Drag-and-drop audio and video uploads
- Automatic language detection and speaker diarization
- Timestamped transcript cards with click-to-seek playback
- SRT, WebVTT, and plain-text caption exports

The AssemblyAI key is read only by the server route and is never sent to the
browser.
