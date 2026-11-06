export interface TranscriptWord {
  text: string;
  /** Start time in milliseconds */
  start: number;
  /** End time in milliseconds */
  end: number;
  confidence: number;
  speaker: string | null;
}

export interface TranscriptSegment {
  id: string;
  /** Speaker label as returned by AssemblyAI, e.g. "A", "B" */
  speaker: string;
  /** Start time in milliseconds */
  start: number;
  /** End time in milliseconds */
  end: number;
  text: string;
  confidence: number;
  words: TranscriptWord[];
}

export interface TranscriptResult {
  id: string;
  text: string;
  languageCode: string | null;
  languageConfidence: number | null;
  /** Duration of the media in seconds */
  audioDuration: number | null;
  segments: TranscriptSegment[];
  speakers: string[];
}

export interface TranscribeErrorResponse {
  error: string;
}

export type SpeakerNames = Record<string, string>;

export type ExportFormat = "srt" | "vtt" | "txt";
