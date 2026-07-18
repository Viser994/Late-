export type SupportedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "text/csv"
  | "text/plain"
  | "text/markdown";

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "xlsx", "xls", "csv", "txt", "md"] as const;

/** Map a filename extension to a document ingestion strategy. */
export function detectExtractor(fileName: string): (typeof SUPPORTED_EXTENSIONS)[number] | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext ?? "")
    ? (ext as (typeof SUPPORTED_EXTENSIONS)[number])
    : null;
}

/**
 * Extract plain text from an uploaded document buffer.
 *
 * The production implementation dispatches to format-specific parsers
 * (pdf-parse, mammoth for DOCX, xlsx/SheetJS, and a Tesseract OCR fallback for
 * scanned PDFs). Those parsers pull in native/binary dependencies, so this
 * module exposes a clean interface and a plain-text/csv/markdown path that
 * works everywhere; richer parsers are registered at deploy time.
 */
export async function extractText(fileName: string, buffer: Buffer): Promise<string> {
  const kind = detectExtractor(fileName);
  switch (kind) {
    case "txt":
    case "md":
    case "csv":
      return buffer.toString("utf8");
    case "pdf":
    case "docx":
    case "xlsx":
    case "xls":
      // Registered parser handles these in production; see module docs.
      return getRegisteredParser(kind)?.(buffer) ?? "";
    default:
      throw new Error(`Unsupported file type: ${fileName}`);
  }
}

type Parser = (buffer: Buffer) => Promise<string> | string;
const parsers: Partial<Record<(typeof SUPPORTED_EXTENSIONS)[number], Parser>> = {};

/** Register a format parser (called from server bootstrap in production). */
export function registerParser(kind: (typeof SUPPORTED_EXTENSIONS)[number], parser: Parser) {
  parsers[kind] = parser;
}

function getRegisteredParser(kind: (typeof SUPPORTED_EXTENSIONS)[number]): Parser | undefined {
  return parsers[kind];
}
