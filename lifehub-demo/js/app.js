/**
 * LifeHub — main application entry point.
 */

import { loadState, saveSettings } from "./services/storageService.js";
import { checkAndNotify, showInAppReminders } from "./services/notificationService.js";
import { renderOnboarding } from "./components/onboarding.js";
import { renderHomeTab } from "./components/homeTab.js";
import { renderTodayTab, showAddTaskModal } from "./components/todayTab.js";
import { renderDocumentsTab } from "./components/documentsTab.js";
import { renderSettingsTab, applyTheme } from "./components/settingsTab.js";
import { icon } from "./components/icons.js";

let state = loadState();
let activeTab = "home";
const appEl = document.getElementById("app");

const TABS = [
  { id: "home", label: "Home", iconName: "home" },
  { id: "today", label: "Today", iconName: "today" },
  { id: "documents", label: "Vault", iconName: "vault" },
  { id: "settings", label: "Profile", iconName: "profile" },
];

function init() {
  applyTheme(state.settings.darkMode);

  if (!state.settings.onboardingComplete) {
    renderOnboarding(appEl, { onComplete: finishOnboarding });
  } else {
    renderApp();
  }
}

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

function renderApp() {
  appEl.innerHTML = `
    <div id="tab-content"></div>
    <nav class="tab-bar" role="navigation" aria-label="Main navigation">
      ${TABS.map(
        (t) => `
        <button class="tab-bar__item ${activeTab === t.id ? "tab-bar__item--active" : ""}" data-tab="${t.id}">
          <span class="tab-bar__icon">${icon(t.iconName, "icon")}</span>
          <span>${t.label}</span>
        </button>`
      ).join("")}
    </nav>
  `;

  appEl.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      renderApp();
    });
  });

  renderActiveTab();

  if (state.settings.notifications) {
    checkAndNotify(state.tasks, true);
    showInAppReminders(state.tasks);
  }
}

function renderActiveTab() {
  const tabContent = document.getElementById("tab-content");
  const handlers = {
    onUpdate: handleUpdate,
    onReset: handleReset,
    onNavigate: navigateTo,
  };

  switch (activeTab) {
    case "home":
      renderHomeTab(tabContent, state, handlers);
      break;
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

function navigateTo(tab) {
  activeTab = tab;
  renderApp();
}

function handleUpdate(newState) {
  state = newState;
  renderActiveTab();

  if (state.settings.notifications) {
    checkAndNotify(state.tasks, true);
  }
}

function handleReset(freshState) {
  state = freshState;
  activeTab = "home";
  renderApp();
}

document.addEventListener("DOMContentLoaded", init);
window.LifeHub = { showAddTask: () => showAddTaskModal(state, handleUpdate) };
