export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

export interface Segment {
  id: number;
  speaker: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

export interface TranscriptResult {
  id: string;
  languageCode: string | null;
  languageConfidence: number | null;
  duration: number | null;
  segments: Segment[];
}

export type SpeakerNames = Record<string, string>;
