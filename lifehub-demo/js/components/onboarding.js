/**
 * Premium onboarding — introduces LifeHub's unique features.
 */

import { escapeHtml } from "../utils/helpers.js";

const SLIDES = [
  {
    visual: "🏠",
    title: "Welcome to LifeHub",
    text: "The only app that unifies your bills, documents, and deadlines into one intelligent command center.",
    feature: "Your life, organized",
  },
  {
    visual: "💓",
    title: "Life Pulse™",
    text: "A real-time wellness score for your life admin. Know instantly if you're on track or falling behind.",
    feature: "Exclusive to LifeHub",
  },
  {
    visual: "✨",
    title: "Clarity Brief™",
    text: "AI reads your tasks and documents, then tells you exactly what matters today — in plain English.",
    feature: "Powered by AI",
  },
  {
    visual: "🌊",
    title: "Life Stream™",
    text: "Every bill, expiry, and appointment in one unified timeline. See your entire life ahead at a glance.",
    feature: "World's first",
  },
];

let currentSlide = 0;

export function renderOnboarding(container, { onComplete }) {
  currentSlide = 0;

  function render() {
    const slide = SLIDES[currentSlide];
    const isLast = currentSlide === SLIDES.length - 1;

    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding__slides">
          <div class="onboarding__visual">${slide.visual}</div>
          <span class="onboarding__feature">${escapeHtml(slide.feature)}</span>
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
              ? `<button class="btn btn--primary" id="onboard-finish">Enter LifeHub</button>`
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
