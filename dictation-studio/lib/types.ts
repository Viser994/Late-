export interface Utterance {
  /** Speaker label as returned by diarization, e.g. "A", "B" */
  speaker: string;
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  confidence?: number;
}

export interface TranscriptResult {
  id: string;
  text: string;
  /** Detected (or used) language code, e.g. "en", "es", "fr" */
  language: string | null;
  languageConfidence: number | null;
  /** Audio duration in seconds */
  audioDuration: number | null;
  utterances: Utterance[];
  source: "assemblyai" | "demo";
}

export type JobStatus =
  | "idle"
  | "ready"
  | "transcribing"
  | "done"
  | "error";
