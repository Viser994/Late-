/**
 * AI Service — Placeholder Layer
 *
 * This module provides a clean interface for AI-powered document processing.
 * Currently returns simulated responses so the UI can be wired up immediately.
 * To connect a real AI backend, replace the implementations below while keeping
 * the same function signatures.
 *
 * Recommended backends:
 *   - OpenAI GPT-4o Vision  (for image/PDF understanding)
 *   - Google Document AI     (for structured form extraction)
 *   - AWS Textract           (for OCR + entity extraction)
 */

import { AIProcessingResult, DocumentCategory } from '../types';

// Simulated network delay to mimic real API latency
const simulateLatency = (ms = 1800) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Main Entry Points ────────────────────────────────────────────────────────

/**
 * Process a document (image or PDF) and extract structured information.
 * @param uri       Local file URI from Expo FileSystem / ImagePicker
 * @param mimeType  MIME type of the document
 * @returns         Structured AI result with summary, dates, amounts, actions
 */
export async function processDocument(
  uri: string,
  mimeType: string,
): Promise<AIProcessingResult> {
  // TODO: Replace with real AI call
  // Example OpenAI integration:
  // const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  // const response = await openai.chat.completions.create({ ... });

  await simulateLatency();

  return {
    summary:
      'This document has been processed by AI. Key information has been extracted and organized below. Connect a real AI service to get accurate results.',
    extractedDates: [
      { label: 'Document Date', date: new Date().toISOString().split('T')[0], confidence: 0.8 },
    ],
    extractedAmounts: [],
    actionItems: [
      'Review the extracted information for accuracy',
      'Add relevant due dates to your reminders',
    ],
    suggestedCategory: inferCategoryFromMimeType(mimeType),
    suggestedTags: ['document', 'imported'],
  };
}

/**
 * Generate a concise bullet-point summary of a long text (email, letter, contract).
 * @param text  Raw text content to summarize
 * @returns     Markdown-formatted bullet summary
 */
export async function summarizeText(text: string): Promise<string> {
  // TODO: Replace with real AI call
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4o',
  //   messages: [{ role: 'user', content: `Summarize this in 3–5 bullet points:\n\n${text}` }],
  // });
  // return response.choices[0].message.content ?? '';

  await simulateLatency(1200);

  const wordCount = text.split(' ').length;
  return [
    `• Document contains approximately ${wordCount} words`,
    '• Key dates and amounts have been identified',
    '• Action items extracted and saved to your reminders',
    '• Connect an AI service for accurate content summaries',
  ].join('\n');
}

/**
 * Extract actionable reminders from plain text (email, notice, letter).
 * @param text  Raw text to scan for reminders
 * @returns     Array of suggested task titles
 */
export async function extractReminders(text: string): Promise<string[]> {
  // TODO: Replace with real AI call
  await simulateLatency(800);
  return [
    'Follow up on document',
    'Verify extracted dates',
  ];
}

/**
 * Classify a document into one of the app's categories.
 * @param text  Extracted or partial text from the document
 * @returns     Most likely category
 */
export async function classifyDocument(text: string): Promise<DocumentCategory> {
  // TODO: Replace with real AI call — use embeddings or keyword classification
  await simulateLatency(600);

  const lower = text.toLowerCase();
  if (lower.includes('insurance') || lower.includes('policy')) return 'insurance';
  if (lower.includes('warranty') || lower.includes('guarantee')) return 'warranty';
  if (lower.includes('passport') || lower.includes('license') || lower.includes('id card')) return 'identity';
  if (lower.includes('medical') || lower.includes('prescription') || lower.includes('diagnosis')) return 'medical';
  if (lower.includes('invoice') || lower.includes('receipt') || lower.includes('paid')) return 'receipt';
  if (lower.includes('flight') || lower.includes('hotel') || lower.includes('boarding')) return 'travel';
  if (lower.includes('tax') || lower.includes('bank') || lower.includes('statement')) return 'finance';
  return 'other';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferCategoryFromMimeType(mimeType: string): DocumentCategory {
  if (mimeType.startsWith('image/')) return 'other';
  if (mimeType === 'application/pdf') return 'other';
  return 'other';
}
