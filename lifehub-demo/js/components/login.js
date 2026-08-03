/**
 * Login page — animated logo reveal with secure entry.
 */

import { logoHero, logoFull } from "./logo.js";
import { escapeHtml } from "../utils/helpers.js";

export function renderLogin(container, { onLogin, userName = "" }) {
  container.innerHTML = `
    <div class="login">
      <div class="login__bg">
        <div class="login__orb login__orb--1"></div>
        <div class="login__orb login__orb--2"></div>
        <div class="login__orb login__orb--3"></div>
      </div>

      <div class="login__content">
        ${logoHero({ size: 110 })}

        <div class="login__brand">
          <div class="logo-full logo-full--center">
            <div class="logo-full__text logo-full__text--hero">
              <span>LIFE</span><span>HUB</span>
            </div>
          </div>
          <p class="login__tagline">Your life, intelligently organized</p>
        </div>

        <form class="login__form" id="login-form">
          <div class="form-group login__field" style="animation-delay:1.2s">
            <label class="form-label" for="login-name">Your name</label>
            <input class="form-input login__input" id="login-name" type="text" placeholder="Enter your name" value="${escapeHtml(userName)}" required autocomplete="name" />
          </div>
          <div class="form-group login__field" style="animation-delay:1.4s">
            <label class="form-label" for="login-email">Email <span class="text-muted">(optional)</span></label>
            <input class="form-input login__input" id="login-email" type="email" placeholder="you@email.com" autocomplete="email" />
          </div>
          <button type="submit" class="btn btn--primary btn--lg btn--block login__submit" style="animation-delay:1.6s" id="login-submit">
            <span class="login__submit-text">Enter LifeHub</span>
            <span class="login__submit-glow"></span>
          </button>
        </form>

        <p class="login__secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Secured on your device. No account required.
        </p>
      </div>
    </div>
  `;

  const form = container.querySelector("#login-form");
  const submitBtn = container.querySelector("#login-submit");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("login-name").value.trim();
    const email = document.getElementById("login-email").value.trim();

    if (!name) return;

    // Button loading state
    submitBtn.classList.add("login__submit--loading");
    submitBtn.querySelector(".login__submit-text").textContent = "Welcome...";

    setTimeout(() => {
      onLogin({ userName: name, userEmail: email });
    }, 800);
  });
}
