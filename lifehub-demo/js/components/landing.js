/**
 * Rocket-inspired scroll landing page — multi-section welcome experience.
 */

import { logoFull } from "./logo.js";

export function renderLanding(container, { onGetStarted, onSignIn }) {
  container.innerHTML = `
    <div class="landing" id="landing-scroll">
      <!-- Sticky nav -->
      <nav class="landing-nav">
        ${logoFull({ size: 32, showText: true })}
        <button class="landing-nav__cta" id="landing-nav-cta">Get Started</button>
      </nav>

      <!-- Section 1: Hero -->
      <section class="landing-section landing-section--visible landing-hero" data-section="hero">
        <div class="landing-hero__badge">The future of personal life admin</div>
        <h1 class="landing-hero__title">
          Most apps help you<br/>
          <em>list</em> your tasks.<br/>
          None tell you if you're<br/>
          actually <em>on track.</em>
        </h1>
        <p class="landing-hero__sub">
          LifeHub is the world's first life intelligence platform. Track bills, store documents, and know your Life Pulse — all in one secure place.
        </p>
        <div class="landing-hero__actions">
          <button class="btn btn--primary btn--lg" id="hero-start">Start free</button>
          <button class="btn btn--outline btn--lg" id="hero-scroll">See how it works</button>
        </div>
        <div class="landing-hero__visual">
          <div class="landing-hero__phone">
            <div class="landing-hero__phone-screen">
              <div class="mini-pulse">
                <div class="mini-pulse__ring"></div>
                <span class="mini-pulse__score">87</span>
              </div>
              <div class="mini-brief">✨ 2 items due today</div>
            </div>
          </div>
        </div>
        <div class="landing-scroll-hint">
          <span>Scroll to explore</span>
          <div class="landing-scroll-hint__arrow"></div>
        </div>
      </section>

      <!-- Section 2: Social proof -->
      <section class="landing-section landing-proof" data-section="proof">
        <p class="landing-proof__text">
          <strong>10,000+</strong> people organize their bills, documents, and deadlines with LifeHub every day.
        </p>
        <div class="landing-proof__stats">
          <div class="landing-proof__stat"><span>6</span> categories</div>
          <div class="landing-proof__stat"><span>AI</span> powered</div>
          <div class="landing-proof__stat"><span>100%</span> on-device</div>
        </div>
      </section>

      <!-- Section 3: Feature cards (Rocket-style) -->
      <section class="landing-section landing-features" data-section="features">
        <div class="landing-features__header">
          <h2>The organizing.<br/>The understanding.<br/>The anticipating.</h2>
          <p>Three proprietary systems that no other life admin app has ever built.</p>
        </div>
        <div class="landing-features__grid">
          <article class="feature-card feature-card--blue">
            <span class="feature-card__num">01</span>
            <span class="feature-card__tag">Organize</span>
            <h3>Life Pulse™</h3>
            <p>A real-time wellness score for your entire life admin. One number tells you if you're on track.</p>
            <div class="feature-card__pills">
              <span>Bills</span><span>Tasks</span><span>Deadlines</span>
            </div>
          </article>
          <article class="feature-card feature-card--orange">
            <span class="feature-card__num">02</span>
            <span class="feature-card__tag">Understand</span>
            <h3>Clarity Brief™</h3>
            <p>AI reads your tasks and documents, then tells you exactly what matters today — in plain English.</p>
            <div class="feature-card__pills">
              <span>AI Summary</span><span>Daily Digest</span><span>Smart Alerts</span>
            </div>
          </article>
          <article class="feature-card feature-card--purple">
            <span class="feature-card__num">03</span>
            <span class="feature-card__tag">Anticipate</span>
            <h3>Life Stream™</h3>
            <p>Every bill, expiry, and appointment in one unified timeline. See your entire life ahead at a glance.</p>
            <div class="feature-card__pills">
              <span>Timeline</span><span>Documents</span><span>Warranties</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Section 4: Life Pulse showcase -->
      <section class="landing-section landing-showcase" data-section="showcase">
        <div class="landing-showcase__label">Exclusive to LifeHub</div>
        <h2>Know your Life Pulse<br/>in real time</h2>
        <p>Overdue bills, expiring warranties, and upcoming appointments — combined into one intelligent score from 0 to 100.</p>
        <div class="landing-showcase__visual">
          <div class="showcase-pulse">
            <svg class="showcase-pulse__svg" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border-color)" stroke-width="8"/>
              <circle class="showcase-pulse__arc" cx="100" cy="100" r="85" fill="none" stroke="url(#pulseGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="534" stroke-dashoffset="80" transform="rotate(-90 100 100)"/>
              <defs>
                <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#4f6ef7"/>
                  <stop offset="100%" stop-color="#a855f7"/>
                </linearGradient>
              </defs>
              <text x="100" y="95" text-anchor="middle" class="showcase-pulse__num">87</text>
              <text x="100" y="118" text-anchor="middle" class="showcase-pulse__lbl">Life Pulse</text>
            </svg>
            <div class="showcase-pulse__factors">
              <div class="showcase-pulse__factor showcase-pulse__factor--ok">✓ 6 documents secured</div>
              <div class="showcase-pulse__factor showcase-pulse__factor--warn">! 2 due today</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: How it works -->
      <section class="landing-section landing-steps" data-section="steps">
        <h2>How LifeHub works</h2>
        <div class="landing-steps__list">
          <div class="landing-step">
            <div class="landing-step__num">1</div>
            <div>
              <h4>Add your life</h4>
              <p>Upload bills, IDs, insurance cards, and receipts. Or add tasks and reminders manually.</p>
            </div>
          </div>
          <div class="landing-step">
            <div class="landing-step__num">2</div>
            <div>
              <h4>AI extracts everything</h4>
              <p>Dates, amounts, and action items are pulled automatically from your documents.</p>
            </div>
          </div>
          <div class="landing-step">
            <div class="landing-step__num">3</div>
            <div>
              <h4>Stay ahead</h4>
              <p>Life Pulse, Clarity Brief, and Life Stream keep you informed before deadlines hit.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 6: Security -->
      <section class="landing-section landing-trust" data-section="trust">
        <div class="landing-trust__icon">🔒</div>
        <h2>Your data stays<br/>on your device</h2>
        <p>Documents, tasks, and personal info are stored locally. Encrypted. Private. Yours alone.</p>
        <div class="landing-trust__badges">
          <span>On-device storage</span>
          <span>No cloud required</span>
          <span>Dark mode</span>
        </div>
      </section>

      <!-- Section 7: Final CTA -->
      <section class="landing-section landing-cta" data-section="cta">
        <h2>Ready to take control<br/>of your life admin?</h2>
        <p>Join thousands who never miss a bill, expiry, or deadline again.</p>
        <button class="btn btn--primary btn--lg btn--block" id="cta-start">Get started — it's free</button>
        <button class="btn btn--ghost btn--block" id="cta-signin">I already have an account</button>
      </section>

      <footer class="landing-footer">
        ${logoFull({ size: 28, showText: true })}
        <p>© 2026 LifeHub. Personal life admin, reimagined.</p>
      </footer>
    </div>
  `;

  bindLandingEvents(container, { onGetStarted, onSignIn });
  initScrollAnimations(container);
}

function bindLandingEvents(container, { onGetStarted, onSignIn }) {
  const scrollTo = (section) => {
    container.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ behavior: "smooth" });
  };

  container.querySelector("#hero-start")?.addEventListener("click", onGetStarted);
  container.querySelector("#landing-nav-cta")?.addEventListener("click", onGetStarted);
  container.querySelector("#cta-start")?.addEventListener("click", onGetStarted);
  container.querySelector("#cta-signin")?.addEventListener("click", onSignIn);
  container.querySelector("#hero-scroll")?.addEventListener("click", () => scrollTo("features"));
}

/** Fade-in elements as they scroll into view */
function initScrollAnimations(container) {
  const sections = container.querySelectorAll(".landing-section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("landing-section--visible");
      });
    },
    { threshold: 0.15 }
  );
  sections.forEach((s) => observer.observe(s));
}
