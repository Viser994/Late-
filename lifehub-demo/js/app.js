/**
 * LifeHub — main application entry point.
 * Wires together onboarding, tabs, services, and state management.
 */

import { loadState, saveSettings } from "./services/storageService.js";
import { checkAndNotify, showInAppReminders } from "./services/notificationService.js";
import { renderOnboarding } from "./components/onboarding.js";
import { renderTodayTab, showAddTaskModal } from "./components/todayTab.js";
import { renderDocumentsTab } from "./components/documentsTab.js";
import { renderSettingsTab, applyTheme } from "./components/settingsTab.js";

/** Current app state */
let state = loadState();
let activeTab = "today";

/** DOM references */
const appEl = document.getElementById("app");

/** Initialize the application */
function init() {
  applyTheme(state.settings.darkMode);

  if (!state.settings.onboardingComplete) {
    renderOnboarding(appEl, { onComplete: finishOnboarding });
  } else {
    renderApp();
  }
}

/** Complete onboarding and show main app */
function finishOnboarding() {
  state.settings.onboardingComplete = true;
  saveSettings(state.settings);

  if (state.settings.notifications) {
    import("./services/notificationService.js").then(({ requestPermission }) => {
      requestPermission();
    });
  }

  renderApp();
  showInAppReminders(state.tasks);
}

/** Render the main app shell with tab navigation */
function renderApp() {
  appEl.innerHTML = `
    <div id="tab-content"></div>
    <nav class="tab-bar" role="navigation" aria-label="Main navigation">
      <button class="tab-bar__item ${activeTab === "today" ? "tab-bar__item--active" : ""}" data-tab="today">
        <span class="tab-bar__icon">📋</span>
        <span>Today</span>
      </button>
      <button class="tab-bar__item ${activeTab === "documents" ? "tab-bar__item--active" : ""}" data-tab="documents">
        <span class="tab-bar__icon">📁</span>
        <span>Documents</span>
      </button>
      <button class="tab-bar__item ${activeTab === "settings" ? "tab-bar__item--active" : ""}" data-tab="settings">
        <span class="tab-bar__icon">⚙️</span>
        <span>Settings</span>
      </button>
    </nav>
  `;

  appEl.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderApp();
    });
  });

  renderActiveTab();

  // Check notifications on load
  if (state.settings.notifications) {
    checkAndNotify(state.tasks, true);
    showInAppReminders(state.tasks);
  }
}

/** Render the currently active tab */
function renderActiveTab() {
  const tabContent = document.getElementById("tab-content");
  const handlers = { onUpdate: handleUpdate, onReset: handleReset };

  switch (activeTab) {
    case "today":
      renderTodayTab(tabContent, state, handlers);
      break;
    case "documents":
      renderDocumentsTab(tabContent, state, handlers);
      break;
    case "settings":
      renderSettingsTab(tabContent, state, { ...handlers, onReset: handleReset });
      break;
  }
}

/** Handle state updates from child components */
function handleUpdate(newState) {
  state = newState;
  renderActiveTab();

  if (state.settings.notifications) {
    checkAndNotify(state.tasks, true);
  }
}

/** Handle full data reset */
function handleReset(freshState) {
  state = freshState;
  activeTab = "today";
  renderApp();
}

// Boot
document.addEventListener("DOMContentLoaded", init);

// Expose for FAB on documents tab (global quick-add)
window.LifeHub = { showAddTask: () => showAddTaskModal(state, handleUpdate) };
