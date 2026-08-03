/**
 * Home tab — premium command center with Life Pulse™, Clarity Brief™, and Life Stream™.
 */

import { getGreeting, formatDate, daysUntil, formatCurrency } from "../utils/dates.js";
import { escapeHtml, showToast } from "../utils/helpers.js";
import { calculateLifePulse, buildLifeStream } from "../utils/lifeScore.js";
import { generateClarityBrief } from "../services/clarityService.js";
import { icon, lifePulseRing } from "./icons.js";
import { logoMark } from "./logo.js";
import { renderAppLinksSection, bindAppLinks } from "./appLinks.js";
import { createFileInput } from "../services/appLinksService.js";
import { showAddTaskModal } from "./todayTab.js";

/** Render the Home tab */
export async function renderHomeTab(container, state, { onUpdate, onNavigate }) {
  const { tasks, documents, settings } = state;
  const pulse = calculateLifePulse(tasks, documents);
  const stream = buildLifeStream(tasks, documents);
  const name = settings.userName ? escapeHtml(settings.userName) : "there";
  const firstName = name.split(" ")[0];

  container.innerHTML = renderHomeShell(firstName, pulse, stream, null, documents.length, settings);

  const brief = await generateClarityBrief(tasks, documents, pulse);
  const briefEl = container.querySelector("#clarity-brief");
  if (briefEl) {
    briefEl.outerHTML = renderClarityBrief(brief);
  }

  bindHomeEvents(container, state, onUpdate, onNavigate);
  bindAppLinks(container, settings, {
    onCamera: () => {
      createFileInput({
        capture: true,
        accept: "image/*",
        onSelect: () => {
          onNavigate?.("documents");
          showToast("Photo captured — save it in Vault", "success");
        },
      });
    },
    onPhotos: () => {
      createFileInput({
        accept: "image/*",
        onSelect: () => {
          onNavigate?.("documents");
          showToast("Photo selected — save it in Vault", "success");
        },
      });
    },
    onFiles: () => {
      createFileInput({
        accept: ".pdf,.png,.jpg,.jpeg,.webp,.gif",
        onSelect: () => {
          onNavigate?.("documents");
          showToast("File selected — save it in Vault", "success");
        },
      });
    },
    onEditApps: () => onNavigate?.("settings"),
  });
}

function renderHomeShell(firstName, pulse, stream, brief, docCount, settings) {
  const statusColor =
    pulse.score >= 85 ? "var(--color-success)" : pulse.score >= 50 ? "var(--color-warning)" : "var(--color-danger)";

  return `
    <div class="home">
      <!-- Hero header with gradient -->
      <div class="home-hero">
        <div class="home-hero__top">
          <div class="home-hero__brand">
            <div class="home-hero__logo">${logoMark({ size: 32, color: "white" })}</div>
            <span class="home-hero__name">LifeHub</span>
          </div>
          <button class="home-hero__notif" id="home-notif" aria-label="Notifications">
            ${icon("bell", "icon icon--sm")}
            ${pulse.factors.some((f) => f.type === "danger") ? '<span class="home-hero__dot"></span>' : ""}
          </button>
        </div>
        <h1 class="home-hero__greeting">${getGreeting()}, ${firstName}</h1>
        <p class="home-hero__date">${formatDate(new Date().toISOString())}</p>
      </div>

      <div class="home-body">
        <!-- Life Pulse™ — signature feature -->
        <div class="life-pulse-card">
          <div class="life-pulse-card__ring">
            ${lifePulseRing(pulse.score)}
          </div>
          <div class="life-pulse-card__info">
            <div class="life-pulse-card__status" style="color:${statusColor}">${pulse.status}</div>
            <div class="life-pulse-card__factors">
              ${pulse.factors.slice(0, 3).map((f) => `
                <span class="life-pulse-card__factor life-pulse-card__factor--${f.type}">${escapeHtml(f.text)}</span>
              `).join("")}
              ${pulse.factors.length === 0 ? '<span class="life-pulse-card__factor life-pulse-card__factor--success">Everything on track</span>' : ""}
            </div>
          </div>
        </div>

        <!-- Clarity Brief™ — AI digest -->
        <div id="clarity-brief">
          ${brief ? renderClarityBrief(brief) : renderClarityBriefSkeleton()}
        </div>

        <!-- Quick actions -->
        <div class="quick-actions">
          <button class="quick-action" id="qa-task">
            <div class="quick-action__icon quick-action__icon--blue">${icon("plus", "icon")}</div>
            <span>Add Task</span>
          </button>
          <button class="quick-action" id="qa-scan">
            <div class="quick-action__icon quick-action__icon--purple">${icon("scan", "icon")}</div>
            <span>Scan Doc</span>
          </button>
          <button class="quick-action" id="qa-stream">
            <div class="quick-action__icon quick-action__icon--teal">${icon("stream", "icon")}</div>
            <span>Life Stream</span>
          </button>
        </div>

        <!-- Phone app links -->
        ${renderAppLinksSection(settings)}

        <!-- Life Stream™ preview -->
        ${stream.length > 0 ? renderLifeStreamPreview(stream) : renderEmptyStream()}

        <!-- Secure vault teaser -->
        <div class="vault-teaser" id="vault-teaser">
          <div class="vault-teaser__icon">${icon("shield", "icon")}</div>
          <div class="vault-teaser__body">
            <div class="vault-teaser__title">Secure Vault</div>
            <div class="vault-teaser__desc">${docCount} documents protected on-device</div>
          </div>
          ${icon("chevron", "icon icon--sm")}
        </div>
      </div>
    </div>
  `;
}

function renderClarityBrief(brief) {
  const moodClass = `clarity-brief--${brief.mood}`;
  return `
    <div class="clarity-brief ${moodClass}" id="clarity-brief">
      <div class="clarity-brief__header">
        ${icon("sparkles", "icon icon--sm")}
        <span>Clarity Brief</span>
        <span class="clarity-brief__badge">AI</span>
      </div>
      <p class="clarity-brief__headline">${escapeHtml(brief.headline)}</p>
      <ul class="clarity-brief__list">
        ${brief.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderClarityBriefSkeleton() {
  return `
    <div class="clarity-brief clarity-brief--loading" id="clarity-brief">
      <div class="clarity-brief__header">
        ${icon("sparkles", "icon icon--sm")}
        <span>Clarity Brief</span>
      </div>
      <div class="skeleton skeleton--line"></div>
      <div class="skeleton skeleton--line skeleton--short"></div>
    </div>
  `;
}

function renderLifeStreamPreview(stream) {
  const preview = stream.slice(0, 5);
  return `
    <div class="life-stream">
      <div class="section-header">
        <h2 class="section-header__title">Life Stream</h2>
        <span class="section-header__badge">${stream.length} events</span>
      </div>
      <div class="life-stream__track">
        ${preview.map((ev, i) => renderStreamNode(ev, i, preview.length)).join("")}
      </div>
      ${stream.length > 5 ? `<button class="life-stream__more" id="view-full-stream">View all ${stream.length} events ${icon("chevron", "icon icon--xs")}</button>` : ""}
    </div>
  `;
}

function renderStreamNode(ev, index, total) {
  const urgencyClass = `life-stream__node--${ev.urgency}`;
  const dayLabel =
    ev.days < 0 ? `${Math.abs(ev.days)}d ago` : ev.days === 0 ? "Today" : ev.days === 1 ? "Tomorrow" : `${ev.days}d`;

  return `
    <div class="life-stream__node ${urgencyClass}" style="animation-delay:${index * 0.08}s">
      <div class="life-stream__dot"></div>
      ${index < total - 1 ? '<div class="life-stream__line"></div>' : ""}
      <div class="life-stream__content">
        <div class="life-stream__day">${dayLabel}</div>
        <div class="life-stream__title">${escapeHtml(ev.title)}</div>
        <div class="life-stream__sub">${escapeHtml(ev.subtitle)}${ev.amount ? ` · ${formatCurrency(ev.amount)}` : ""}</div>
      </div>
    </div>
  `;
}

function renderEmptyStream() {
  return `
    <div class="life-stream life-stream--empty">
      <div class="section-header">
        <h2 class="section-header__title">Life Stream</h2>
      </div>
      <p class="life-stream__empty-text">Your unified timeline of tasks, bills, and document expiries will appear here.</p>
    </div>
  `;
}

function bindHomeEvents(container, state, onUpdate, onNavigate) {
  container.querySelector("#qa-task")?.addEventListener("click", () => {
    showAddTaskModal(state, onUpdate);
  });

  container.querySelector("#qa-scan")?.addEventListener("click", () => {
    createFileInput({
      capture: true,
      accept: "image/*",
      onSelect: () => {
        onNavigate?.("documents");
        showToast("Open Vault to save your scan", "info");
      },
    });
  });

  container.querySelector("#qa-stream")?.addEventListener("click", () => {
    onNavigate?.("today");
  });

  container.querySelector("#vault-teaser")?.addEventListener("click", () => {
    onNavigate?.("documents");
  });

  container.querySelector("#view-full-stream")?.addEventListener("click", () => {
    onNavigate?.("today");
  });

  container.querySelector("#home-notif")?.addEventListener("click", () => {
    onNavigate?.("today");
  });
}
