/**
 * AI Service — placeholder layer for future AI integration.
 *
 * Replace the mock implementations below with real API calls
 * (OpenAI, Anthropic, Google Gemini, etc.) when connecting
 * to a backend.
 *
 * Expected integration points:
 *   - extractFromDocument(file) → dates, amounts, action items
 *   - summarizeDocument(fileOrText) → bullet-point summary
 *   - extractFromImage(file) → OCR + structured extraction
 */

/** Simulated network delay for realistic UX */
const MOCK_DELAY_MS = 1500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract structured data from an uploaded document.
 * @param {File} file - The uploaded file
 * @returns {Promise<{dates: Array, amounts: Array, actionItems: Array, summary: Array}>}
 */
export async function extractFromDocument(file) {
  await delay(MOCK_DELAY_MS);

  const name = file.name.toLowerCase();
  const isReceipt = name.includes("receipt") || name.includes("invoice");
  const isInsurance = name.includes("insurance") || name.includes("policy");
  const isWarranty = name.includes("warranty");

  // Mock extraction based on filename heuristics
  if (isReceipt) {
    return {
      dates: [{ label: "Purchase date", date: new Date().toISOString() }],
      amounts: [{ label: "Total", amount: 49.99 }],
      actionItems: ["Review for expense report", "File for reimbursement"],
      summary: [
        "Receipt uploaded successfully",
        "Total amount detected: $49.99",
        "Consider adding to expense tracker",
      ],
    };
  }

  if (isInsurance) {
    const renewal = new Date();
    renewal.setMonth(renewal.getMonth() + 6);
    return {
      dates: [{ label: "Policy renewal", date: renewal.toISOString() }],
      amounts: [{ label: "Annual premium", amount: 1200 }],
      actionItems: ["Review coverage before renewal", "Compare quotes"],
      summary: [
        "Insurance document detected",
        "Policy renewal in ~6 months",
        "Annual premium: $1,200",
      ],
    };
  }

  if (isWarranty) {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return {
      dates: [{ label: "Warranty expires", date: expiry.toISOString() }],
      amounts: [],
      actionItems: ["Set reminder before warranty expires"],
      summary: [
        "Warranty document detected",
        "Coverage period: 1 year from purchase",
        "Keep proof of purchase with this document",
      ],
    };
  }

  // Generic extraction for any document
  return {
    dates: [{ label: "Document date", date: new Date().toISOString() }],
    amounts: [],
    actionItems: ["Review document for important dates"],
    summary: [
      `Processed: ${file.name}`,
      "No specific template matched — general extraction applied",
      "Review extracted details and add reminders as needed",
    ],
  };
}

/**
 * Summarize a document or long text into bullet points.
 * @param {string} textOrName - Document text or filename for context
 * @returns {Promise<string[]>}
 */
export async function summarizeDocument(textOrName) {
  await delay(MOCK_DELAY_MS);

  return [
    "Document analyzed successfully",
    "Key information has been extracted",
    "Review the summary and confirm accuracy",
    "Add any missing dates or amounts manually",
  ];
}

/**
 * Scan an image (receipt, ID, screenshot) and extract data.
 * @param {File} file - Image file
 * @returns {Promise<{dates: Array, amounts: Array, text: string}>}
 */
export async function extractFromImage(file) {
  await delay(MOCK_DELAY_MS);

  return {
    dates: [{ label: "Scanned date", date: new Date().toISOString() }],
    amounts: [{ label: "Detected amount", amount: 0 }],
    text: `Scanned content from ${file.name}`,
  };
}

/**
 * Check if AI service is available (for future real API).
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
  // Replace with actual health check when API is connected
  return true;
}
