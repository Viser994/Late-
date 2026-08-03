import { create } from 'zustand';
import { Task, Priority, ReminderType, TaskStatus } from '../types';
import { DUMMY_TASKS } from '../data/dummy';
import { storage } from '../services/storage';
import { scheduleTaskNotification, cancelTaskNotification } from '../services/notifications';
import { format } from 'date-fns';

interface TaskStore {
  tasks: Task[];
  isLoaded: boolean;

  // Lifecycle
  loadTasks: () => Promise<void>;
  persistTasks: () => Promise<void>;

  // CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, newDueDate: Date) => Promise<void>;

  // Selectors (derived — computed on demand)
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
}

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoaded: false,

  loadTasks: async () => {
    const stored = await storage.tasks.get();
    if (stored && stored.length > 0) {
      set({ tasks: stored as Task[], isLoaded: true });
    } else {
      set({ tasks: DUMMY_TASKS, isLoaded: true });
      await storage.tasks.set(DUMMY_TASKS);
    }
  },

  persistTasks: async () => {
    await storage.tasks.set(get().tasks);
  },

  addTask: async (taskData) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const notifId = await scheduleTaskNotification(newTask).catch(() => null);
    if (notifId) newTask.notificationId = notifId;

    set((s) => ({ tasks: [newTask, ...s.tasks] }));
    await get().persistTasks();
  },

  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
      ),
    }));
    await get().persistTasks();
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await cancelTaskNotification(task.notificationId).catch(() => null);
    }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    await get().persistTasks();
  },

  completeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await cancelTaskNotification(task.notificationId).catch(() => null);
    }
    await get().updateTask(id, { status: 'completed', notificationId: undefined });
  },

  snoozeTask: async (id, newDueDate) => {
    const task = get().tasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await cancelTaskNotification(task.notificationId).catch(() => null);
    }
    await get().updateTask(id, {
      status: 'pending',
      dueDate: newDueDate.toISOString(),
      notificationId: undefined,
    });
    // Re-schedule with new date
    const updated = get().tasks.find((t) => t.id === id);
    if (updated) {
      const notifId = await scheduleTaskNotification(updated).catch(() => null);
      if (notifId) await get().updateTask(id, { notificationId: notifId });
    }
  },

  getTodayTasks: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get()
      .tasks.filter((t) => {
        if (t.status === 'completed') return false;
        const due = format(new Date(t.dueDate), 'yyyy-MM-dd');
        return due <= today;
      })
      .sort(sortByPriority);
  },

  getUpcomingTasks: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get()
      .tasks.filter((t) => {
        if (t.status === 'completed') return false;
        const due = format(new Date(t.dueDate), 'yyyy-MM-dd');
        return due > today;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  getOverdueTasks: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get()
      .tasks.filter((t) => {
        if (t.status === 'completed') return false;
        const due = format(new Date(t.dueDate), 'yyyy-MM-dd');
        return due < today;
      })
      .sort(sortByPriority);
  },

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
}));

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function sortByPriority(a: Task, b: Task): number {
  const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (pDiff !== 0) return pDiff;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}
