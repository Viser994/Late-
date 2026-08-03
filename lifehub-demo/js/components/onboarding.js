/**
 * Onboarding flow — 3 simple slides introducing LifeHub.
 */

import { escapeHtml } from "../utils/helpers.js";

const SLIDES = [
  {
    icon: "🏠",
    title: "Welcome to LifeHub",
    text: "Your personal life admin assistant. Keep bills, reminders, and important documents organized in one secure place.",
  },
  {
    icon: "✨",
    title: "AI-Powered Organization",
    text: "Upload receipts, IDs, and documents. LifeHub extracts dates, amounts, and action items automatically.",
  },
  {
    icon: "🔔",
    title: "Never Miss a Deadline",
    text: "Get smart reminders for bills, appointments, and warranty expirations. Your Today dashboard shows what's urgent.",
  },
];

let currentSlide = 0;

/** Render the onboarding screen */
export function renderOnboarding(container, { onComplete }) {
  currentSlide = 0;

  function render() {
    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding__slides">
          <div class="onboarding__icon">${slide.icon}</div>
          <h1 class="onboarding__title">${escapeHtml(slide.title)}</h1>
          <p class="onboarding__text">${escapeHtml(slide.text)}</p>
        </div>

        <div class="onboarding__dots">
          ${SLIDES.map(
            (_, i) =>
              `<div class="onboarding__dot ${i === currentSlide ? "onboarding__dot--active" : ""}"></div>`
          ).join("")}
        </div>

        <div class="onboarding__actions">
          ${
            isLast
              ? `<button class="btn btn--primary" id="onboard-finish">Get Started</button>`
              : `<button class="btn btn--primary" id="onboard-next">Continue</button>
                 <button class="btn btn--ghost" id="onboard-skip">Skip</button>`
          }
        </div>
      </div>
    `;

    container.querySelector("#onboard-next")?.addEventListener("click", () => {
      currentSlide++;
      render();
    });

    container.querySelector("#onboard-skip")?.addEventListener("click", onComplete);
    container.querySelector("#onboard-finish")?.addEventListener("click", onComplete);
  }

  render();
}
