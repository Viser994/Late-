import type { Cue, UtteranceLike, WordLike } from "./types";

const MAX_CHARS = 84;
const MAX_CUE_MS = 7000;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function averageConfidence(words: WordLike[]): number | null {
  const values = words
    .map((word) => word.confidence)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function makeCue(words: WordLike[], index: number): Cue | null {
  const text = clean(words.map((word) => word.text).join(" "));
  if (!text) return null;
  const speaker = words[0]?.speaker?.trim() || "A";
  return {
    id: `c-${words[0].start}-${index}`,
    speaker,
    text,
    start: words[0].start,
    end: words[words.length - 1].end,
    confidence: averageConfidence(words),
  };
}

export function cuesFromWords(words: WordLike[]): Cue[] {
  const cues: Cue[] = [];
  let bucket: WordLike[] = [];

  const lengthOf = (list: WordLike[]) => clean(list.map((word) => word.text).join(" ")).length;

  const flush = () => {
    const cue = makeCue(bucket, cues.length);
    if (cue) cues.push(cue);
    bucket = [];
  };

  for (const word of words) {
    const text = clean(word.text ?? "");
    if (!text) continue;
    const speaker = word.speaker?.trim() || "A";
    const next: WordLike = { ...word, text, speaker };
    if (bucket.length) {
      const previousSpeaker = bucket[0].speaker?.trim() || "A";
      const nextLength = lengthOf(bucket) + 1 + text.length;
      const nextDuration = next.end - bucket[0].start;
      const sentenceDone = /[.!?…]$/.test(bucket[bucket.length - 1].text) && lengthOf(bucket) >= 32;
      if (speaker !== previousSpeaker || nextLength > MAX_CHARS || nextDuration > MAX_CUE_MS || sentenceDone) {
        flush();
      }
    }
    bucket.push(next);
  }
  flush();
  return cues;
}

export function splitTimedText(
  text: string,
  start: number,
  end: number,
  speaker: string,
  confidence: number | null,
): Cue[] {
  const cleaned = clean(text);
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?…]+[.!?…]*|[^.!?…]+/g)?.map((part) => clean(part)).filter(Boolean) ?? [cleaned];
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    const joined = current ? `${current} ${part}` : part;
    if (joined.length > MAX_CHARS && current) {
      chunks.push(current);
      current = part;
    } else {
      current = joined;
    }
  }
  if (current) chunks.push(current);
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0) || 1;
  const span = Math.max(0, end - start);
  let cursor = start;
  return chunks.map((chunk, index) => {
    const slice = Math.round((span * chunk.length) / total);
    const cueStart = cursor;
    const cueEnd = index === chunks.length - 1 ? end : Math.max(cursor + 200, cursor + slice);
    cursor = cueEnd;
    return {
      id: `t-${cueStart}-${index}`,
      speaker: speaker.trim() || "A",
      text: chunk,
      start: cueStart,
      end: Math.max(cueEnd, cueStart),
      confidence,
    };
  });
}

export function buildCues(input: {
  text?: string | null;
  audioDurationSec?: number | null;
  utterances?: UtteranceLike[] | null;
  words?: WordLike[] | null;
}): Cue[] {
  const utterances = input.utterances ?? [];
  if (utterances.length) {
    const cues: Cue[] = [];
    for (const utterance of utterances) {
      const speaker = utterance.speaker?.trim() || "A";
      const words = utterance.words?.filter((word) => clean(word.text ?? "")) ?? [];
      if (words.length) {
        cues.push(...cuesFromWords(words.map((word) => ({ ...word, speaker: word.speaker?.trim() || speaker }))));
      } else if (utterance.text?.trim()) {
        cues.push(
          ...splitTimedText(
            utterance.text,
            utterance.start,
            utterance.end,
            speaker,
            utterance.confidence ?? null,
          ),
        );
      }
    }
    if (cues.length) return cues;
  }

  const words = input.words?.filter((word) => clean(word.text ?? "")) ?? [];
  if (words.length) {
    const cues = cuesFromWords(words);
    if (cues.length) return cues;
  }

  const text = input.text?.trim();
  if (!text) return [];
  const end = Math.max(1000, Math.round((input.audioDurationSec ?? 1) * 1000));
  return splitTimedText(text, 0, end, "A", null);
}

export function activeCueIndex(cues: Cue[], timeMs: number): number {
  if (!Number.isFinite(timeMs)) return -1;
  for (let index = 0; index < cues.length; index += 1) {
    const start = cues[index].start;
    const boundary = index < cues.length - 1 ? cues[index + 1].start : cues[index].end;
    if (timeMs >= start && timeMs < boundary) return index;
  }
  return -1;
}

export const SPEAKER_PALETTE = [
  "#d6ff3f",
  "#7dd3fc",
  "#fb7185",
  "#c4b5fd",
  "#fdba74",
  "#5eead4",
  "#f9a8d4",
  "#fde68a",
];

export function speakerColor(speaker: string, order: string[]): string {
  const index = Math.max(0, order.indexOf(speaker));
  return SPEAKER_PALETTE[index % SPEAKER_PALETTE.length];
}
