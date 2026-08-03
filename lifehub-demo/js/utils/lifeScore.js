/**
 * Life Pulse™ — proprietary life-admin wellness score.
 *
 * Combines tasks, documents, and deadlines into a single 0–100
 * "peace of mind" metric. No other app unifies these signals.
 */

import { daysUntil } from "./dates.js";

/**
 * Calculate Life Pulse score from app state.
 * @returns {{ score: number, status: string, factors: Array }}
 */
export function calculateLifePulse(tasks, documents) {
  let score = 100;
  const factors = [];
  const active = tasks.filter((t) => !t.completed);

  // Overdue tasks — heavy penalty
  const overdue = active.filter((t) => daysUntil(t.dueDate) < 0);
  if (overdue.length > 0) {
    const penalty = Math.min(overdue.length * 12, 40);
    score -= penalty;
    factors.push({ type: "danger", text: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}` });
  }

  // Due today
  const dueToday = active.filter((t) => daysUntil(t.dueDate) === 0);
  if (dueToday.length > 0) {
    score -= Math.min(dueToday.length * 5, 15);
    factors.push({ type: "warning", text: `${dueToday.length} due today` });
  }

  // Expiring documents within 14 days
  const expiringSoon = documents.filter(
    (d) => d.expiryDate && daysUntil(d.expiryDate) >= 0 && daysUntil(d.expiryDate) <= 14
  );
  if (expiringSoon.length > 0) {
    score -= Math.min(expiringSoon.length * 8, 24);
    factors.push({ type: "warning", text: `${expiringSoon.length} document${expiringSoon.length > 1 ? "s" : ""} expiring soon` });
  }

  // Expiring within 30 days — mild penalty
  const expiringMonth = documents.filter(
    (d) => d.expiryDate && daysUntil(d.expiryDate) > 14 && daysUntil(d.expiryDate) <= 30
  );
  if (expiringMonth.length > 0) {
    score -= Math.min(expiringMonth.length * 3, 9);
  }

  // Completion bonus
  const completed = tasks.filter((t) => t.completed);
  if (completed.length > 0 && active.length === 0) {
    score = Math.min(score + 5, 100);
    factors.push({ type: "success", text: "All tasks complete" });
  } else if (completed.length >= 3) {
    score = Math.min(score + 3, 100);
  }

  // Document vault bonus — having docs stored is good
  if (documents.length >= 3) {
    score = Math.min(score + 2, 100);
    factors.push({ type: "success", text: `${documents.length} documents secured` });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const status =
    score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs attention" : "Critical";

  return { score, status, factors };
}

/**
 * Build unified Life Stream™ events from tasks + documents.
 * Chronological river of everything happening in your life.
 */
export function buildLifeStream(tasks, documents, daysAhead = 30) {
  const events = [];

  tasks
    .filter((t) => !t.completed)
    .forEach((t) => {
      const days = daysUntil(t.dueDate);
      if (days <= daysAhead) {
        events.push({
          id: t.id,
          type: "task",
          date: t.dueDate,
          days,
          title: t.title,
          subtitle: t.category,
          amount: t.amount,
          urgency: days < 0 ? "overdue" : days === 0 ? "today" : days <= 3 ? "soon" : "normal",
        });
      }
    });

  documents
    .filter((d) => d.expiryDate)
    .forEach((d) => {
      const days = daysUntil(d.expiryDate);
      if (days >= 0 && days <= daysAhead) {
        events.push({
          id: d.id,
          type: "document",
          date: d.expiryDate,
          days,
          title: d.name,
          subtitle: `${d.category} expires`,
          urgency: days <= 7 ? "soon" : days <= 14 ? "warning" : "normal",
        });
      }
    });

  return events.sort((a, b) => a.days - b.days);
}
