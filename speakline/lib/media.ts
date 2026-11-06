export const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;

const ALLOWED = new Set(["mp3", "wav", "m4a", "mp4", "webm"]);

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

export function isAllowedMedia(file: { name: string }): boolean {
  return ALLOWED.has(extensionOf(file.name));
}

export function mediaKind(file: { name: string; type?: string }): "audio" | "video" {
  const type = file.type ?? "";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return extensionOf(file.name) === "mp4" ? "video" : "audio";
}

export function uploadTooLarge(size: number): boolean {
  return size > MAX_UPLOAD_BYTES;
}
