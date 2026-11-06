import type { TranscriptResult } from "./types";

/**
 * Built-in sample so the whole studio (player seeking, subtitle cards,
 * renaming speakers, SRT/VTT/TXT export) can be tried without an
 * AssemblyAI API key or microphone.
 */
export const DEMO_RESULT: TranscriptResult = {
  id: "demo",
  source: "demo",
  language: "en",
  languageConfidence: 0.97,
  audioDuration: 52,
  text: "Welcome to the multilingual launch review. Gracias por acompañarnos hoy. Today we'll confirm the subtitle pipeline for English, Spanish, and French recordings. Exacto, la detección automática de idioma ya funciona sin configurar nada. And speaker diarization is separating our voices into clean, timestamped turns. Parfait, alors on peut exporter les sous-titres en SRT et WebVTT. One click on any card jumps the player to that exact second. Let's ship it.",
  utterances: [
    { speaker: "A", text: "Welcome to the multilingual launch review.", start: 0, end: 4.2, confidence: 0.98 },
    { speaker: "B", text: "Gracias por acompañarnos hoy, es un gusto estar aquí.", start: 4.6, end: 8.9, confidence: 0.96 },
    { speaker: "A", text: "Today we'll confirm the subtitle pipeline for English, Spanish, and French recordings.", start: 9.3, end: 15.8, confidence: 0.97 },
    { speaker: "B", text: "Exacto, la detección automática de idioma ya funciona sin configurar nada.", start: 16.2, end: 21.5, confidence: 0.95 },
    { speaker: "A", text: "And speaker diarization is separating our voices into clean, timestamped turns.", start: 21.9, end: 27.4, confidence: 0.98 },
    { speaker: "C", text: "Parfait, alors on peut exporter les sous-titres en SRT et WebVTT.", start: 27.8, end: 33.1, confidence: 0.94 },
    { speaker: "B", text: "One click on any card jumps the player to that exact second — try it.", start: 33.5, end: 38.6, confidence: 0.97 },
    { speaker: "A", text: "Rename speakers, search the transcript, then download your captions.", start: 39.0, end: 44.8, confidence: 0.98 },
    { speaker: "C", text: "Let's ship it.", start: 45.2, end: 47.0, confidence: 0.99 },
  ],
};
