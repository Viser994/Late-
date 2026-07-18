import { splitIntoChunks } from "@/lib/ai/embeddings";
import { storeChunkEmbeddings } from "@/lib/ai/rag";
import { db } from "@/lib/db";
import type { DocumentType } from "@prisma/client";

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse =
      "default" in pdfParseModule
        ? pdfParseModule.default
        : pdfParseModule;
    const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
    return data.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      sheets.push(XLSX.utils.sheet_to_csv(sheet));
    }
    return sheets.join("\n\n");
  }

  if (mimeType === "text/csv") {
    return buffer.toString("utf-8");
  }

  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown"
  ) {
    return buffer.toString("utf-8");
  }

  return buffer.toString("utf-8");
}

export function detectDocumentType(
  fileName: string,
  content: string
): DocumentType {
  const lower = fileName.toLowerCase();
  const contentLower = content.toLowerCase();

  if (lower.includes("soc") || contentLower.includes("soc 2")) return "SOC_REPORT";
  if (lower.includes("iso") || contentLower.includes("iso 27001"))
    return "ISO_DOCUMENT";
  if (lower.includes("pentest") || lower.includes("penetration"))
    return "PENETRATION_TEST";
  if (lower.includes("architecture")) return "ARCHITECTURE";
  if (lower.includes("policy")) return "SECURITY_POLICY";
  if (
    contentLower.includes("policy") ||
    contentLower.includes("procedure")
  )
    return "POLICY";

  return "OTHER";
}

export async function processDocument(documentId: string): Promise<void> {
  const document = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!document) throw new Error("Document not found");

  await db.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    const response = await fetch(document.fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = await extractTextFromBuffer(buffer, document.mimeType);

    if (!text.trim()) {
      throw new Error("No text content extracted from document");
    }

    const docType = detectDocumentType(document.fileName, text);
    const chunks = splitIntoChunks(text);

    await db.documentChunk.deleteMany({ where: { documentId } });

    const createdChunks = await Promise.all(
      chunks.map((content, index) =>
        db.documentChunk.create({
          data: {
            documentId,
            content,
            chunkIndex: index,
            tokenCount: Math.ceil(content.length / 4),
          },
        })
      )
    );

    await storeChunkEmbeddings(
      document.organizationId,
      createdChunks.map((c) => c.id),
      createdChunks.map((c) => c.content)
    );

    await db.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        documentType: docType,
        processedAt: new Date(),
        metadata: { chunkCount: chunks.length, charCount: text.length },
      },
    });

    await db.activityLog.create({
      data: {
        organizationId: document.organizationId,
        action: "document.processed",
        description: `Processed "${document.name}" into ${chunks.length} chunks`,
        metadata: { documentId, chunkCount: chunks.length },
      },
    });
  } catch (error) {
    await db.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Processing failed",
      },
    });
    throw error;
  }
}
