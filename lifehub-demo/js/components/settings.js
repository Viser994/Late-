// ============================================================================
// Settings view
// ----------------------------------------------------------------------------
// Theme (dark mode), notifications, account, security messaging, data reset,
// and an "about" section. Keeps the app feeling trustworthy and in the user's
// control.
// ============================================================================

import { el } from '../utils/dom.js';
import { icons } from './icons.js';
import { notificationService } from '../services/notificationService.js';
import { aiService } from '../services/aiService.js';

export function settingsView(ctx) {
  const { state } = ctx.store;

  const header = el('div', { class: 'app-header' }, [
    el('div', { class: 'greeting' }, [el('small', {}, 'Preferences & privacy'), el('h1', {}, 'Settings')]),
    el('div', { class: 'avatar' }, state.userName.charAt(0).toUpperCase()),
  ]);

  // --- Account card ---------------------------------------------------------
  const account = el('div', { class: 'card', style: 'display:flex;gap:14px;align-items:center;margin-bottom:24px' }, [
    el('div', { class: 'avatar', style: 'width:52px;height:52px;font-size:1.2rem' }, state.userName.charAt(0).toUpperCase()),
    el('div', { style: 'flex:1' }, [
      el('b', { style: 'font-size:1.05rem' }, state.userName),
      el('div', { style: 'font-size:.83rem;color:var(--text-muted)' }, 'Free plan · LifeHub member'),
    ]),
    el('span', { class: 'chip ok', html: `${icons.shield()}<span>Secure</span>` }),
  ]);

  // --- Appearance -----------------------------------------------------------
  const themeGroup = group('Appearance', [
    row('moon', 'var(--cat-appointment)', 'Dark mode', 'Easier on the eyes at night',
      toggle(state.theme === 'dark', (on) => {
        ctx.store.set({ theme: on ? 'dark' : 'light' });
        ctx.applyTheme();
      })),
  ]);

  // --- Notifications --------------------------------------------------------
  const notifState = notificationService.permission;
  const notifSub = notifState === 'denied'
    ? 'Blocked in browser settings'
    : notifState === 'granted' ? 'Enabled for due dates' : 'Get reminders before due dates';
  const notifGroup = group('Notifications', [
    row('bell', 'var(--warn-500)', 'Due-date reminders', notifSub,
      toggle(state.notificationsEnabled && notifState !== 'denied', async (on) => {
        if (on) {
          const perm = await notificationService.requestPermission();
          ctx.store.set({ notificationsEnabled: perm !== 'denied' });
          if (perm === 'granted') ctx.toast('Notifications enabled', icons.bell());
          else if (perm === 'denied') ctx.toast('Allow notifications in your browser');
        } else {
          ctx.store.set({ notificationsEnabled: false });
        }
        ctx.rerender();
      })),
    actionRow('bell', 'var(--brand-500)', 'Send a test reminder', 'Preview how alerts look', () => {
      const fired = notificationService.push('LifeHub reminder', 'Your electricity bill is due tomorrow.');
      ctx.toast(fired ? 'Test notification sent' : 'Enable notifications first', icons.bell());
    }),
  ]);

  // --- Privacy & security ---------------------------------------------------
  const securityGroup = group('Privacy & security', [
    infoRow('lock', 'var(--cat-id)', 'On-device storage', 'Your tasks & documents are saved locally in your browser.'),
    infoRow('shield', 'var(--success-500)', 'No account required', 'LifeHub works without sharing data to a server.'),
    infoRow('sparkle', 'var(--accent-500)', 'AI service',
      aiService.AI_CONNECTED ? 'Connected to an AI provider' : 'Demo mode — connect a provider to enable live AI'),
  ]);

  // --- Data -----------------------------------------------------------------
  const dataGroup = group('Data', [
    actionRow('download', 'var(--brand-500)', 'Export my data', 'Download a JSON backup', () => exportData(ctx)),
    actionRow('trash', 'var(--danger-500)', 'Reset app', 'Clear everything & restore samples', () => {
      if (confirm('This will erase your tasks and documents and restore the sample data. Continue?')) {
        ctx.store.reset();
        ctx.applyTheme();
        ctx.navigate('today');
        ctx.toast('App reset');
      }
    }),
  ]);

  const about = el('div', { class: 'secure-note', style: 'flex-direction:column;gap:4px;margin-top:28px' }, [
    el('div', { style: 'display:flex;align-items:center;gap:8px;color:var(--brand-500);font-weight:700' },
      [el('span', { html: icons.logo() }), 'LifeHub']),
    el('div', {}, 'Version 1.0 · Your personal life admin, simplified.'),
  ]);

  return el('div', {}, [header, account, themeGroup, notifGroup, securityGroup, dataGroup, about]);
}

// --- building blocks --------------------------------------------------------
function group(title, rows) {
  return el('div', { class: 'section' }, [
    el('div', { class: 'section-head' }, [el('h2', {}, title)]),
    el('div', { class: 'setting-group' }, rows),
  ]);
}

function row(icon, color, title, sub, control) {
  return el('div', { class: 'setting-row' }, [
    el('div', { class: 's-icon', style: `background:${color}`, html: icons[icon]() }),
    el('div', { class: 's-text' }, [el('b', {}, title), el('small', {}, sub)]),
    control,
  ]);
}

function actionRow(icon, color, title, sub, onClick) {
  const r = row(icon, color, title, sub, el('span', { style: 'color:var(--text-faint)', html: icons.chevron() }));
  r.style.cursor = 'pointer';
  r.addEventListener('click', onClick);
  return r;
}

function infoRow(icon, color, title, sub) {
  return row(icon, color, title, sub, null);
}

function toggle(checked, onChange) {
  const input = el('input', { type: 'checkbox', checked: checked ? 'true' : null,
    onchange: (e) => onChange(e.target.checked) });
  return el('label', { class: 'switch' }, [input, el('span', { class: 'slider' })]);
}

/** Download the whole store as a JSON file (client-side backup). */
function exportData(ctx) {
  const blob = new Blob([JSON.stringify(ctx.store.state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lifehub-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  ctx.toast('Backup downloaded', icons.download());
}
