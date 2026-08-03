/**
 * Clarity Brief™ — AI-powered daily digest in plain language.
 *
 * Placeholder service that generates a natural-language summary
 * of your life admin status. Connect to a real LLM later.
 */

import { daysUntil } from "../utils/dates.js";
import { formatCurrency } from "../utils/dates.js";

/**
 * Generate a Clarity Brief from current state.
 * @returns {Promise<{ headline: string, bullets: string[], mood: string }>}
 */
export async function generateClarityBrief(tasks, documents, lifePulse) {
  // Simulated AI delay for realism
  await new Promise((r) => setTimeout(r, 300));

  const active = tasks.filter((t) => !t.completed);
  const overdue = active.filter((t) => daysUntil(t.dueDate) < 0);
  const dueToday = active.filter((t) => daysUntil(t.dueDate) === 0);
  const dueThisWeek = active.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d > 0 && d <= 7;
  });
  const expiringSoon = documents.filter(
    (d) => d.expiryDate && daysUntil(d.expiryDate) >= 0 && daysUntil(d.expiryDate) <= 14
  );

  const totalDueAmount = [...dueToday, ...overdue].reduce((s, t) => s + (t.amount || 0), 0);

  let headline;
  let mood;

  if (lifePulse.score >= 85) {
    headline = "You're in great shape today.";
    mood = "calm";
  } else if (overdue.length > 0) {
    headline = `${overdue.length} item${overdue.length > 1 ? "s need" : " needs"} your attention.`;
    mood = "urgent";
  } else if (dueToday.length > 0) {
    headline = `You have ${dueToday.length} thing${dueToday.length > 1 ? "s" : ""} due today.`;
    mood = "focused";
  } else if (dueThisWeek.length > 0) {
    headline = "A light week ahead — stay ahead of it.";
    mood = "calm";
  } else {
    headline = "Your life admin is under control.";
    mood = "calm";
  }

  const bullets = [];

  if (dueToday.length > 0) {
    bullets.push(
      `Today: ${dueToday.map((t) => t.title).slice(0, 2).join(", ")}${dueToday.length > 2 ? ` +${dueToday.length - 2} more` : ""}`
    );
  }

  if (totalDueAmount > 0) {
    bullets.push(`${formatCurrency(totalDueAmount)} in payments due`);
  }

  if (expiringSoon.length > 0) {
    bullets.push(
      `${expiringSoon[0].name} expires in ${daysUntil(expiringSoon[0].expiryDate)} days`
    );
  }

  if (dueThisWeek.length > 0 && dueToday.length === 0) {
    bullets.push(`${dueThisWeek.length} upcoming task${dueThisWeek.length > 1 ? "s" : ""} this week`);
  }

  if (documents.length > 0) {
    bullets.push(`${documents.length} documents safely stored in your vault`);
  }

  if (bullets.length === 0) {
    bullets.push("No urgent items — enjoy your day");
    bullets.push("Add tasks or documents to keep LifeHub in sync");
  }

  return { headline, bullets: bullets.slice(0, 3), mood };
}
