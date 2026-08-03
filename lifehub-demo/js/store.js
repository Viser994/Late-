// ============================================================================
// Store — single source of truth
// ----------------------------------------------------------------------------
// A tiny observable store. Components subscribe to changes and re-render; any
// mutation goes through an action so persistence + notifications stay in sync.
// State is saved to localStorage so the user's data survives reloads.
// ============================================================================

import { sampleTasks, sampleDocuments } from './data/sampleData.js';

const STORAGE_KEY = 'lifehub.state.v1';

/** Default state used on the very first launch (or after a reset). */
function defaultState() {
  return {
    onboarded: false,
    theme: 'system',            // 'light' | 'dark' | 'system'
    notificationsEnabled: true,
    userName: 'Jordan',
    tasks: structuredClone(sampleTasks),
    documents: structuredClone(sampleDocuments),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    // Merge so newly-added default keys appear for returning users.
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

class Store {
  constructor() {
    this.state = load();
    this.listeners = new Set();
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Apply a partial update, persist, and notify subscribers. */
  set(patch) {
    this.state = { ...this.state, ...patch };
    this.persist();
    this.emit();
  }

  emit() { this.listeners.forEach((fn) => fn(this.state)); }

  persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* private mode */ }
  }

  // --- Tasks -----------------------------------------------------------------
  addTask(task) {
    const record = {
      id: `t_${Date.now()}`,
      done: false,
      createdAt: new Date().toISOString().slice(0, 10),
      amount: null,
      note: '',
      ...task,
    };
    this.set({ tasks: [record, ...this.state.tasks] });
    return record;
  }

  toggleTask(id) {
    this.set({
      tasks: this.state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });
  }

  removeTask(id) {
    this.set({ tasks: this.state.tasks.filter((t) => t.id !== id) });
  }

  // --- Documents -------------------------------------------------------------
  addDocument(doc) {
    const record = {
      id: `d_${Date.now()}`,
      addedAt: new Date().toISOString().slice(0, 10),
      summary: null,
      extracted: null,
      note: '',
      ...doc,
    };
    this.set({ documents: [record, ...this.state.documents] });
    return record;
  }

  updateDocument(id, patch) {
    this.set({
      documents: this.state.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  }

  removeDocument(id) {
    this.set({ documents: this.state.documents.filter((d) => d.id !== id) });
  }

  // --- Settings --------------------------------------------------------------
  completeOnboarding(name) {
    this.set({ onboarded: true, userName: name || this.state.userName });
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = defaultState();
    this.persist();
    this.emit();
  }
}

export const store = new Store();
