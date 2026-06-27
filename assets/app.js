/* Brampton Smart Transit & Traffic
 * Front-end demo app. All "real-time" data is simulated locally and updated on
 * an interval so the experience feels live without requiring a backend.
 * User accounts, profile and community reports persist in localStorage.
 */
(function () {
  'use strict';

  const STORE = {
    users: 'bst_users',
    session: 'bst_session',
    reports: 'bst_reports',
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  /* ---------------- Brampton data ---------------- */
  const CORRIDORS = [
    'Queen St E', 'Steeles Ave', 'Bovaird Dr', 'Main St N', 'Hurontario St',
    'Bramalea Rd', 'Williams Pkwy', 'Sandalwood Pkwy', 'Chinguacousy Rd',
    'Airport Rd', 'Kennedy Rd', 'Dixie Rd',
  ];
  const ALTERNATES = {
    'Queen St E': 'Vodden St E', 'Steeles Ave': 'Clark Blvd', 'Bovaird Dr': 'Wanless Dr',
    'Main St N': 'Centre St', 'Hurontario St': 'Kennedy Rd', 'Bramalea Rd': 'Torbram Rd',
    'Williams Pkwy': 'Queen St E', 'Sandalwood Pkwy': 'Bovaird Dr',
    'Chinguacousy Rd': 'McLaughlin Rd', 'Airport Rd': 'Goreway Dr',
    'Kennedy Rd': 'McLaughlin Rd', 'Dixie Rd': 'Bramalea Rd',
  };
  const INTERSECTIONS = [
    'Queen & Main', 'Bovaird & Hurontario', 'Steeles & Bramalea',
    'Williams & Kennedy', 'Sandalwood & Chinguacousy', 'Airport & Queen',
  ];
  const ROUTES = [
    { id: '501', name: 'Züm Queen', color: '#e23b3b', kind: 'bus' },
    { id: '511', name: 'Züm Steeles', color: '#0b7a3b', kind: 'bus' },
    { id: '502', name: 'Züm Main', color: '#2f6bd6', kind: 'bus' },
    { id: '23', name: 'Sandalwood', color: '#8a52d6', kind: 'bus' },
    { id: '14', name: 'Torbram', color: '#d68a2f', kind: 'bus' },
    { id: 'GO', name: 'Kitchener GO Line', color: '#1bb55f', kind: 'train' },
    { id: '7', name: 'Kennedy', color: '#d62f8a', kind: 'bus' },
  ];
  const STOPS = ['Bramalea Terminal', 'Downtown Terminal', 'Mount Pleasant GO', 'Trinity Common', 'Shoppers World', 'Bramalea City Centre'];

  /* ---------------- App state ---------------- */
  let state = {
    user: null,
    corridors: [],
    signals: [],
    vehicles: [],
    alerts: [],
    notifCount: 0,
  };
  let tickTimer = null;

  /* ---------------- Auth ---------------- */
  function getUsers() { return read(STORE.users, {}); }

  function signUp(data) {
    const users = getUsers();
    const email = data.email.trim().toLowerCase();
    if (users[email]) return { ok: false, msg: 'An account with that email already exists.' };
    const user = {
      email,
      name: data.name.trim(),
      password: data.password, // demo only — not secure storage
      home: (data.home || '').trim(),
      work: (data.work || '').trim(),
      notify: !!data.notify,
    };
    users[email] = user;
    write(STORE.users, users);
    write(STORE.session, email);
    return { ok: true, user };
  }

  function signIn(email, password) {
    const users = getUsers();
    const u = users[email.trim().toLowerCase()];
    if (!u || u.password !== password) return { ok: false, msg: 'Invalid email or password.' };
    write(STORE.session, u.email);
    return { ok: true, user: u };
  }

  function currentUser() {
    const email = read(STORE.session, null);
    if (!email) return null;
    return getUsers()[email] || null;
  }

  function saveUser(user) {
    const users = getUsers();
    users[user.email] = user;
    write(STORE.users, users);
    state.user = user;
  }

  function logout() {
    localStorage.removeItem(STORE.session);
    location.reload();
  }

  /* ---------------- Simulated live data ---------------- */
  function seedData() {
    state.corridors = CORRIDORS.map((name) => {
      const congestion = rand(8, 95);
      return { name, congestion, speed: speedFor(congestion), alt: ALTERNATES[name] };
    });
    state.signals = INTERSECTIONS.map((name) => ({
      name,
      phase: pick(['green', 'amber', 'red']),
      timer: rand(5, 40),
      queue: rand(0, 22),
      saved: rand(8, 34),
    }));
    state.vehicles = ROUTES.map((r) => makeVehicle(r));
    rebuildAlerts();
  }

  function speedFor(congestion) {
    // Higher congestion => lower km/h
    return clamp(Math.round(70 - congestion * 0.55 + rand(-4, 4)), 8, 75);
  }

  function makeVehicle(route) {
    return {
      ...route,
      stop: pick(STOPS),
      heading: pick(STOPS),
      eta: rand(1, 18),
      crowd: rand(1, 5),
      delayed: Math.random() < 0.25,
    };
  }

  function tick() {
    // Traffic drifts over time
    state.corridors.forEach((c) => {
      c.congestion = clamp(c.congestion + rand(-7, 7), 5, 99);
      c.speed = speedFor(c.congestion);
    });
    // Signals cycle
    state.signals.forEach((s) => {
      s.timer -= 2;
      if (s.timer <= 0) {
        s.phase = s.phase === 'green' ? 'amber' : s.phase === 'amber' ? 'red' : 'green';
        s.timer = s.phase === 'amber' ? rand(3, 5) : rand(15, 40);
      }
      s.queue = clamp(s.queue + rand(-3, 3), 0, 30);
      s.saved = clamp(s.saved + rand(-2, 2), 5, 45);
    });
    // Transit ETAs count down
    state.vehicles.forEach((v) => {
      v.eta -= 1;
      if (v.eta <= 0) {
        Object.assign(v, makeVehicle(ROUTES.find((r) => r.id === v.id)));
        v.eta = rand(6, 18);
      }
      if (Math.random() < 0.15) v.crowd = clamp(v.crowd + rand(-1, 1), 1, 5);
    });

    rebuildAlerts();
    renderActive();
    maybeNotify();
  }

  function rebuildAlerts() {
    const heavy = state.corridors.filter((c) => c.congestion > 75).sort((a, b) => b.congestion - a.congestion);
    const delayed = state.vehicles.filter((v) => v.delayed);
    const alerts = [];
    heavy.slice(0, 3).forEach((c) => alerts.push({
      icon: '🚗', text: `Heavy traffic on ${c.name} (${c.congestion}%). Try ${c.alt}.`,
    }));
    delayed.slice(0, 2).forEach((v) => alerts.push({
      icon: v.kind === 'train' ? '🚆' : '🚌', text: `Route ${v.id} ${v.name} is running late toward ${v.heading}.`,
    }));
    if (!alerts.length) alerts.push({ icon: '✅', text: 'Traffic is flowing well across Brampton right now.' });
    state.alerts = alerts;
  }

  let lastAlertSig = '';
  function maybeNotify() {
    const topHeavy = state.corridors.filter((c) => c.congestion > 85).map((c) => c.name).join(',');
    if (topHeavy && topHeavy !== lastAlertSig && state.user?.notify) {
      const name = topHeavy.split(',')[0];
      toast(`⚠️ Severe congestion building on ${name}.`, 'warn');
      bumpNotif();
    }
    lastAlertSig = topHeavy;
  }

  /* ---------------- Rendering ---------------- */
  function congClass(c) { return c < 40 ? 'ok' : c < 75 ? 'mod' : 'bad'; }
  function congColor(c) { return c < 40 ? 'var(--green-500)' : c < 75 ? 'var(--amber)' : 'var(--red)'; }
  function congLabel(c) { return c < 40 ? 'Clear' : c < 75 ? 'Moderate' : 'Heavy'; }

  function renderDashboard() {
    const avg = Math.round(state.corridors.reduce((s, c) => s + c.congestion, 0) / state.corridors.length);
    const nextBus = [...state.vehicles].sort((a, b) => a.eta - b.eta)[0];
    const saved = Math.round(state.signals.reduce((s, x) => s + x.saved, 0) / state.signals.length);
    statRow($('#dash-stats'), [
      { label: 'City congestion', value: `${avg}<span class="unit">%</span>`, color: congColor(avg) },
      { label: 'Next departure', value: `${nextBus.eta}<span class="unit">min</span>`, sub: `Rt ${nextBus.id}` },
      { label: 'Avg time saved', value: `${saved}<span class="unit">s</span>`, sub: 'smart signals' },
      { label: 'Active alerts', value: state.alerts.length },
    ]);

    const u = state.user;
    $('#dash-commute').innerHTML = u && (u.home || u.work)
      ? `<span>From <b>${esc(u.home || 'Home')}</b> to <b>${esc(u.work || 'Work')}</b></span>
         <span>Suggested: <b>${pick(['Transit + walk', 'Drive', 'Bike + transit'])}</b> · ~${rand(18, 42)} min</span>`
      : `<span class="muted">Set your home and work locations to get personalized suggestions.</span>`;

    renderAlertList($('#dash-alerts'));
  }

  function renderAlertList(ul) {
    ul.innerHTML = state.alerts.map((a) => `<li><span class="ico">${a.icon}</span><span>${esc(a.text)}</span></li>`).join('');
  }

  function renderTraffic() {
    const avg = Math.round(state.corridors.reduce((s, c) => s + c.congestion, 0) / state.corridors.length);
    const worst = [...state.corridors].sort((a, b) => b.congestion - a.congestion)[0];
    const clear = state.corridors.filter((c) => c.congestion < 40).length;
    statRow($('#traffic-stats'), [
      { label: 'Average congestion', value: `${avg}<span class="unit">%</span>`, color: congColor(avg) },
      { label: 'Busiest corridor', value: worst.name, small: true },
      { label: 'Clear corridors', value: `${clear}<span class="unit">/${state.corridors.length}</span>` },
    ]);

    $('#traffic-list').innerHTML = [...state.corridors]
      .sort((a, b) => b.congestion - a.congestion)
      .map((c) => `
        <div class="road">
          <div class="road__name">${esc(c.name)}</div>
          <span class="pill pill--${congClass(c.congestion)}">${congLabel(c.congestion)}</span>
          <div class="road__meta">${c.speed} km/h avg · ${c.congestion}% congestion</div>
          <div class="bar"><div class="bar__fill" style="width:${c.congestion}%;background:${congColor(c.congestion)}"></div></div>
          ${c.congestion > 65 ? `<div class="road__alt">↪ Alternate: take ${esc(c.alt)}</div>` : ''}
        </div>`).join('');
  }

  function renderLights() {
    const saved = Math.round(state.signals.reduce((s, x) => s + x.saved, 0) / state.signals.length);
    const greens = state.signals.filter((s) => s.phase === 'green').length;
    statRow($('#lights-stats'), [
      { label: 'Synced intersections', value: state.signals.length },
      { label: 'Avg stop time saved', value: `${saved}<span class="unit">s</span>`, color: 'var(--green-500)' },
      { label: 'Currently green', value: `${greens}<span class="unit">/${state.signals.length}</span>` },
    ]);

    $('#lights-grid').innerHTML = state.signals.map((s) => `
      <div class="signal">
        <div class="signal__top">
          <span class="signal__lights">
            <span class="lamp red ${s.phase === 'red' ? 'on' : ''}"></span>
            <span class="lamp amber ${s.phase === 'amber' ? 'on' : ''}"></span>
            <span class="lamp green ${s.phase === 'green' ? 'on' : ''}"></span>
          </span>
          <span class="signal__meta">${s.timer}s</span>
        </div>
        <div class="signal__name">${esc(s.name)}</div>
        <div class="signal__meta">Queue: ${s.queue} vehicles · saving ${s.saved}s</div>
      </div>`).join('');
  }

  function renderTransit() {
    const q = ($('#transit-search').value || '').toLowerCase();
    const list = state.vehicles.filter((v) =>
      !q || v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) ||
      v.stop.toLowerCase().includes(q) || v.heading.toLowerCase().includes(q));
    const el = $('#transit-list');
    if (!list.length) { el.innerHTML = `<p class="muted">No routes match “${esc(q)}”.</p>`; return; }
    el.innerHTML = list.sort((a, b) => a.eta - b.eta).map((v) => `
      <div class="vehicle">
        <div class="vehicle__route" style="background:${v.color}">${v.id}</div>
        <div>
          <div class="vehicle__name">${v.kind === 'train' ? '🚆' : '🚌'} ${esc(v.name)}</div>
          <div class="vehicle__sub">At ${esc(v.stop)} → ${esc(v.heading)}${v.delayed ? ' · <span style="color:var(--amber)">delayed</span>' : ''}</div>
          <div class="crowd" title="Crowding">${[1,2,3,4,5].map((n) => `<i class="${n <= v.crowd ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <div class="vehicle__eta"><b>${v.eta}</b><div class="vehicle__sub">min</div></div>
      </div>`).join('');
  }

  function renderActive() {
    const v = $('.view.is-active')?.dataset.view;
    if (v === 'dashboard') renderDashboard();
    else if (v === 'traffic') renderTraffic();
    else if (v === 'lights') renderLights();
    else if (v === 'transit') renderTransit();
    updateClock();
  }

  function statRow(container, stats) {
    container.innerHTML = stats.map((s) => `
      <div class="stat">
        <div class="stat__label">${esc(s.label)}</div>
        <div class="stat__value" style="${s.color ? `color:${s.color}` : ''};${s.small ? 'font-size:1.1rem' : ''}">${s.value}</div>
        ${s.sub ? `<div class="stat__label">${esc(s.sub)}</div>` : ''}
      </div>`).join('');
  }

  /* ---------------- Planner ---------------- */
  function planRoutes(from, to, priority) {
    const baseTraffic = Math.round(state.corridors.reduce((s, c) => s + c.congestion, 0) / state.corridors.length);
    const trafficFactor = 1 + baseTraffic / 120;
    const options = [
      { mode: '🚗 Drive', legs: ['Drive'], time: Math.round(rand(14, 26) * trafficFactor), co2: rand(2200, 3600), cost: rand(4, 9) },
      { mode: '🚌 Transit', legs: ['Walk', `Rt ${pick(ROUTES).id}`, 'Walk'], time: rand(24, 40), co2: rand(300, 700), cost: 4 },
      { mode: '🚴 Bike + Transit', legs: ['Bike', `Rt ${pick(ROUTES).id}`], time: rand(22, 38), co2: rand(150, 400), cost: 4 },
      { mode: '🚶 Walk', legs: ['Walk'], time: rand(40, 70), co2: 0, cost: 0 },
    ];
    options.forEach((o) => {
      o.score = priority === 'greenest' ? o.co2 + o.time * 5
        : priority === 'cheapest' ? o.cost * 100 + o.time
        : o.time;
    });
    return options.sort((a, b) => a.score - b.score);
  }

  function renderRoutes(routes, from, to) {
    $('#planner-results').innerHTML = routes.map((r, i) => `
      <div class="route">
        <div class="route__head">
          <span class="route__mode">${r.mode}${i === 0 ? ' · <span style="color:var(--green-500)">Recommended</span>' : ''}</span>
          <span class="route__time"><b>${r.time}</b> min</span>
        </div>
        <div class="muted small">${esc(from)} → ${esc(to)}</div>
        <div class="route__legs">${r.legs.map((l) => `<span class="leg">${esc(l)}</span>`).join('')}</div>
        <div class="route__stats">
          <span>🌿 ${r.co2 === 0 ? 'Zero' : r.co2 + 'g'} CO₂</span>
          <span>💲 ${r.cost === 0 ? 'Free' : '$' + r.cost.toFixed(2)}</span>
        </div>
      </div>`).join('');
  }

  /* ---------------- Community reports ---------------- */
  function getReports() { return read(STORE.reports, seedReports()); }

  function seedReports() {
    const base = [
      { type: 'Congestion', location: 'Queen St & Main St', details: 'Backed up past the underpass.', mins: 6, votes: 12 },
      { type: 'Collision', location: 'Bovaird & Hurontario', details: 'Two-car fender bender, right lane blocked.', mins: 24, votes: 31 },
      { type: 'Transit delay', location: 'Bramalea Terminal', details: 'Route 511 about 10 min behind.', mins: 41, votes: 8 },
    ];
    const now = Date.now();
    const seeded = base.map((b, i) => ({ id: 'seed' + i, ...b, ts: now - b.mins * 60000, by: 'Community' }));
    write(STORE.reports, seeded);
    return seeded;
  }

  function addReport(r) {
    const reports = getReports();
    reports.unshift({ id: 'r' + Date.now(), ts: Date.now(), votes: 0, by: state.user?.name || 'You', ...r });
    write(STORE.reports, reports);
    return reports;
  }

  function renderReports() {
    const reports = getReports();
    $('#reports-list').innerHTML = reports.map((r) => `
      <li class="report-item" data-id="${r.id}">
        <div class="report-item__top">
          <span class="report-item__type">${esc(r.type)}</span>
          <span class="report-item__time">${timeAgo(r.ts)}</span>
        </div>
        <div class="report-item__loc">📍 ${esc(r.location)}</div>
        ${r.details ? `<div class="report-item__details">${esc(r.details)}</div>` : ''}
        <div class="report-item__foot">
          <button class="upvote" data-vote="${r.id}">👍 ${r.votes}</button>
          <span class="report-item__time">by ${esc(r.by)}</span>
        </div>
      </li>`).join('');
  }

  function timeAgo(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    return `${h} h ago`;
  }

  /* ---------------- UI helpers ---------------- */
  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(text, kind) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ` toast--${kind}` : '');
    el.textContent = text;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4200);
  }

  function bumpNotif() {
    state.notifCount += 1;
    const b = $('#notif-count');
    b.textContent = state.notifCount;
    b.classList.remove('is-hidden');
  }

  function updateClock() {
    const el = $('#clock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
  }

  function navTo(view) {
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === view));
    $$('.nav__item').forEach((n) => n.classList.toggle('is-active', n.dataset.nav === view));
    renderActive();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Boot ---------------- */
  function startApp(user) {
    state.user = user;
    $('#auth').classList.add('is-hidden');
    $('#app').classList.remove('is-hidden');

    const hour = new Date().getHours();
    $('#greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${user.name.split(' ')[0]}!`;
    $('#user-initials').textContent = user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

    // Account form
    const af = $('#account-form');
    af.name.value = user.name; af.email.value = user.email;
    af.home.value = user.home || ''; af.work.value = user.work || '';
    af.notify.checked = !!user.notify;

    seedData();
    renderReports();
    renderActive();

    tickTimer = setInterval(tick, 3000);
    setInterval(updateClock, 1000);

    if (user.notify) setTimeout(() => toast('🔔 Live alerts are on for your daily travels.', 'info'), 800);
  }

  function bindEvents() {
    // Auth tabs
    $$('.auth__tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.auth__tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      const which = tab.dataset.authtab;
      $('#form-signin').classList.toggle('is-hidden', which !== 'signin');
      $('#form-signup').classList.toggle('is-hidden', which !== 'signup');
    }));

    $('#form-signin').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const res = signIn(f.email.value, f.password.value);
      if (!res.ok) { $('#signin-hint').textContent = res.msg; return; }
      startApp(res.user);
    });

    $('#form-signup').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const res = signUp({
        name: f.name.value, email: f.email.value, password: f.password.value,
        home: f.home.value, work: f.work.value, notify: f.notify.checked,
      });
      if (!res.ok) { $('#signup-hint').textContent = res.msg; return; }
      startApp(res.user);
    });

    $$('[data-social]').forEach((b) => b.addEventListener('click', () => {
      const provider = b.dataset.social;
      const email = `demo.${provider.toLowerCase()}@bramptonsmarttransit.ca`;
      const users = getUsers();
      if (!users[email]) {
        users[email] = { email, name: `${provider} User`, password: '', home: 'Mount Pleasant', work: 'Downtown Brampton', notify: true };
        write(STORE.users, users);
      }
      write(STORE.session, email);
      startApp(users[email]);
    }));

    // Navigation
    $$('.nav__item').forEach((n) => n.addEventListener('click', () => navTo(n.dataset.nav)));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => navTo(b.dataset.goto)));
    $('#user-btn').addEventListener('click', () => navTo('account'));
    $('#notif-btn').addEventListener('click', () => {
      state.notifCount = 0;
      $('#notif-count').classList.add('is-hidden');
      navTo('dashboard');
    });

    // Transit search
    $('#transit-search').addEventListener('input', renderTransit);

    // Planner
    $('#planner-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const from = f.from.value || state.user?.home || 'Home';
      const to = f.to.value || state.user?.work || 'Work';
      renderRoutes(planRoutes(from, to, f.priority.value), from, to);
    });

    // Community report
    $('#report-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      addReport({ type: f.type.value, location: f.location.value, details: f.details.value });
      renderReports();
      f.reset();
      toast('✅ Thanks! Your report was shared with the community.', 'info');
    });

    $('#reports-list').addEventListener('click', (e) => {
      const id = e.target.closest('[data-vote]')?.dataset.vote;
      if (!id) return;
      const reports = getReports();
      const r = reports.find((x) => x.id === id);
      if (r) { r.votes += 1; write(STORE.reports, reports); renderReports(); }
    });

    // Account
    $('#account-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const u = { ...state.user, name: f.name.value, home: f.home.value, work: f.work.value, notify: f.notify.checked };
      saveUser(u);
      $('#user-initials').textContent = u.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
      $('#account-hint').textContent = 'Saved ✓';
      $('#account-hint').style.color = 'var(--green-500)';
      setTimeout(() => { $('#account-hint').textContent = ''; }, 2500);
    });
    $('#logout-btn').addEventListener('click', logout);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    const u = currentUser();
    if (u) startApp(u);
  });
})();
