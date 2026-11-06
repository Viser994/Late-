import type { Cue } from "./types";

export function displayName(speaker: string, names: Record<string, string> = {}): string {
  const custom = names[speaker]?.replace(/\s+/g, " ").trim();
  if (custom) return custom;
  const raw = speaker.replace(/\s+/g, " ").trim() || "A";
  if (/^speaker\b/i.test(raw)) return raw;
  return `Speaker ${raw}`;
}

export function formatSrtTime(ms: number): string {
  return formatClock(ms, ",");
}

export function formatVttTime(ms: number): string {
  return formatClock(ms, ".");
}

function formatClock(ms: number, decimal: "," | "."): string {
  const clamped = Math.max(0, Math.round(ms));
  const hours = Math.floor(clamped / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const millis = clamped % 1000;
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${decimal}${pad(millis, 3)}`;
}

function range(cue: Cue): { start: number; end: number } {
  const start = Math.max(0, Math.round(cue.start));
  let end = Math.max(0, Math.round(cue.end));
  if (end <= start) end = start + 400;
  return { start, end };
}

function captionText(text: string): string {
  return text.replace(/-->/g, "→").replace(/\s+/g, " ").trim();
}

export function wrapCaption(text: string, width = 42): string {
  const words = captionText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function safeName(speaker: string, names: Record<string, string>): string {
  return displayName(speaker, names).replace(/[<>]/g, "").replace(/\s+/g, " ").trim() || "Speaker";
}

export function toSrt(cues: Cue[], names: Record<string, string> = {}): string {
  const body = cues
    .map((cue, index) => {
      const { start, end } = range(cue);
      const name = safeName(cue.speaker, names);
      return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${name}\n${wrapCaption(cue.text)}\n`;
    })
    .join("\n");
  return `\uFEFF${body}`;
}

export function toVtt(cues: Cue[], names: Record<string, string> = {}): string {
  const body = cues
    .map((cue, index) => {
      const { start, end } = range(cue);
      const name = safeName(cue.speaker, names);
      return `${index + 1}\n${formatVttTime(start)} --> ${formatVttTime(end)}\n<v ${name}>${wrapCaption(cue.text)}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export function toTxt(cues: Cue[], names: Record<string, string> = {}): string {
  const body = cues
    .map((cue) => {
      const name = safeName(cue.speaker, names);
      const stamp = formatSrtTime(Math.max(0, cue.start)).replace(",", ".");
      return `[${stamp}] ${name}\n${captionText(cue.text)}`;
    })
    .join("\n\n");
  return `\uFEFF${body}\n`;
}

export function baseName(filename: string): string {
  const trimmed = filename.trim() || "speakline";
  return trimmed.replace(/\.[^.]+$/, "") || "speakline";
}
