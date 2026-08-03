/**
 * Placeholder notification service.
 * Swap this with push/local notification APIs in production.
 */
export const notificationService = {
  scheduled: [],

  scheduleTaskReminder(task) {
    this.scheduled.push({
      id: `note-${task.id}`,
      text: `Reminder set for: ${task.title}`
    });
    return `Reminder scheduled for "${task.title}"`;
  }
};
