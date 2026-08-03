/**
 * Notification Service — manages browser push notifications
 * for upcoming due dates and reminders.
 *
 * On native mobile builds, replace with expo-notifications
 * or platform-specific notification APIs.
 */

import { daysUntil, formatDate } from "../utils/dates.js";
import { showToast } from "../utils/helpers.js";

let permissionGranted = false;

/** Request notification permission from the user */
export async function requestPermission() {
  if (!("Notification" in window)) {
    showToast("Notifications not supported in this browser", "warning");
    return false;
  }

  if (Notification.permission === "granted") {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission !== "denied") {
    const result = await Notification.requestPermission();
    permissionGranted = result === "granted";
    return permissionGranted;
  }

  return false;
}

/** Check current permission status */
export function hasPermission() {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Schedule notifications for upcoming tasks.
 * In this MVP, we check on app load and show immediate
 * notifications for items due today or overdue.
 */
export function checkAndNotify(tasks, enabled = true) {
  if (!enabled || !hasPermission()) return;

  const urgent = tasks.filter((t) => {
    if (t.completed) return false;
    const days = daysUntil(t.dueDate);
    return days <= 0;
  });

  urgent.forEach((task) => {
    const days = daysUntil(task.dueDate);
    const body =
      days < 0
        ? `Overdue by ${Math.abs(days)} day(s)`
        : days === 0
          ? "Due today!"
          : `Due ${formatDate(task.dueDate)}`;

    // Avoid duplicate notifications in same session
    const key = `notified_${task.id}_${days}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    new Notification(`LifeHub: ${task.title}`, {
      body,
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234F6EF7' rx='20' width='100' height='100'/><text x='50' y='65' text-anchor='middle' fill='white' font-size='50' font-family='sans-serif'>L</text></svg>",
      tag: task.id,
    });
  });
}

/**
 * Show an in-app reminder toast for near-term tasks.
 * Works even without notification permission.
 */
export function showInAppReminders(tasks) {
  const dueToday = tasks.filter(
    (t) => !t.completed && daysUntil(t.dueDate) === 0
  );

  if (dueToday.length > 0) {
    const count = dueToday.length;
    showToast(
      `You have ${count} task${count > 1 ? "s" : ""} due today`,
      "warning"
    );
  }
}

/**
 * Send a test notification (from Settings).
 */
export async function sendTestNotification() {
  const granted = await requestPermission();
  if (!granted) {
    showToast("Please enable notifications in your browser settings", "warning");
    return;
  }

  new Notification("LifeHub", {
    body: "Notifications are working! You'll be reminded about upcoming deadlines.",
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234F6EF7' rx='20' width='100' height='100'/><text x='50' y='65' text-anchor='middle' fill='white' font-size='50' font-family='sans-serif'>L</text></svg>",
  });

  showToast("Test notification sent!", "success");
}
