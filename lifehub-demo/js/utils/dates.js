/**
 * Date formatting and comparison utilities.
 */

/** Format ISO date to readable string */
export function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format time for display */
export function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Days until a given date (negative = overdue) */
export function daysUntil(isoString) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(isoString);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

/** Human-readable due label */
export function dueLabel(isoString) {
  const days = daysUntil(isoString);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return formatDate(isoString);
}

/** Check if date is today */
export function isToday(isoString) {
  return daysUntil(isoString) === 0;
}

/** Check if date is within N days */
export function isWithinDays(isoString, n) {
  const days = daysUntil(isoString);
  return days >= 0 && days <= n;
}

/** Start of today as ISO string */
export function todayISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/** Sort tasks by urgency: overdue first, then today, then soon */
export function sortByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const daysA = daysUntil(a.dueDate);
    const daysB = daysUntil(b.dueDate);
    return daysA - daysB;
  });
}

/** Greeting based on time of day */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Format currency */
export function formatCurrency(amount) {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
