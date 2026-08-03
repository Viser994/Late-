import { sampleDocuments, sampleTasks } from "../data/sampleData.js";
import { isUrgent } from "../utils/formatters.js";

const STORAGE_KEY = "lifehub-state-v1";

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function defaultState() {
  return {
    onboardingComplete: false,
    theme: "light",
    activeTab: "today",
    tasks: clone(sampleTasks),
    documents: clone(sampleDocuments)
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed
    };
  } catch {
    return defaultState();
  }
}

export const store = {
  state: loadState(),

  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  setTheme(theme) {
    this.state.theme = theme;
    this.persist();
  },

  setActiveTab(tab) {
    this.state.activeTab = tab;
    this.persist();
  },

  completeOnboarding() {
    this.state.onboardingComplete = true;
    this.persist();
  },

  addTask(task) {
    this.state.tasks.unshift(task);
    this.persist();
  },

  toggleTask(taskId) {
    const task = this.state.tasks.find((item) => item.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.persist();
    }
  },

  addDocument(document) {
    this.state.documents.unshift(document);
    this.persist();
  },

  getUrgentOpenTasks() {
    return this.state.tasks.filter((task) => !task.completed && isUrgent(task.dueAt));
  },

  getOpenTasksSorted() {
    return [...this.state.tasks]
      .filter((task) => !task.completed)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  }
};
