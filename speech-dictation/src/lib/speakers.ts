import type { SpeakerNames } from "./types";

export interface SpeakerTheme {
  badge: string;
  dot: string;
  ring: string;
  text: string;
}

const PALETTE: SpeakerTheme[] = [
  {
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    dot: "bg-indigo-400",
    ring: "ring-indigo-500/40",
    text: "text-indigo-300",
  },
  {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    ring: "ring-emerald-500/40",
    text: "text-emerald-300",
  },
  {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
  },
  {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    ring: "ring-rose-500/40",
    text: "text-rose-300",
  },
  {
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    ring: "ring-sky-500/40",
    text: "text-sky-300",
  },
  {
    badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    dot: "bg-fuchsia-400",
    ring: "ring-fuchsia-500/40",
    text: "text-fuchsia-300",
  },
];

export function speakerTheme(speaker: string, speakers: string[]): SpeakerTheme {
  const index = Math.max(0, speakers.indexOf(speaker));
  return PALETTE[index % PALETTE.length];
}

export function defaultSpeakerName(speaker: string): string {
  return `Speaker ${speaker}`;
}

export function speakerDisplayName(
  speaker: string,
  names: SpeakerNames,
): string {
  const custom = names[speaker]?.trim();
  return custom && custom.length > 0 ? custom : defaultSpeakerName(speaker);
}
