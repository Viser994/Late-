/**
 * Install guide — helps users add LifeHub to their phone home screen for free.
 */

import { openModal, closeModal } from "./modal.js";
import { promptInstall, getPlatform, isInstalled, canOneClickInstall } from "../services/pwaService.js";
import { showToast } from "../utils/helpers.js";
import { logoMark } from "./logo.js";

export function renderInstallSection() {
  const installed = isInstalled();
  const platform = getPlatform();

  return `
    <div class="settings-group">
      <div class="settings-group__title">Install App</div>
      <p class="settings-group__desc">Add LifeHub to your home screen — works like a real app, completely free. No App Store needed.</p>
      <div class="install-card ${installed ? "install-card--done" : ""}">
        <div class="install-card__icon">${logoMark({ size: 48, color: "var(--color-primary)" })}</div>
        <div class="install-card__body">
          <div class="install-card__title">${installed ? "App Installed ✓" : "Get LifeHub on Your Phone"}</div>
          <div class="install-card__desc">${installed ? "You're running LifeHub as an installed app." : "Free · No download · Works offline"}</div>
        </div>
        ${installed ? "" : `<button class="btn btn--primary btn--sm" id="install-app-btn">Install</button>`}
      </div>
    </div>
  `;
}

export function bindInstallButton(container) {
  container.querySelector("#install-app-btn")?.addEventListener("click", () => {
    showInstallGuide();
  });
}

/** Show install modal with platform-specific steps */
export function showInstallGuide() {
  const platform = getPlatform();
  const oneClick = canOneClickInstall();

  let steps = "";

  if (oneClick) {
    steps = `
      <p class="install-guide__lead">Tap the button below to install LifeHub on your phone.</p>
      <button class="btn btn--primary btn--lg btn--block" id="install-now">Install LifeHub</button>
    `;
  } else if (platform === "ios") {
    steps = `
      <p class="install-guide__lead">Install LifeHub on iPhone or iPad in 3 steps:</p>
      <ol class="install-guide__steps">
        <li><strong>1.</strong> Tap the <span class="install-guide__share">Share</span> button <span class="install-guide__icon">⬆️</span> at the bottom of Safari</li>
        <li><strong>2.</strong> Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li><strong>3.</strong> Tap <strong>"Add"</strong> — LifeHub appears on your home screen!</li>
      </ol>
      <div class="install-guide__tip">💡 Must use Safari browser (not Chrome) on iPhone</div>
    `;
  } else if (platform === "android") {
    steps = `
      <p class="install-guide__lead">Install LifeHub on Android in 3 steps:</p>
      <ol class="install-guide__steps">
        <li><strong>1.</strong> Tap the <strong>menu ⋮</strong> (three dots) in Chrome</li>
        <li><strong>2.</strong> Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
        <li><strong>3.</strong> Tap <strong>"Install"</strong> — done!</li>
      </ol>
      <div class="install-guide__tip">💡 Works best in Chrome browser</div>
    `;
  } else {
    steps = `
      <p class="install-guide__lead">On your phone, open this link in Safari (iPhone) or Chrome (Android):</p>
      <div class="install-guide__url">viser994.github.io/Late-/lifehub-demo/</div>
      <p class="install-guide__lead">Then follow the Add to Home Screen steps for your device.</p>
    `;
  }

  openModal(
    "Install LifeHub — Free",
    `
    <div class="install-guide">
      <div class="install-guide__logo">${logoMark({ size: 64, color: "var(--color-primary)" })}</div>
      ${steps}
      <div class="install-guide__features">
        <div class="install-guide__feature">✓ Works offline</div>
        <div class="install-guide__feature">✓ No App Store</div>
        <div class="install-guide__feature">✓ 100% free</div>
        <div class="install-guide__feature">✓ Full screen</div>
      </div>
    </div>
    `
  );

  document.getElementById("install-now")?.addEventListener("click", async () => {
    const ok = await promptInstall();
    if (ok) {
      closeModal();
      showToast("Installing LifeHub…", "success");
    }
  });
}

/** Show install banner on landing page (first visit) */
export function renderInstallBanner() {
  if (isInstalled()) return "";

  return `
    <div class="install-banner" id="install-banner">
      <div class="install-banner__text">
        <strong>Free phone app</strong> — Add to home screen, no download needed
      </div>
      <button class="install-banner__btn" id="banner-install">Install</button>
    </div>
  `;
}

export function bindInstallBanner(container) {
  container.querySelector("#banner-install")?.addEventListener("click", showInstallGuide);
  container.querySelector("#install-banner")?.addEventListener("click", (e) => {
    if (e.target.id !== "banner-install") showInstallGuide();
  });
}
