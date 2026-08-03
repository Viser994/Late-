// ============================================================================
// Onboarding
// ----------------------------------------------------------------------------
// A short, friendly 3-step intro that sets expectations (organize, AI, secure)
// and captures the user's first name. Kept intentionally simple — one screen at
// a time, with a clear "Get started" finish.
// ============================================================================

import { el, qs } from '../utils/dom.js';
import { icons } from './icons.js';

const STEPS = [
  {
    icon: 'logo',
    title: 'Welcome to LifeHub',
    body: 'Bills, reminders, appointments, documents and warranties — all organized in one calm place.',
  },
  {
    icon: 'sparkle',
    title: 'Let AI do the busywork',
    body: 'Scan a receipt or paste an email and LifeHub pulls out the dates, amounts and action items for you.',
  },
  {
    icon: 'shield',
    title: 'Private by design',
    body: 'Your information stays on your device. No account needed to get started.',
  },
];

export function onboardingView(ctx) {
  let step = 0;
  const root = el('div', { class: 'onboard' });

  function render() {
    const isLast = step === STEPS.length - 1;
    const s = STEPS[step];

    const art = el('div', { class: 'art' }, [
      el('div', { class: 'blob' }, el('span', { html: icons[s.icon]() })),
    ]);
    const dots = el('div', { class: 'dots' }, STEPS.map((_, i) =>
      el('div', { class: `d ${i === step ? 'active' : ''}` })));

    const nameField = isLast
      ? el('div', { class: 'field', style: 'text-align:left;margin-top:8px' }, [
          el('label', { for: 'ob-name' }, 'What should we call you?'),
          el('input', { id: 'ob-name', type: 'text', placeholder: 'Your first name', 'aria-label': 'Your first name', value: ctx.store.state.userName }),
        ])
      : null;

    const primary = el('button', { class: 'btn block',
      onclick: () => {
        if (isLast) {
          const name = qs('#ob-name', root)?.value.trim();
          ctx.store.completeOnboarding(name);
          ctx.navigate('today');
        } else { step += 1; render(); }
      } }, isLast ? 'Get started' : 'Continue');

    const secondary = isLast ? null : el('button', { class: 'btn ghost block',
      onclick: () => { ctx.store.completeOnboarding(); ctx.navigate('today'); } }, 'Skip');

    // Filter out null slots (e.g. the name field only exists on the last step)
    // because replaceChildren would otherwise stringify them to the text "null".
    root.replaceChildren(...[
      art,
      el('h1', {}, s.title),
      el('p', {}, s.body),
      nameField,
      dots,
      el('div', { class: 'onboard-actions' }, [primary, secondary].filter(Boolean)),
    ].filter(Boolean));
  }

  render();
  return root;
}
