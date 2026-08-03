// ============================================================================
// AI Service — placeholder layer
// ----------------------------------------------------------------------------
// This is the single seam where LifeHub talks to an AI backend. Today every
// method returns *mocked* results after a short delay so the UX is fully
// functional offline. To go live, implement `callModel()` (or swap each method)
// to hit your real endpoint — the rest of the app never changes because it only
// depends on these method signatures.
//
//   Real integration example (pseudo-code):
//     async function callModel(prompt) {
//       const res = await fetch(AI_ENDPOINT, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
//         body: JSON.stringify({ prompt }),
//       });
//       return (await res.json()).text;
//     }
// ============================================================================

/** Simulated network/model latency so loading states feel real. */
const LATENCY_MS = 1100;
const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

/**
 * Whether a real AI backend is wired up. Flip this (and implement callModel)
 * when connecting a provider. The UI reads this to label results as a demo.
 * @type {boolean}
 */
export const AI_CONNECTED = false;

/** Currency + date matchers reused by the mock extraction. */
const MONEY_RE = /\$\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/g;
const DATE_RE = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g;

export const aiService = {
  AI_CONNECTED,

  /**
   * Summarize a long document or email into short bullet points.
   * @param {string} text
   * @returns {Promise<string[]>} bullet points
   */
  async summarize(text = '') {
    await wait();
    // --- Placeholder logic: naive sentence ranking. Replace with a model. ---
    const clean = text.replace(/\s+/g, ' ').trim();
    const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
    const keywords = ['due', 'renew', 'total', 'premium', 'expire', 'pay', 'amount',
      'coverage', 'appointment', 'deadline', 'balance', 'contact', 'before'];
    const scored = sentences
      .map((s) => ({ s, score: keywords.reduce((n, k) => n + (s.toLowerCase().includes(k) ? 1 : 0), 0) + Math.min(s.length / 120, 1) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ s }) => s.charAt(0).toUpperCase() + s.slice(1));
    return scored.length ? scored : ['This document is short — no summary needed.'];
  },

  /**
   * Extract structured, actionable info from a document's text.
   * @param {string} text
   * @returns {Promise<{dates:string[], amounts:string[], actions:string[]}>}
   */
  async extract(text = '') {
    await wait();
    const dates = [...new Set((text.match(DATE_RE) || []))].slice(0, 4);
    const amounts = [...new Set((text.match(MONEY_RE) || []))].slice(0, 4);

    // Derive simple action items from common signals in the text.
    const lower = text.toLowerCase();
    const actions = [];
    if (/renew|renewal/.test(lower)) actions.push('Review renewal before the due date');
    if (/expir/.test(lower)) actions.push('Note the expiry date and set a reminder');
    if (/pay|premium|balance|total|due/.test(lower)) actions.push('Confirm the payment amount and method');
    if (/check in|boarding|flight|departs/.test(lower)) actions.push('Check in online 24h before departure');
    if (/warranty|claim/.test(lower)) actions.push('Keep proof of purchase for warranty claims');
    if (!actions.length) actions.push('File this document for your records');

    return { dates, amounts, actions: [...new Set(actions)].slice(0, 3) };
  },

  /**
   * Suggest a task from an extraction result (used by "Add as reminder").
   * @param {object} doc  the document record
   * @returns {Promise<{title:string, type:string, amount:number|null}>}
   */
  async suggestTask(doc) {
    await wait(500);
    const { amounts } = await this.extract(doc.content || '');
    const amount = amounts[0] ? Number(amounts[0].replace(/[^0-9.]/g, '')) : null;
    const type = /bill|receipt|insurance|premium/.test(doc.category) ? 'bill' : 'reminder';
    return { title: `Follow up: ${doc.name}`, type, amount };
  },
};
