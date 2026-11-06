export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimestamp(ms: number): string {
  const safe = Math.max(0, ms) / 1000;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const whole = Math.floor(secs);
  const tenth = Math.min(9, Math.floor((secs - whole) * 10));
  const body = `${minutes}:${String(whole).padStart(2, "0")}.${tenth}`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${tenth}`;
  return body;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
