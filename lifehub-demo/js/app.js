import { renderDocumentsTab, renderSettingsTab, renderTodayTab } from "./components/renderers.js";
import { aiService } from "./services/aiService.js";
import { notificationService } from "./services/notificationService.js";
import { store } from "./state/store.js";

const ui = {
  themeToggle: document.getElementById("themeToggle"),
  todayTab: document.getElementById("todayTab"),
  documentsTab: document.getElementById("documentsTab"),
  settingsTab: document.getElementById("settingsTab"),
  tabButtons: [...document.querySelectorAll(".tab-button")],
  onboardingModal: document.getElementById("onboardingModal"),
  completeOnboardingBtn: document.getElementById("completeOnboardingBtn"),
  toast: document.getElementById("toast")
};

function init() {
  applyTheme();
  render();
  wireGlobalEvents();
  toggleOnboarding();
}

function render() {
  ui.todayTab.innerHTML = renderTodayTab(store.state);
  ui.documentsTab.innerHTML = renderDocumentsTab(store.state);
  ui.settingsTab.innerHTML = renderSettingsTab(store.state, notificationService.scheduled.length);
  updateTabVisibility();
  wireDynamicEvents();
}

function wireGlobalEvents() {
  ui.themeToggle.addEventListener("click", () => {
    const nextTheme = store.state.theme === "dark" ? "light" : "dark";
    store.setTheme(nextTheme);
    applyTheme();
    render();
  });

  ui.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      store.setActiveTab(button.dataset.tab);
      render();
    });
  });

  ui.completeOnboardingBtn.addEventListener("click", () => {
    store.completeOnboarding();
    toggleOnboarding();
    toast("Welcome! Start by adding today’s first task.");
  });
}

function wireDynamicEvents() {
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(taskForm);
      const title = String(form.get("title") || "").trim();
      const category = String(form.get("category") || "Other");
      const dueDate = String(form.get("dueDate") || "");
      const notes = String(form.get("notes") || "").trim();

      if (!title || !dueDate) {
        toast("Task title and date are required.");
        return;
      }

      store.addTask({
        id: `task-${generateId()}`,
        title,
        category,
        dueAt: new Date(dueDate).toISOString(),
        notes,
        completed: false
      });

      taskForm.reset();
      toast("Task added to Today.");
      render();
    });
  }

  const documentForm = document.getElementById("documentForm");
  if (documentForm) {
    documentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(documentForm);
      const name = String(form.get("name") || "").trim();
      const type = String(form.get("type") || "Other");
      if (!name) {
        toast("Document name is required.");
        return;
      }

      toast("Analyzing document...");
      const extracted = await aiService.extractDocumentInsights(name);
      const summary = await aiService.summarizeDocument(name);

      store.addDocument({
        id: `doc-${generateId()}`,
        name,
        type,
        uploadedAt: new Date().toISOString(),
        extracted,
        summary
      });

      documentForm.reset();
      toast("Document saved with AI summary.");
      render();
    });
  }

  document.querySelectorAll('[data-action="complete-task"]').forEach((button) => {
    button.addEventListener("click", () => {
      store.toggleTask(button.dataset.id);
      toast("Task completed.");
      render();
    });
  });

  document.querySelectorAll('[data-action="notify-task"]').forEach((button) => {
    button.addEventListener("click", () => {
      const task = store.state.tasks.find((item) => item.id === button.dataset.id);
      if (!task) {
        return;
      }
      const message = notificationService.scheduleTaskReminder(task);
      toast(message);
      render();
    });
  });

  const settingsThemeToggle = document.getElementById("settingsThemeToggle");
  if (settingsThemeToggle) {
    settingsThemeToggle.addEventListener("click", () => {
      const nextTheme = store.state.theme === "dark" ? "light" : "dark";
      store.setTheme(nextTheme);
      applyTheme();
      render();
    });
  }
}

function applyTheme() {
  document.body.classList.toggle("dark", store.state.theme === "dark");
  ui.themeToggle.textContent = store.state.theme === "dark" ? "☀️" : "🌙";
}

function updateTabVisibility() {
  const tabs = {
    today: ui.todayTab,
    documents: ui.documentsTab,
    settings: ui.settingsTab
  };
  Object.entries(tabs).forEach(([name, element]) => {
    element.classList.toggle("active", name === store.state.activeTab);
  });

  ui.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === store.state.activeTab);
  });
}

function toggleOnboarding() {
  ui.onboardingModal.classList.toggle("hidden", store.state.onboardingComplete);
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove("hidden");
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => {
    ui.toast.classList.add("hidden");
  }, 2200);
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

init();
