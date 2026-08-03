/**
 * App Links UI — quick-launch tiles to phone apps.
 */

import { getEnabledApps, openPhoneApp, DEFAULT_CONNECTED_APPS, PHONE_APPS } from "../services/appLinksService.js";
import { escapeHtml, showToast } from "../utils/helpers.js";
import { saveSettings } from "../services/storageService.js";
import { icon } from "./icons.js";

/**
 * Render horizontal scrollable app link tiles for Home screen.
 */
export function renderAppLinksSection(settings, callbacks = {}) {
  const apps = getEnabledApps(settings);

  if (apps.length === 0) return "";

  return `
    <div class="app-links">
      <div class="section-header">
        <h2 class="section-header__title">Your Phone Apps</h2>
        <button class="app-links__edit" id="edit-app-links">Edit</button>
      </div>
      <div class="app-links__scroll">
        ${apps.map((app) => `
          <button class="app-link-tile" data-app-id="${app.id}" title="${escapeHtml(app.desc)}">
            <div class="app-link-tile__icon" style="background:${app.color}20;color:${app.color}">
              <span>${app.emoji}</span>
            </div>
            <span class="app-link-tile__name">${escapeHtml(app.name)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

/** Bind click events on app link tiles */
export function bindAppLinks(container, settings, callbacks = {}) {
  container.querySelectorAll(".app-link-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const appId = tile.dataset.appId;
      openPhoneApp(appId, settings, callbacks);
    });
  });

  container.querySelector("#edit-app-links")?.addEventListener("click", () => {
    callbacks.onEditApps?.();
  });
}

/**
 * Render app picker for Settings — toggle which apps appear on Home.
 */
export function renderConnectedAppsSettings(settings) {
  const enabled = settings.connectedApps || DEFAULT_CONNECTED_APPS;
  const visibleApps = PHONE_APPS.filter((a) => !a.hidden);

  return `
    <div class="settings-group">
      <div class="settings-group__title">Connected Apps</div>
      <p class="settings-group__desc">Choose which phone apps appear on your Home screen. Tapping opens the app on your device.</p>
      <div class="settings-list">
        ${visibleApps.map((app) => `
          <div class="settings-item settings-item--app" data-app-id="${app.id}">
            <div class="settings-item__left">
              <div class="settings-item__icon settings-item__icon--app" style="background:${app.color}18">${app.emoji}</div>
              <div>
                <div class="settings-item__label">${escapeHtml(app.name)}</div>
                <div class="settings-item__desc">${escapeHtml(app.desc)}</div>
              </div>
            </div>
            <div class="toggle ${enabled.includes(app.id) ? "toggle--on" : ""}" data-toggle-app="${app.id}" role="switch" aria-checked="${enabled.includes(app.id)}">
              <div class="toggle__knob"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/** Bind toggle events in settings for connected apps */
export function bindConnectedAppsSettings(container, state, onUpdate) {
  const { settings } = state;
  const enabled = [...(settings.connectedApps || DEFAULT_CONNECTED_APPS)];

  container.querySelectorAll("[data-toggle-app]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const appId = toggle.dataset.toggleApp;
      const idx = enabled.indexOf(appId);

      if (idx >= 0) enabled.splice(idx, 1);
      else enabled.push(appId);

      const newSettings = { ...settings, connectedApps: [...enabled] };
      saveSettings(newSettings);
      onUpdate({ ...state, settings: newSettings });
      showToast(idx >= 0 ? "App removed from Home" : "App added to Home", "info");
    });
  });
}

/**
 * Render quick-action buttons on a task card to open phone apps.
 */
export function renderTaskAppActions(task) {
  const actions = [];

  actions.push(`
    <button class="task-app-action" data-action="calendar" data-task-id="${task.id}" title="Add to Calendar">
      ${icon("calendar", "icon icon--xs")} Calendar
    </button>
  `);

  if (task.category === "appointments" || task.category === "health") {
    actions.push(`
      <button class="task-app-action" data-action="maps" data-task-id="${task.id}" title="Open Maps">
        🗺️ Maps
      </button>
    `);
  }

  if (task.category === "bills" && task.amount) {
    actions.push(`
      <button class="task-app-action" data-action="reminders" data-task-id="${task.id}" title="Set Reminder">
        ⏰ Remind
      </button>
    `);
  }

  return actions.length
    ? `<div class="task-app-actions">${actions.join("")}</div>`
    : "";
}

/** Bind task-level app link actions */
export function bindTaskAppActions(container, tasks, settings) {
  container.querySelectorAll(".task-app-action").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const task = tasks.find((t) => t.id === btn.dataset.taskId);
      if (!task) return;

      import("../services/appLinksService.js").then(({ addTaskToCalendar, openPhoneApp, openMaps }) => {
        switch (action) {
          case "calendar":
            addTaskToCalendar(task);
            break;
          case "maps":
            openMaps(task.notes || task.title);
            break;
          case "reminders":
            openPhoneApp("reminders", settings);
            break;
        }
      });
    });
  });
}
