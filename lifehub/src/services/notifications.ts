/**
 * Notification Service
 *
 * Wraps Expo Notifications to schedule, update, and cancel local push
 * notifications for task due dates and bill reminders.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS === 'web') return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * Schedule a local notification for a task.
 * @param task          The task to notify about
 * @param leadHours     How many hours before the due date to fire (default 24h)
 * @returns             Expo notification identifier, or null if not possible
 */
export async function scheduleTaskNotification(
  task: Task,
  leadHours = 24,
): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const dueDate = new Date(task.dueDate);
  const triggerDate = new Date(dueDate.getTime() - leadHours * 60 * 60 * 1000);

  if (triggerDate <= new Date()) {
    // Already past — fire immediately for testing, or skip
    return null;
  }

  const body = buildNotificationBody(task);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${task.title}`,
      body,
      data: { taskId: task.id, type: task.type },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });

  return id;
}

/**
 * Cancel a previously scheduled notification.
 */
export async function cancelTaskNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all currently scheduled notifications.
 */
export async function getAllScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ─── Immediate Alerts ─────────────────────────────────────────────────────────

/**
 * Send an instant test notification.
 */
export async function sendTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ LifeHub Notifications Active',
      body: "You'll receive reminders for upcoming tasks and bills.",
      sound: true,
    },
    trigger: null, // fire immediately
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNotificationBody(task: Task): string {
  const due = new Date(task.dueDate);
  const dateStr = due.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (task.type === 'bill' && task.amount) {
    return `$${task.amount.toFixed(2)} due on ${dateStr}`;
  }
  if (task.type === 'appointment') {
    return `Scheduled for ${dateStr}`;
  }
  if (task.type === 'renewal') {
    return `Renewal deadline: ${dateStr}`;
  }
  return `Due on ${dateStr}`;
}
