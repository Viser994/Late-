// ============================================================================
// Notification Service
// ----------------------------------------------------------------------------
// Wraps the browser Notifications API and provides an in-app fallback (toasts)
// so reminders work everywhere. In a production app this is where you'd also
// register a Service Worker + Push subscription for background notifications.
// The rest of the app only calls: requestPermission(), notifyDueSoon(tasks),
// and showToast(message).
// ============================================================================

import { daysUntil } from '../utils/dates.js';

const supported = typeof Notification !== 'undefined';

export const notificationService = {
  supported,

  /** Current permission state: 'granted' | 'denied' | 'default' | 'unsupported'. */
  get permission() {
    return supported ? Notification.permission : 'unsupported';
  },

  /** Ask the OS/browser for permission to show notifications. */
  async requestPermission() {
    if (!supported) return 'unsupported';
    if (Notification.permission !== 'default') return Notification.permission;
    try { return await Notification.requestPermission(); } catch { return 'denied'; }
  },

  /** Fire a single OS notification (falls back silently if not permitted). */
  push(title, body) {
    if (supported && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: undefined }); return true; } catch { /* noop */ }
    }
    return false;
  },

  /**
   * Scan tasks and surface anything due within `withinDays`. Returns the list
   * of tasks that triggered a reminder so the UI can also show a summary.
   * @param {Array} tasks
   * @param {number} withinDays
   */
  notifyDueSoon(tasks, withinDays = 3) {
    const due = tasks.filter((t) => !t.done && daysUntil(t.dueDate) <= withinDays);
    if (!due.length) return [];
    const soonest = due[0];
    const extra = due.length > 1 ? ` (+${due.length - 1} more)` : '';
    this.push('LifeHub reminder', `${soonest.title} is due soon${extra}.`);
    return due;
  },

  /**
   * Lightweight in-app toast. `mount` is the toast container element.
   * @param {HTMLElement} mount
   * @param {string} message
   * @param {string} [iconSvg] optional inline SVG markup
   */
  showToast(mount, message, iconSvg = '') {
    if (!mount) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    mount.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity .3s ease, transform .3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  },
};
