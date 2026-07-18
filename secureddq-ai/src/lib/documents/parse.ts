import mammoth from "mammoth";
import Papa from "papaparse";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";

const decoder = new TextDecoder("utf-8");

export async function extractTextFromFile(fileName: string, fileBuffer: Buffer) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text;
  }

  if (lower.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    return parsed.value;
  }

  if (lower.endsWith(".csv")) {
    const csv = decoder.decode(fileBuffer);
    const result = Papa.parse<string[]>(csv, { delimiter: ",", skipEmptyLines: true });
    return result.data.map((row) => row.join(" | ")).join("\n");
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      return `# ${sheetName}\n${JSON.stringify(jsonRows)}`;
    }).join("\n\n");
  }

  return decoder.decode(fileBuffer);
}

export function splitIntoChunks(text: string, maxChars = 1800) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > maxChars) {
      if (current) {
        chunks.push(current.trim());
      }
      current = paragraph;
    } else {
      current += `${current ? "\n\n" : ""}${paragraph}`;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
