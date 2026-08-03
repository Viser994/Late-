// ============================================================================
// App controller
// ----------------------------------------------------------------------------
// Bootstraps LifeHub: owns the router (onboarding vs. tabs), applies the theme,
// wires the bottom tab bar + FAB + sheet host, and re-renders the active view
// whenever the store changes. Views are pure functions that receive `ctx`.
// ============================================================================

import { store } from './store.js';
import { qs, render } from './utils/dom.js';
import { icons } from './components/icons.js';
import { onboardingView } from './components/onboarding.js';
import { todayView } from './components/today.js';
import { documentsView } from './components/documents.js';
import { settingsView } from './components/settings.js';
import { addTaskSheet, addDocumentSheet } from './components/forms.js';
import { notificationService } from './services/notificationService.js';

// Cached DOM hosts (defined in index.html).
const screenEl = qs('#screen');
const tabbarEl = qs('#tabbar');
const fabEl = qs('#fab');
const sheetHost = qs('#sheet-host');
const toastHost = qs('#toast-host');

// Non-persistent UI state (current tab, active filters, etc.).
const viewState = { tab: 'today', docFilter: 'all' };

const TABS = {
  today: { label: 'Today', icon: 'today', render: todayView },
  documents: { label: 'Documents', icon: 'documents', render: documentsView },
  settings: { label: 'Settings', icon: 'settings', render: settingsView },
};

// ---------------------------------------------------------------------------
// Context passed to every view/component. Keeps them decoupled from globals.
// ---------------------------------------------------------------------------
const ctx = {
  store,
  viewState,
  navigate(tab) {
    if (TABS[tab]) viewState.tab = tab;
    renderApp(true);
  },
  rerender: () => renderApp(false),
  applyTheme,
  openSheet,
  closeSheet,
  openAddDocument: () => openSheet(addDocumentSheet(ctx)),
  toast: (msg, icon = '') => notificationService.showToast(toastHost, msg, icon),
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
function resolveTheme() {
  const pref = store.state.theme;
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', resolveTheme());
}

// ---------------------------------------------------------------------------
// Bottom sheet host
// ---------------------------------------------------------------------------
function openSheet(contentNode) {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.appendChild(contentNode);

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.appendChild(sheet);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });

  sheetHost.replaceChildren(overlay);
  // Next frame → trigger the slide-up transition.
  requestAnimationFrame(() => overlay.classList.add('open'));
}
function closeSheet() {
  const overlay = qs('.sheet-overlay', sheetHost);
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => sheetHost.replaceChildren(), 280);
}

// ---------------------------------------------------------------------------
// Tab bar + FAB
// ---------------------------------------------------------------------------
function renderTabbar() {
  tabbarEl.replaceChildren(...Object.entries(TABS).map(([key, t]) => {
    const btn = document.createElement('button');
    btn.className = viewState.tab === key ? 'active' : '';
    btn.innerHTML = `${icons[t.icon]()}<span>${t.label}</span>`;
    btn.addEventListener('click', () => { viewState.tab = key; renderApp(); });
    return btn;
  }));
}

function updateFab() {
  // The FAB adds a task on Today, and a document on the Documents tab; it's
  // hidden on Settings where there's nothing to create.
  if (viewState.tab === 'settings') { fabEl.style.display = 'none'; return; }
  fabEl.style.display = 'grid';
  fabEl.innerHTML = icons.plus();
  fabEl.onclick = () => {
    if (viewState.tab === 'documents') openSheet(addDocumentSheet(ctx));
    else openSheet(addTaskSheet(ctx));
  };
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------
function renderApp(resetScroll = true) {
  applyTheme();

  // Onboarding takes over the whole screen and hides the chrome.
  if (!store.state.onboarded) {
    tabbarEl.style.display = 'none';
    fabEl.style.display = 'none';
    render(screenEl, onboardingView(ctx));
    screenEl.style.padding = '0';
    screenEl.style.display = 'flex';
    return;
  }

  tabbarEl.style.display = 'flex';
  screenEl.style.padding = '';
  screenEl.style.display = '';
  renderTabbar();
  updateFab();

  const prevScroll = screenEl.scrollTop;
  const view = (TABS[viewState.tab] || TABS.today).render(ctx);
  render(screenEl, view);
  // Preserve scroll on in-place updates (e.g. checking off a task); reset when
  // navigating between tabs so each screen starts at the top.
  screenEl.scrollTop = resetScroll ? 0 : prevScroll;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
function boot() {
  applyTheme();

  // Re-render the active screen on any store change, preserving scroll so
  // interactions like checking off a task feel stable. Open sheets live in a
  // separate host and are untouched by this.
  store.subscribe(() => renderApp(false));

  // Keep in sync with the OS theme when set to "system".
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.state.theme === 'system') applyTheme();
  });

  renderApp();

  // Surface any due-soon reminders shortly after launch (respects the setting).
  if (store.state.onboarded && store.state.notificationsEnabled) {
    setTimeout(() => {
      const due = notificationService.notifyDueSoon(store.state.tasks, 1);
      if (due.length) ctx.toast(`${due.length} task${due.length > 1 ? 's' : ''} due soon`, icons.bell());
    }, 1400);
  }
}

boot();
