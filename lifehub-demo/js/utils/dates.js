// ============================================================================
// Date helpers
// ----------------------------------------------------------------------------
// All date logic (urgency, friendly labels, formatting) lives here so the rest
// of the app never has to reason about milliseconds or timezones directly.
// ============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/** Strip time so we can compare calendar days. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole-day difference between a due date and today (negative = overdue). */
export function daysUntil(dueDate) {
  if (!dueDate) return Infinity;
  const diff = startOfDay(dueDate).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / DAY_MS);
}

/**
 * Urgency bucket used for sorting + coloring on the Today screen.
 * @returns {'overdue'|'today'|'soon'|'upcoming'|'none'}
 */
export function urgency(dueDate) {
  if (!dueDate) return 'none';
  const d = daysUntil(dueDate);
  if (d < 0) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 3) return 'soon';
  return 'upcoming';
}

/** Human-friendly relative label, e.g. "Today", "In 2 days", "3 days ago". */
export function relativeLabel(dueDate) {
  if (!dueDate) return 'No date';
  const d = daysUntil(dueDate);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d < 0) return `${Math.abs(d)} days overdue`;
  if (d <= 7) return `In ${d} days`;
  return formatDate(dueDate);
}

/** e.g. "Aug 12" or "Aug 12, 2027" when the year differs from now. */
export function formatDate(date) {
  const d = new Date(date);
  const opts = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}

/** Long form date, e.g. "Monday, August 3". */
export function formatLongDate(date = new Date()) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

/** Return an ISO yyyy-mm-dd string offset from today (used by sample data). */
export function isoDaysFromNow(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Greeting based on the current hour. */
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
