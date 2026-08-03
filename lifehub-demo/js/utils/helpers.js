/**
 * General helper utilities.
 */

/** Generate a unique ID */
export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Escape HTML to prevent XSS */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Category display labels */
export const CATEGORY_LABELS = {
  bills: "Bills",
  insurance: "Insurance",
  appointments: "Appointments",
  work: "Work",
  warranties: "Warranties",
  health: "Health",
  reminders: "Reminders",
  other: "Other",
};

/** Document category labels and icons */
export const DOC_CATEGORIES = {
  all: { label: "All", icon: "📁" },
  id: { label: "IDs", icon: "🪪" },
  insurance: { label: "Insurance", icon: "🏥" },
  warranty: { label: "Warranties", icon: "🛡️" },
  travel: { label: "Travel", icon: "✈️" },
  receipt: { label: "Receipts", icon: "🧾" },
  other: { label: "Other", icon: "📄" },
};

/** Document type icons */
export const DOC_TYPE_ICONS = {
  pdf: "📕",
  image: "🖼️",
  screenshot: "📸",
  other: "📄",
};

/** Task priority badge class */
export function priorityBadge(task) {
  if (task.completed) return "done";
  const days = Math.ceil(
    (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0 || task.priority === "urgent") return "urgent";
  if (days <= 2 || task.priority === "high") return "soon";
  return "category";
}

/** Debounce function calls */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Show a toast notification */
export function showToast(message, type = "info") {
  const container =
    document.querySelector(".toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function createToastContainer() {
  const el = document.createElement("div");
  el.className = "toast-container";
  document.body.appendChild(el);
  return el;
}
