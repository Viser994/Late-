/**
 * Settings tab — dark mode, notifications, profile, and data management.
 */

import { escapeHtml, showToast } from "../utils/helpers.js";
import { saveSettings, resetAllData, loadState } from "../services/storageService.js";
import { sendTestNotification, requestPermission } from "../services/notificationService.js";

/** Render the Settings tab */
export function renderSettingsTab(container, state, { onUpdate, onReset }) {
  const { settings } = state;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header__title">Profile</div>
      <div class="page-header__sub">Manage your preferences</div>
    </div>

    <div class="main">
      <div class="security-banner">
        <div class="security-banner__icon">🔒</div>
        <div class="security-banner__text">
          <strong>Your data stays on this device</strong>
          Documents and tasks are stored locally. Connect a cloud account later for backup and sync.
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Profile</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item__left">
              <div class="settings-item__icon">👤</div>
              <div>
                <div class="settings-item__label">Your Name</div>
                <div class="settings-item__desc">Shown on your Today dashboard</div>
              </div>
            </div>
          </div>
        </div>
        <input class="form-input mt-1" id="user-name" placeholder="Enter your name" value="${escapeHtml(settings.userName || "")}" />
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Appearance</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item__left">
              <div class="settings-item__icon">🌙</div>
              <div>
                <div class="settings-item__label">Dark Mode</div>
                <div class="settings-item__desc">Easier on the eyes at night</div>
              </div>
            </div>
            <div class="toggle ${settings.darkMode ? "toggle--on" : ""}" id="toggle-dark" role="switch" aria-checked="${settings.darkMode}">
              <div class="toggle__knob"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Notifications</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item__left">
              <div class="settings-item__icon">🔔</div>
              <div>
                <div class="settings-item__label">Due Date Reminders</div>
                <div class="settings-item__desc">Get notified about upcoming deadlines</div>
              </div>
            </div>
            <div class="toggle ${settings.notifications ? "toggle--on" : ""}" id="toggle-notifications" role="switch" aria-checked="${settings.notifications}">
              <div class="toggle__knob"></div>
            </div>
          </div>
        </div>
        <button class="btn btn--secondary btn--sm mt-1" id="test-notification" style="width:100%">Send Test Notification</button>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">Data</div>
        <div class="settings-list">
          <div class="settings-item" style="cursor:pointer" id="reset-data">
            <div class="settings-item__left">
              <div class="settings-item__icon">🔄</div>
              <div>
                <div class="settings-item__label">Reset Demo Data</div>
                <div class="settings-item__desc">Restore sample tasks and documents</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group__title">About</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item__left">
              <div class="settings-item__icon">ℹ️</div>
              <div>
                <div class="settings-item__label">LifeHub v1.0.0</div>
                <div class="settings-item__desc">Personal life admin — MVP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Name input
  const nameInput = container.querySelector("#user-name");
  nameInput.addEventListener(
    "change",
    debounceName(() => {
      const newSettings = { ...settings, userName: nameInput.value.trim() };
      saveSettings(newSettings);
      onUpdate({ ...state, settings: newSettings });
    })
  );

  // Dark mode toggle
  container.querySelector("#toggle-dark").addEventListener("click", () => {
    const newVal = !settings.darkMode;
    const newSettings = { ...settings, darkMode: newVal };
    saveSettings(newSettings);
    applyTheme(newVal);
    onUpdate({ ...state, settings: newSettings });
    showToast(newVal ? "Dark mode enabled" : "Light mode enabled", "info");
  });

  // Notifications toggle
  container.querySelector("#toggle-notifications").addEventListener("click", async () => {
    const newVal = !settings.notifications;
    if (newVal) await requestPermission();
    const newSettings = { ...settings, notifications: newVal };
    saveSettings(newSettings);
    onUpdate({ ...state, settings: newSettings });
    showToast(newVal ? "Notifications enabled" : "Notifications disabled", "info");
  });

  // Test notification
  container.querySelector("#test-notification").addEventListener("click", sendTestNotification);

  // Reset data
  container.querySelector("#reset-data").addEventListener("click", () => {
    if (confirm("Reset all data to demo defaults? This cannot be undone.")) {
      resetAllData();
      const fresh = loadState();
      onReset(fresh);
      showToast("Demo data restored", "success");
    }
  });
}

/** Apply dark/light theme to document */
export function applyTheme(darkMode) {
  document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
}

/** Simple debounce for name input */
let nameTimer;
function debounceName(fn) {
  return () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(fn, 400);
  };
}
