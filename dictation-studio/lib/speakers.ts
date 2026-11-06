const PALETTE = [
  { badge: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30", bar: "bg-indigo-400" },
  { badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", bar: "bg-emerald-400" },
  { badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30", bar: "bg-amber-400" },
  { badge: "bg-pink-500/15 text-pink-300 ring-pink-500/30", bar: "bg-pink-400" },
  { badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30", bar: "bg-sky-400" },
  { badge: "bg-orange-500/15 text-orange-300 ring-orange-500/30", bar: "bg-orange-400" },
];

export function speakerStyle(speakers: string[], speaker: string) {
  const idx = Math.max(0, speakers.indexOf(speaker));
  return PALETTE[idx % PALETTE.length];
}
