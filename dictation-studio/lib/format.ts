import type { Segment, SpeakerNames } from "./types";

export function speakerLabel(speaker: string, names: SpeakerNames = {}): string {
  const custom = names[speaker]?.trim();
  return custom || `Speaker ${speaker}`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function timestamp(ms: number, separator: "," | "."): string {
  const total = Math.max(0, Math.round(ms));
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const milli = total % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}${separator}${p(milli, 3)}`;
}

interface Cue {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

const MAX_CUE_CHARS = 84;
const MAX_CUE_MS = 7000;
const MAX_LINE_CHARS = 42;
const SENTENCE_END = /[.!?。！？]["')\]]?$/;

/** Splits long speaker turns into readable subtitle-sized cues using word timings. */
export function buildCues(segments: Segment[]): Cue[] {
  const cues: Cue[] = [];

  for (const seg of segments) {
    if (seg.words.length === 0) {
      cues.push({ start: seg.start, end: seg.end, speaker: seg.speaker, text: seg.text });
      continue;
    }

    let buffer: typeof seg.words = [];
    const flush = () => {
      if (buffer.length === 0) return;
      cues.push({
        start: buffer[0].start,
        end: buffer[buffer.length - 1].end,
        speaker: seg.speaker,
        text: buffer.map((w) => w.text).join(" "),
      });
      buffer = [];
    };

    for (const word of seg.words) {
      const nextText = [...buffer, word].map((w) => w.text).join(" ");
      const nextDuration = word.end - (buffer[0]?.start ?? word.start);
      if (buffer.length > 0 && (nextText.length > MAX_CUE_CHARS || nextDuration > MAX_CUE_MS)) {
        flush();
      }
      buffer.push(word);
      if (SENTENCE_END.test(word.text) && buffer.length > 3) flush();
    }
    flush();
  }

  return cues;
}

function wrapLines(text: string): string {
  if (text.length <= MAX_LINE_CHARS) return text;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > MAX_LINE_CHARS) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function cueBody(cue: Cue, names: SpeakerNames, multiSpeaker: boolean, previousSpeaker: string | null): string {
  const text = wrapLines(cue.text);
  if (!multiSpeaker || cue.speaker === previousSpeaker) return text;
  return `${speakerLabel(cue.speaker, names)}: ${text}`;
}

export function toSRT(segments: Segment[], names: SpeakerNames = {}): string {
  const cues = buildCues(segments);
  const multi = new Set(segments.map((s) => s.speaker)).size > 1;
  let prev: string | null = null;
  return (
    cues
      .map((cue, i) => {
        const body = cueBody(cue, names, multi, prev);
        prev = cue.speaker;
        return `${i + 1}\n${timestamp(cue.start, ",")} --> ${timestamp(cue.end, ",")}\n${body}`;
      })
      .join("\n\n") + "\n"
  );
}

export function toVTT(segments: Segment[], names: SpeakerNames = {}): string {
  const cues = buildCues(segments);
  const multi = new Set(segments.map((s) => s.speaker)).size > 1;
  let prev: string | null = null;
  const body = cues
    .map((cue, i) => {
      const text = cueBody(cue, names, multi, prev);
      prev = cue.speaker;
      return `${i + 1}\n${timestamp(cue.start, ".")} --> ${timestamp(cue.end, ".")}\n${text}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export function toTXT(segments: Segment[], names: SpeakerNames = {}): string {
  return (
    segments
      .map((s) => `[${formatClock(s.start / 1000)}] ${speakerLabel(s.speaker, names)}: ${s.text}`)
      .join("\n\n") + "\n"
  );
}

export type ExportFormat = "srt" | "vtt" | "txt";

export const EXPORT_MIME: Record<ExportFormat, string> = {
  srt: "application/x-subrip",
  vtt: "text/vtt",
  txt: "text/plain",
};

export function serialize(format: ExportFormat, segments: Segment[], names: SpeakerNames): string {
  if (format === "srt") return toSRT(segments, names);
  if (format === "vtt") return toVTT(segments, names);
  return toTXT(segments, names);
}
