export type MediaKind = "audio" | "video";

export type MediaOrigin = "recording" | "upload" | "sample";

export type MediaSource = {
  url: string;
  name: string;
  kind: MediaKind;
  file: File;
  origin: MediaOrigin;
  /** Seconds, when the container does not advertise a duration yet. */
  durationHint?: number;
};

export type Cue = {
  id: string;
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number | null;
};

export type TranscriptResult = {
  id: string;
  text: string;
  languageCode: string | null;
  languageConfidence: number | null;
  audioDuration: number | null;
  cues: Cue[];
  sample?: boolean;
};

export type WordLike = {
  text: string;
  start: number;
  end: number;
  speaker?: string | null;
  confidence?: number | null;
};

export type UtteranceLike = {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence?: number | null;
  words?: WordLike[] | null;
};
