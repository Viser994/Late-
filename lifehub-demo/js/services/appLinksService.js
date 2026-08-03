/**
 * App Links Service — deep links to native phone apps.
 *
 * Uses URL schemes (tel:, mailto:, sms:) and platform-specific
 * intents to open Calendar, Camera, Maps, Photos, and more.
 */

import { showToast } from "../utils/helpers.js";

/** Available phone app integrations */
export const PHONE_APPS = [
  {
    id: "calendar",
    name: "Calendar",
    emoji: "📅",
    color: "#ef4444",
    desc: "Add events & view schedule",
    getUrl: () => {
      if (isIOS()) return "calshow:";
      if (isAndroid()) return "content://com.android.calendar/time/";
      return "https://calendar.google.com";
    },
  },
  {
    id: "phone",
    name: "Phone",
    emoji: "📞",
    color: "#22c55e",
    desc: "Make a call",
    getUrl: () => "tel:",
  },
  {
    id: "messages",
    name: "Messages",
    emoji: "💬",
    color: "#3b82f6",
    desc: "Send a text",
    getUrl: () => "sms:",
  },
  {
    id: "mail",
    name: "Mail",
    emoji: "✉️",
    color: "#6366f1",
    desc: "Compose email",
    getUrl: (settings) => {
      const email = settings?.userEmail;
      return email ? `mailto:${email}` : "mailto:";
    },
  },
  {
    id: "camera",
    name: "Camera",
    emoji: "📷",
    color: "#8b5cf6",
    desc: "Scan a document",
    action: "camera",
  },
  {
    id: "maps",
    name: "Maps",
    emoji: "🗺️",
    color: "#14b8a6",
    desc: "Find locations",
    getUrl: () => {
      if (isIOS()) return "maps://";
      if (isAndroid()) return "geo:0,0?q=";
      return "https://maps.google.com";
    },
  },
  {
    id: "photos",
    name: "Photos",
    emoji: "🖼️",
    color: "#ec4899",
    desc: "Browse gallery",
    action: "photos",
  },
  {
    id: "files",
    name: "Files",
    emoji: "📁",
    color: "#f59e0b",
    desc: "Open file manager",
    action: "files",
  },
  {
    id: "notes",
    name: "Notes",
    emoji: "📝",
    color: "#fbbf24",
    desc: "Quick notes",
    getUrl: () => (isIOS() ? "mobilenotes://" : "https://keep.google.com"),
  },
  {
    id: "reminders",
    name: "Reminders",
    emoji: "⏰",
    color: "#f97316",
    desc: "Set a reminder",
    getUrl: () => (isIOS() ? "x-apple-reminderkit://" : "https://calendar.google.com/calendar/r/reminders"),
  },
  {
    id: "wallet",
    name: "Wallet",
    emoji: "💳",
    color: "#0ea5e9",
    desc: "Cards & passes",
    getUrl: () => (isIOS() ? "shoebox://" : null),
    hidden: !isIOS(),
  },
  {
    id: "health",
    name: "Health",
    emoji: "❤️",
    color: "#ef4444",
    desc: "Health records",
    getUrl: () => (isIOS() ? "x-apple-health://" : null),
    hidden: !isIOS(),
  },
];

/** Default enabled apps shown on Home */
export const DEFAULT_CONNECTED_APPS = [
  "calendar", "phone", "messages", "mail", "camera", "maps", "photos", "files",
];

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

/**
 * Open a native phone app by ID.
 * @param {string} appId
 * @param {object} settings - user settings for context
 * @param {object} callbacks - { onCamera, onPhotos, onFiles }
 */
export function openPhoneApp(appId, settings = {}, callbacks = {}) {
  const app = PHONE_APPS.find((a) => a.id === appId);
  if (!app) return;

  // Custom actions that need file inputs or special handling
  if (app.action === "camera") {
    callbacks.onCamera?.();
    return;
  }
  if (app.action === "photos") {
    callbacks.onPhotos?.();
    return;
  }
  if (app.action === "files") {
    callbacks.onFiles?.();
    return;
  }

  const url = app.getUrl?.(settings);
  if (!url) {
    showToast(`${app.name} is not available on this device`, "warning");
    return;
  }

  // tel:/sms:/mailto: with empty target still opens the app
  window.location.href = url;
}

/**
 * Add a task to the phone's calendar app.
 * Uses Google Calendar URL (works on all platforms) or ICS download for Apple.
 */
export function addTaskToCalendar(task) {
  const title = encodeURIComponent(task.title);
  const notes = encodeURIComponent(task.notes || "");
  const date = new Date(task.dueDate);

  // All-day event format for Google Calendar
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}${m}${d}`;

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${notes}`;

  if (isIOS()) {
    // Also try native calendar, fall back to Google
    const ics = buildICS(task);
    downloadICS(ics, `${task.title}.ics`);
    showToast("Opening Calendar…", "success");
  }

  window.open(gcalUrl, "_blank");
}

/** Build ICS file content for calendar import */
function buildICS(task) {
  const date = new Date(task.dueDate);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dt = `${y}${m}${day}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dt}`,
    `DTEND;VALUE=DATE:${dt}`,
    `SUMMARY:${task.title}`,
    task.notes ? `DESCRIPTION:${task.notes}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function downloadICS(content, filename) {
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open maps with a search query */
export function openMaps(query = "") {
  const encoded = encodeURIComponent(query);
  let url;
  if (isIOS()) url = `maps://maps.apple.com/?q=${encoded}`;
  else if (isAndroid()) url = `geo:0,0?q=${encoded}`;
  else url = `https://maps.google.com/maps?q=${encoded}`;

  window.open(url, "_blank");
}

/** Get visible apps based on settings and platform */
export function getEnabledApps(settings) {
  const enabled = settings.connectedApps || DEFAULT_CONNECTED_APPS;
  return PHONE_APPS.filter((app) => !app.hidden && enabled.includes(app.id));
}

/** Create hidden file input for camera / photos / files */
export function createFileInput({ capture = false, accept = "*/*", onSelect }) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  if (capture) input.setAttribute("capture", "environment");
  input.style.display = "none";
  document.body.appendChild(input);

  input.addEventListener("change", () => {
    if (input.files?.[0]) onSelect?.(input.files[0]);
    input.remove();
  });

  input.click();
}
