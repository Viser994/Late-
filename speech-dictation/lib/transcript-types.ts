export type TranscriptUtterance = {
  start: number;
  end: number;
  speaker: string;
  text: string;
};

export type TranscribeApiResponse = {
  id: string;
  text: string;
  utterances: TranscriptUtterance[];
  language_code?: string;
  language_codes?: string[] | null;
  language_confidence?: number | null;
  duration?: number | null;
  error?: string;
};
