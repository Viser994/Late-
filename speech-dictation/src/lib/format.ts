function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/** Formats milliseconds as `m:ss` or `h:mm:ss` for on-screen display. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/** Formats seconds as `m:ss` or `h:mm:ss`. */
export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  return formatClock(seconds * 1000);
}

/** SRT timestamps use a comma as the millisecond separator: `HH:MM:SS,mmm`. */
export function formatSrtTime(ms: number): string {
  return formatTimecode(ms, ",");
}

/** WebVTT timestamps use a period as the millisecond separator: `HH:MM:SS.mmm`. */
export function formatVttTime(ms: number): string {
  return formatTimecode(ms, ".");
}

function formatTimecode(ms: number, separator: "," | "."): string {
  const clamped = Math.max(0, Math.round(ms));
  const hours = Math.floor(clamped / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  const millis = clamped % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/** Resolves a BCP-47 / AssemblyAI language code (e.g. `en_us`, `pt`) to a display name. */
export function languageName(code: string | null): string {
  if (!code) return "Unknown";
  const normalized = code.replace("_", "-");
  try {
    const names = new Intl.DisplayNames(["en"], { type: "language" });
    return names.of(normalized) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
