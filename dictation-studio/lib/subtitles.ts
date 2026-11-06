import type { Utterance } from "./types";

/** 65.5 -> "01:05" (or "01:02:03" past an hour) */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

/** SRT uses a comma decimal separator: 00:01:05,500 */
export function formatSrtTime(seconds: number): string {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

/** WebVTT uses a dot decimal separator: 00:01:05.500 */
export function formatVttTime(seconds: number): string {
  return formatSrtTime(seconds).replace(",", ".");
}

export function speakerLabel(
  speaker: string,
  names?: Record<string, string>,
): string {
  return names?.[speaker]?.trim() || `Speaker ${speaker}`;
}

export function toSrt(
  utterances: Utterance[],
  names?: Record<string, string>,
): string {
  return (
    utterances
      .map(
        (u, i) =>
          `${i + 1}\n${formatSrtTime(u.start)} --> ${formatSrtTime(u.end)}\n${speakerLabel(u.speaker, names)}: ${u.text}\n`,
      )
      .join("\n") + "\n"
  );
}

export function toVtt(
  utterances: Utterance[],
  names?: Record<string, string>,
): string {
  return (
    "WEBVTT\n\n" +
    utterances
      .map(
        (u, i) =>
          `${i + 1}\n${formatVttTime(u.start)} --> ${formatVttTime(u.end)}\n<v ${speakerLabel(u.speaker, names)}>${u.text}</v>\n`,
      )
      .join("\n") +
    "\n"
  );
}

export function toTxt(
  utterances: Utterance[],
  names?: Record<string, string>,
): string {
  return (
    utterances
      .map(
        (u) =>
          `[${formatClock(u.start)} - ${formatClock(u.end)}] ${speakerLabel(u.speaker, names)}: ${u.text}`,
      )
      .join("\n") + "\n"
  );
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mime = "text/plain;charset=utf-8",
) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function fileBaseName(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "transcript"
  );
}

const SPEAKER_PALETTE = [
  "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "bg-sky-500/15 text-sky-300 ring-sky-400/30",
];

const SPEAKER_DOT = [
  "bg-violet-400",
  "bg-cyan-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-emerald-400",
  "bg-sky-400",
];

export function speakerIndex(speaker: string, speakers: string[]): number {
  const i = speakers.indexOf(speaker);
  if (i >= 0) return i;
  // Fall back to hashing the label so unknown speakers still get a stable colour.
  let h = 0;
  for (const ch of speaker) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % SPEAKER_PALETTE.length;
}

export function speakerClasses(speaker: string, speakers: string[]): string {
  return SPEAKER_PALETTE[speakerIndex(speaker, speakers) % SPEAKER_PALETTE.length];
}

export function speakerDot(speaker: string, speakers: string[]): string {
  return SPEAKER_DOT[speakerIndex(speaker, speakers) % SPEAKER_DOT.length];
}
