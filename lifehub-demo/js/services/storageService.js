/**
 * Local storage persistence layer.
 * Manages tasks, documents, and user settings.
 */

import { DUMMY_TASKS, DUMMY_DOCUMENTS, DEFAULT_SETTINGS } from "../data/dummyData.js";
import { generateId } from "../utils/helpers.js";

const KEYS = {
  tasks: "lifehub_tasks",
  documents: "lifehub_documents",
  settings: "lifehub_settings",
};

/** Load all app state from localStorage */
export function loadState() {
  const settings = loadSettings();
  const tasks = loadTasks();
  const documents = loadDocuments();

  return { tasks, documents, settings };
}

/** Load settings, falling back to defaults */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Save settings */
export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

/** Load tasks — seed with dummy data on first launch */
export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEYS.tasks);
    if (raw) return JSON.parse(raw);
    saveTasks(DUMMY_TASKS);
    return [...DUMMY_TASKS];
  } catch {
    return [...DUMMY_TASKS];
  }
}

/** Save tasks array */
export function saveTasks(tasks) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
}

/** Load documents — seed with dummy data on first launch */
export function loadDocuments() {
  try {
    const raw = localStorage.getItem(KEYS.documents);
    if (raw) return JSON.parse(raw);
    saveDocuments(DUMMY_DOCUMENTS);
    return [...DUMMY_DOCUMENTS];
  } catch {
    return [...DUMMY_DOCUMENTS];
  }
}

/** Save documents array */
export function saveDocuments(documents) {
  localStorage.setItem(KEYS.documents, JSON.stringify(documents));
}

/** Add a new task */
export function addTask(tasks, taskData) {
  const task = {
    id: generateId("task"),
    completed: false,
    createdAt: new Date().toISOString(),
    ...taskData,
  };
  const updated = [task, ...tasks];
  saveTasks(updated);
  return updated;
}

/** Toggle task completion */
export function toggleTask(tasks, taskId) {
  const updated = tasks.map((t) =>
    t.id === taskId ? { ...t, completed: !t.completed } : t
  );
  saveTasks(updated);
  return updated;
}

/** Delete a task */
export function deleteTask(tasks, taskId) {
  const updated = tasks.filter((t) => t.id !== taskId);
  saveTasks(updated);
  return updated;
}

/** Add a new document */
export function addDocument(documents, docData) {
  const doc = {
    id: generateId("doc"),
    uploadedAt: new Date().toISOString(),
    tags: [],
    aiSummary: [],
    extractedDates: [],
    extractedAmounts: [],
    ...docData,
  };
  const updated = [doc, ...documents];
  saveDocuments(updated);
  return updated;
}

/** Delete a document */
export function deleteDocument(documents, docId) {
  const updated = documents.filter((d) => d.id !== docId);
  saveDocuments(updated);
  return updated;
}

/** Update document with AI extraction results */
export function updateDocument(documents, docId, updates) {
  const updated = documents.map((d) =>
    d.id === docId ? { ...d, ...updates } : d
  );
  saveDocuments(updated);
  return updated;
}

/** Reset all data to defaults (for demo purposes) */
export function resetAllData() {
  localStorage.removeItem(KEYS.tasks);
  localStorage.removeItem(KEYS.documents);
  localStorage.removeItem(KEYS.settings);
}
