import crypto from "node:crypto";

export type ExtractedDocument = {
  title: string;
  mimeType: string;
  text: string;
  metadata: Record<string, unknown>;
};

export type TextChunk = {
  content: string;
  section?: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
};

export function checksum(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function extractTextFromUpload(file: File): Promise<ExtractedDocument> {
  const textLikeTypes = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json"
  ];

  if (textLikeTypes.includes(file.type)) {
    return {
      title: file.name,
      mimeType: file.type,
      text: await file.text(),
      metadata: { source: "native-text" }
    };
  }

  return {
    title: file.name,
    mimeType: file.type || "application/octet-stream",
    text:
      "Binary document extraction is queued for the document-processing worker. Configure PDF, DOCX, spreadsheet, and OCR providers in production.",
    metadata: { source: "worker-placeholder", requiresOcr: true }
  };
}

export function chunkText(text: string, maxChars = 1800, overlap = 200): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        content,
        tokenCount: Math.ceil(content.length / 4),
        metadata: { start, end }
      });
    }

    if (end === normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
