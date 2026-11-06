export type CaptionUtterance = {
  start: number;
  end: number;
  speaker: string;
  text: string;
};

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** SRT uses comma as fractional separator */
export function formatSrtTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const frac = total % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(frac, 3)}`;
}

/** WebVTT uses a period before milliseconds */
export function formatVttTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const frac = total % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(frac, 3)}`;
}

export function utterancesToSrt(items: CaptionUtterance[]): string {
  return items
    .map((u, i) => {
      const label = speakerLabel(u.speaker);
      const body = label ? `${label}\n${u.text}` : u.text;
      return `${i + 1}\n${formatSrtTimestamp(u.start)} --> ${formatSrtTimestamp(u.end)}\n${body}\n`;
    })
    .join("\n");
}

export function utterancesToVtt(items: CaptionUtterance[]): string {
  const lines = items.map((u) => {
    const label = speakerLabel(u.speaker);
    const body = label ? `<v ${label}>${u.text}` : u.text;
    return `${formatVttTimestamp(u.start)} --> ${formatVttTimestamp(u.end)}\n${body}`;
  });
  return `WEBVTT\n\n${lines.join("\n\n")}\n`;
}

export function utterancesToTxt(items: CaptionUtterance[]): string {
  return items
    .map((u) => {
      const label = speakerLabel(u.speaker);
      const t = formatClock(u.start);
      return label ? `[${t}] ${label}: ${u.text}` : `[${t}] ${u.text}`;
    })
    .join("\n\n");
}

function speakerLabel(speaker: string): string {
  if (!speaker) return "";
  return /^speaker\s/i.test(speaker) ? speaker : `Speaker ${speaker}`;
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${pad(s)}`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
