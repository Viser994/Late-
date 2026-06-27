(function () {
  'use strict';

  const STORAGE_KEYS = {
    user: 'bstt_user',
    favorites: 'bstt_favorites',
    reports: 'bstt_reports'
  };

  let currentFilter = 'all';
  let selectedMode = 'all';
  let updateInterval = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
    } catch {
      return null;
    }
  }

  function saveUser(user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
    } catch {
      return [];
    }
  }

  function saveFavorites(favs) {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favs));
  }

  function getReports() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.reports));
      return stored || COMMUNITY_REPORTS;
    } catch {
      return COMMUNITY_REPORTS;
    }
  }

  function saveReports(reports) {
    localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function navigateTo(sectionId) {
    $$('.section').forEach((s) => s.classList.remove('active'));
    $$('.nav-link').forEach((l) => l.classList.remove('active'));

    const section = $(`#${sectionId}`);
    const navLink = $(`.nav-link[data-nav="${sectionId}"]`);

    if (section) section.classList.add('active');
    if (navLink) navLink.classList.add('active');

    $('#mainNav').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateAuthUI() {
    const user = getUser();
    const signInBtn = $('#signInBtn');
    const signUpBtn = $('#signUpBtn');
    const userMenuBtn = $('#userMenuBtn');

    if (user) {
      signInBtn.classList.add('hidden');
      signUpBtn.classList.add('hidden');
      userMenuBtn.classList.remove('hidden');
      $('#userAvatar').textContent = (user.name || user.email || 'U')[0].toUpperCase();
    } else {
      signInBtn.classList.remove('hidden');
      signUpBtn.classList.remove('hidden');
      userMenuBtn.classList.add('hidden');
    }
  }

  function openModal(id) {
    $(`#${id}`).classList.remove('hidden');
  }

  function closeModal(id) {
    $(`#${id}`).classList.add('hidden');
  }

  function renderTrafficAlerts() {
    const container = $('#trafficAlerts');
    container.innerHTML = TRAFFIC_ALERTS.map((alert) => `
      <div class="alert-item severity-${alert.severity}">
        <h4>${alert.title}</h4>
        <p>${alert.description}</p>
        <div class="alert-meta">
          <span>${alert.road}</span>
          <span>${alert.updated}</span>
        </div>
      </div>
    `).join('');
  }

  function renderSignalSync() {
    const container = $('#signalSync');
    container.innerHTML = SIGNAL_SYNC.map((signal) => `
      <div class="signal-item ${signal.status}">
        <h4>${signal.intersection}</h4>
        <p>${signal.description}</p>
        <div class="signal-meta">
          <span>${signal.status === 'synced' ? '✓ Synced' : '⟳ Adjusting'}</span>
          <span>${signal.savings}</span>
        </div>
      </div>
    `).join('');
  }

  function renderRoadMap() {
    const container = $('#roadMap');
    const legend = container.querySelector('.map-legend');
    container.innerHTML = ROAD_SEGMENTS.map((seg) => `
      <div class="road-segment ${seg.status}" title="${seg.name}: ${seg.status}">${seg.name}</div>
    `).join('');
    container.appendChild(legend);
  }

  function renderTransitList(filter = 'all', search = '') {
    const favorites = getFavorites();
    let routes = [...TRANSIT_ROUTES];

    routes = routes.map((r) => ({
      ...r,
      arrival: Math.max(1, r.arrival + Math.floor(Math.random() * 3) - 1)
    }));

    if (filter === 'bus') routes = routes.filter((r) => r.type === 'bus');
    else if (filter === 'train') routes = routes.filter((r) => r.type === 'train');
    else if (filter === 'favorites') routes = routes.filter((r) => favorites.includes(r.id));

    if (search) {
      const q = search.toLowerCase();
      routes = routes.filter((r) =>
        r.route.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.stop.toLowerCase().includes(q)
      );
    }

    const container = $('#transitList');

    if (routes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>No routes found. Try a different search or filter.</p>
        </div>`;
      return;
    }

    container.innerHTML = routes.map((r) => `
      <div class="transit-card" data-id="${r.id}">
        <div class="transit-type ${r.type}">${r.type === 'bus' ? '🚌' : '🚆'}</div>
        <div class="transit-info">
          <h4>${r.route}</h4>
          <p>${r.stop} → ${r.destination}</p>
        </div>
        <div class="transit-arrival">
          <div class="arrival-time">${r.arrival} min</div>
          <div class="arrival-label">arrival</div>
        </div>
        <span class="crowd-badge crowd-${r.crowd}">${r.crowd} crowd</span>
        <button class="favorite-btn ${favorites.includes(r.id) ? 'active' : ''}" data-fav="${r.id}" aria-label="Favorite">★</button>
      </div>
    `).join('');

    $$('.favorite-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
      });
    });
  }

  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter((f) => f !== id);
      showToast('Removed from favorites');
    } else {
      favs.push(id);
      showToast('Added to favorites');
    }
    saveFavorites(favs);
    renderTransitList(currentFilter, $('#transitSearch').value);
  }

  function renderCommunityReports() {
    const reports = getReports();
    const container = $('#communityReports');
    container.innerHTML = reports.slice(0, 6).map((r) => `
      <div class="report-item">
        <h4>${r.type} — ${r.location}</h4>
        <p>${r.details}</p>
        <div class="alert-meta">
          <span>${r.time}</span>
          <span>👍 ${r.votes} confirmations</span>
        </div>
      </div>
    `).join('');
  }

  function planRoutes() {
    const from = $('#fromLocation').value.trim();
    const to = $('#toLocation').value.trim();

    if (!from || !to) {
      showToast('Please enter both start and destination');
      return;
    }

    let templates = ROUTE_TEMPLATES;
    if (selectedMode !== 'all') {
      templates = ROUTE_TEMPLATES.filter((t) => t.mode === selectedMode);
      if (templates.length === 0) {
        templates = ROUTE_TEMPLATES.filter((t) => t.mode !== 'all');
      }
    }

    const routes = templates.map((t, i) => ({
      ...t,
      duration: t.getDuration(),
      recommended: i === 0
    })).sort((a, b) => a.duration - b.duration);

    routes[0].recommended = true;

    const container = $('#routeResults');
    container.innerHTML = routes.map((r) => `
      <div class="route-card ${r.recommended ? 'recommended' : ''}">
        <div class="route-header">
          <span>${r.icon} ${r.label}</span>
          <span class="route-duration">${r.duration} min</span>
        </div>
        ${r.recommended ? '<span class="route-badge">Recommended</span>' : ''}
        <p class="route-steps">${r.steps}</p>
        <div class="route-meta">
          <span>🌱 ${r.eco}</span>
          <span>💰 ${r.cost}</span>
        </div>
      </div>
    `).join('');

    showToast(`Found ${routes.length} routes from "${from}" to "${to}"`);
  }

  function fillLocation(field, preset) {
    const user = getUser();
    const input = field === 'from' ? $('#fromLocation') : $('#toLocation');

    if (preset === 'home') {
      input.value = user?.homeLocation || BRAMPTON_LOCATIONS.home;
    } else if (preset === 'work') {
      input.value = user?.workLocation || BRAMPTON_LOCATIONS.work;
    }
  }

  function updateLiveStats() {
    $('#incidentCount').textContent = TRAFFIC_ALERTS.filter((a) => a.severity !== 'low').length;
    $('#signalsOptimized').textContent = SIGNAL_SYNC.filter((s) => s.status === 'synced').length;

    const statuses = ['Light', 'Moderate', 'Heavy'];
    const weights = [0.2, 0.6, 0.2];
    const rand = Math.random();
    let status = statuses[1];
    if (rand < weights[0]) status = statuses[0];
    else if (rand > 1 - weights[2]) status = statuses[2];
    $('#cityTrafficStatus').textContent = status;

    const onTime = 92 + Math.floor(Math.random() * 5);
    $('#statOnTime').textContent = `${onTime}%`;
    $('#statAlerts').textContent = TRAFFIC_ALERTS.filter((a) => a.severity === 'high').length +
      Math.floor(Math.random() * 3);
  }

  function startLiveUpdates() {
    updateLiveStats();
    updateInterval = setInterval(() => {
      renderTransitList(currentFilter, $('#transitSearch').value);
      updateLiveStats();
    }, 30000);
  }

  function initNavigation() {
    $$('[data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(el.dataset.nav);
      });
    });

    $('#mobileMenuBtn').addEventListener('click', () => {
      $('#mainNav').classList.toggle('open');
    });
  }

  function initAuth() {
    $('#signInBtn').addEventListener('click', () => {
      $('#authSignIn').classList.remove('hidden');
      $('#authSignUp').classList.add('hidden');
      openModal('authModal');
    });

    $('#signUpBtn').addEventListener('click', () => {
      $('#authSignUp').classList.remove('hidden');
      $('#authSignIn').classList.add('hidden');
      openModal('authModal');
    });

    $('#showSignUp').addEventListener('click', () => {
      $('#authSignUp').classList.remove('hidden');
      $('#authSignIn').classList.add('hidden');
    });

    $('#showSignIn').addEventListener('click', () => {
      $('#authSignIn').classList.remove('hidden');
      $('#authSignUp').classList.add('hidden');
    });

    $('#authModalClose').addEventListener('click', () => closeModal('authModal'));
    $('#authModal').addEventListener('click', (e) => {
      if (e.target === $('#authModal')) closeModal('authModal');
    });

    $('#signInForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#signInEmail').value.trim();
      const existing = getUser();
      saveUser({
        ...(existing || {}),
        email,
        name: existing?.name || email.split('@')[0]
      });
      closeModal('authModal');
      updateAuthUI();
      showToast(`Welcome back, ${email.split('@')[0]}!`);
    });

    $('#signUpForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#signUpName').value.trim();
      const email = $('#signUpEmail').value.trim();
      saveUser({ name, email, notifications: true });
      closeModal('authModal');
      updateAuthUI();
      showToast(`Account created! Welcome, ${name}.`);
      setTimeout(() => openModal('profileModal'), 500);
    });

    $$('.btn-social').forEach((btn) => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        saveUser({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          email: `user@${provider}.com`,
          provider,
          notifications: true
        });
        closeModal('authModal');
        updateAuthUI();
        showToast(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      });
    });

    $('#userMenuBtn').addEventListener('click', () => {
      const user = getUser();
      if (user) {
        $('#profileName').value = user.name || '';
        $('#homeLocation').value = user.homeLocation || '';
        $('#workLocation').value = user.workLocation || '';
        $('#enableNotifications').checked = user.notifications !== false;
        openModal('profileModal');
      }
    });

    $('#profileModalClose').addEventListener('click', () => closeModal('profileModal'));
    $('#profileModal').addEventListener('click', (e) => {
      if (e.target === $('#profileModal')) closeModal('profileModal');
    });

    $('#profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getUser() || {};
      saveUser({
        ...user,
        name: $('#profileName').value.trim(),
        homeLocation: $('#homeLocation').value.trim(),
        workLocation: $('#workLocation').value.trim(),
        notifications: $('#enableNotifications').checked
      });
      closeModal('profileModal');
      updateAuthUI();
      showToast('Profile saved successfully');
    });

    $('#signOutBtn').addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.user);
      closeModal('profileModal');
      updateAuthUI();
      showToast('Signed out successfully');
    });

    $('#notificationsFeature').addEventListener('click', () => {
      const user = getUser();
      if (user) {
        openModal('profileModal');
      } else {
        openModal('authModal');
        showToast('Sign in to enable notifications');
      }
    });
  }

  function initTransit() {
    $$('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTransitList(currentFilter, $('#transitSearch').value);
      });
    });

    $('#transitSearch').addEventListener('input', (e) => {
      renderTransitList(currentFilter, e.target.value);
    });
  }

  function initCommute() {
    $$('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.mode-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
      });
    });

    $$('.location-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        fillLocation(btn.dataset.location, btn.dataset.preset);
      });
    });

    $('#planRouteBtn').addEventListener('click', planRoutes);
  }

  function initFeedback() {
    $('#feedbackForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const typeMap = {
        traffic: 'Traffic Congestion',
        'transit-delay': 'Transit Delay',
        signal: 'Traffic Signal Issue',
        road: 'Road Condition',
        safety: 'Safety Concern',
        other: 'Other'
      };

      const report = {
        id: Date.now(),
        type: typeMap[$('#feedbackType').value] || 'Other',
        location: $('#feedbackLocation').value.trim(),
        details: $('#feedbackDetails').value.trim(),
        time: 'Just now',
        votes: 1
      };

      const reports = [report, ...getReports()];
      saveReports(reports);
      renderCommunityReports();
      $('#feedbackForm').reset();
      showToast('Thank you! Your report has been submitted.');
    });
  }

  function init() {
    initNavigation();
    initAuth();
    initTransit();
    initCommute();
    initFeedback();

    renderTrafficAlerts();
    renderSignalSync();
    renderRoadMap();
    renderTransitList();
    renderCommunityReports();
    updateAuthUI();
    startLiveUpdates();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
