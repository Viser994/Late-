/* ===== BRAMPTON SMART TRANSIT & TRAFFIC — APP.JS ===== */

// ── State ──────────────────────────────────────────────
const state = {
  currentSection: 'home',
  loggedIn: false,
  user: null,
  trafficFilter: 'all',
  selectedMode: 'transit',
  selectedReportType: 'traffic',
  lightStates: [],
  lightInterval: null,
  reportVotes: {},
};

// ── Data ───────────────────────────────────────────────
const TRAFFIC_ALERTS = [
  { id: 1, type: 'incident', color: 'red', typeLabel: '⚠️ Incident', location: 'Queen St E & Kennedy Rd', desc: 'Multi-vehicle collision. Expect 25 min delay.', time: '2 min ago' },
  { id: 2, type: 'congestion', color: 'red', typeLabel: '🚗 Congestion', location: 'Hwy 410 Northbound', desc: 'Heavy congestion near Bovaird Dr. Crawling traffic.', time: '5 min ago' },
  { id: 3, type: 'construction', color: 'yellow', typeLabel: '🚧 Construction', location: 'Main St N — Willowdale', desc: 'Lane reduction. Resurfacing until July 15.', time: '1 hr ago' },
  { id: 4, type: 'congestion', color: 'yellow', typeLabel: '🚗 Congestion', location: 'Steeles Ave W & Airport Rd', desc: 'Moderate congestion. Allow 10 extra minutes.', time: '8 min ago' },
  { id: 5, type: 'incident', color: 'yellow', typeLabel: '⚠️ Incident', location: 'Bovaird Dr & Chinguacousy Rd', desc: 'Fender bender cleared. Traffic returning to normal.', time: '14 min ago' },
  { id: 6, type: 'construction', color: 'green', typeLabel: '✅ Cleared', location: 'Clark Blvd & Bramalea Rd', desc: 'Earlier incident fully cleared. All lanes open.', time: '22 min ago' },
];

const BUS_ROUTES = [
  { num: '1', name: 'Queen', desc: 'Downtown ↔ Bramalea City Centre', arrivals: [{ time: '8:14 AM', mins: 2, occ: 'high' }, { time: '8:29 AM', mins: 17, occ: 'medium' }, { time: '8:44 AM', mins: 32, occ: 'low' }] },
  { num: '2', name: 'Main', desc: 'Brampton GO ↔ Steeles Ave', arrivals: [{ time: '8:18 AM', mins: 6, occ: 'low' }, { time: '8:33 AM', mins: 21, occ: 'low' }, { time: '8:48 AM', mins: 36, occ: 'low' }] },
  { num: '4', name: 'Bovaird', desc: 'Mount Pleasant GO ↔ Trinity Common', arrivals: [{ time: '8:12 AM', mins: 0, occ: 'medium' }, { time: '8:27 AM', mins: 15, occ: 'high' }, { time: '8:42 AM', mins: 30, occ: 'low' }] },
  { num: '7', name: 'McLaughlin', desc: 'Bramlea GO ↔ Sandalwood Pkwy', arrivals: [{ time: '8:20 AM', mins: 8, occ: 'low' }, { time: '8:35 AM', mins: 23, occ: 'medium' }, { time: '8:50 AM', mins: 38, occ: 'low' }] },
  { num: '10', name: 'Chinguacousy', desc: 'Shoppers World ↔ Heart Lake Rd', arrivals: [{ time: '8:16 AM', mins: 4, occ: 'high' }, { time: '8:31 AM', mins: 19, occ: 'medium' }, { time: '8:46 AM', mins: 34, occ: 'low' }] },
  { num: '15', name: 'Airport', desc: 'Williams Pkwy ↔ Pearson Airport', arrivals: [{ time: '8:25 AM', mins: 13, occ: 'medium' }, { time: '8:55 AM', mins: 43, occ: 'low' }] },
  { num: '18', name: 'Steeles', desc: 'Bramalea City Centre ↔ Etobicoke', arrivals: [{ time: '8:11 AM', mins: 0, occ: 'low' }, { time: '8:26 AM', mins: 14, occ: 'low' }, { time: '8:41 AM', mins: 29, occ: 'medium' }] },
  { num: '24', name: 'Sandalwood', desc: 'Mount Pleasant GO ↔ Heart Lake', arrivals: [{ time: '8:19 AM', mins: 7, occ: 'medium' }, { time: '8:34 AM', mins: 22, occ: 'high' }, { time: '8:49 AM', mins: 37, occ: 'low' }] },
];

const GO_TRAINS = [
  { line: 'Kitchener', route: 'Bramalea GO → Union Station', stops: 'Malton · Weston · Bloor', departs: '8:15 AM', status: 'on-time' },
  { line: 'Kitchener', route: 'Brampton GO → Union Station', stops: 'Georgetown · Bloor · Union', departs: '8:32 AM', status: 'on-time' },
  { line: 'Kitchener', route: 'Mount Pleasant GO → Union', stops: 'Bramalea · Weston · Union', departs: '8:48 AM', status: 'delayed', delay: '+4 min' },
  { line: 'Kitchener', route: 'Union Station → Brampton GO', stops: 'Bloor · Weston · Malton', departs: '8:55 AM', status: 'on-time' },
];

const NEARBY_STOPS = [
  { name: 'Queen & Kennedy (Stop 200)', routes: 'Routes 1, 51, 10', distance: '80 m', icon: '🚏' },
  { name: 'Bramalea City Centre Terminal', routes: 'Routes 1, 2, 4, 7, 10, 15', distance: '340 m', icon: '🏢' },
  { name: 'Brampton GO Station', routes: 'GO Train · Routes 1, 2, 21', distance: '1.2 km', icon: '🚆' },
  { name: 'Main & Vodden (Stop 143)', routes: 'Routes 2, 56, 17', distance: '400 m', icon: '🚏' },
  { name: 'Shoppers World Brampton', routes: 'Routes 15, 24, 4', distance: '900 m', icon: '🛍️' },
];

const COMMUNITY_REPORTS = [
  { user: 'TJ', name: 'Tyler J.', type: 'traffic', location: 'Hwy 410 & Bovaird Dr N', desc: 'Bumper to bumper since 7:40 AM. Merge lane blocked.', time: '4 min ago', severity: 3, votes: 14 },
  { user: 'AS', name: 'Aisha S.', type: 'bus-delay', location: 'Route 1 — Queen St stops', desc: 'Bus 1A running ~12 minutes late at Kennedy Rd.', time: '9 min ago', severity: 2, votes: 22 },
  { user: 'RK', name: 'Raj K.', type: 'construction', location: 'Main St N near Williams Pkwy', desc: 'Down to one lane. Takes 15 extra mins.', time: '23 min ago', severity: 2, votes: 8 },
  { user: 'ML', name: 'Maria L.', type: 'accident', location: 'Steeles Ave W & Hurontario', desc: 'Minor fender-bender. Police on scene. Left lane blocked.', time: '31 min ago', severity: 2, votes: 17 },
  { user: 'DW', name: 'Daniel W.', type: 'hazard', location: 'Sandalwood Pkwy & Chinguacousy', desc: 'Large pothole in right lane causing slowdowns.', time: '52 min ago', severity: 1, votes: 6 },
];

const STREETS = [
  { name: 'Queen St E', x1: 80, y1: 200, x2: 620, y2: 200, status: 'red' },
  { name: 'Bovaird Dr', x1: 80, y1: 120, x2: 620, y2: 120, status: 'yellow' },
  { name: 'Steeles Ave', x1: 80, y1: 370, x2: 620, y2: 370, status: 'red' },
  { name: 'Sandalwood', x1: 80, y1: 290, x2: 620, y2: 290, status: 'green' },
  { name: 'Airport Rd', x1: 160, y1: 50, x2: 160, y2: 450, status: 'green' },
  { name: 'Bramalea Rd', x1: 280, y1: 50, x2: 280, y2: 450, status: 'yellow' },
  { name: 'Chinguacousy', x1: 400, y1: 50, x2: 400, y2: 450, status: 'red' },
  { name: 'Kennedy Rd', x1: 520, y1: 50, x2: 520, y2: 450, status: 'green' },
];

const LIGHT_STREETS = ['Airport Rd', 'Bramalea Rd', 'Chinguacousy Rd', 'Kennedy Rd', 'McLaughlin Rd', 'Hurontario St'];

// ── Navigation ─────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');
  const link = document.querySelector(`.nav-link[data-section="${name}"]`);
  if (link) link.classList.add('active');
  state.currentSection = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeNav();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

// Hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
function closeNav() { navLinks.classList.remove('open'); }

// Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── Modal ──────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}
function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

// ── Auth ───────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const name = email.split('@')[0];
  loginUser(name);
  closeModal('loginModal');
  showToast('success', `✅ Welcome back, ${name}!`);
}

function handleSignup(e) {
  e.preventDefault();
  const first = document.getElementById('signupFirst').value;
  const last = document.getElementById('signupLast').value;
  loginUser(`${first} ${last}`);
  closeModal('signupModal');
  showToast('success', `🎉 Account created! Welcome, ${first}!`);
}

function socialLogin(provider) {
  loginUser(`${provider} User`);
  closeModal('loginModal');
  closeModal('signupModal');
  showToast('success', `✅ Signed in with ${provider}`);
}

function loginUser(name) {
  state.loggedIn = true;
  state.user = { name };
  document.getElementById('loginBtn').classList.add('hidden');
  document.getElementById('signupBtn').classList.add('hidden');
  const menu = document.getElementById('userMenu');
  menu.classList.remove('hidden');
  const short = name.trim().split(' ')[0];
  document.getElementById('userAvatar').textContent = name[0].toUpperCase();
  document.getElementById('userName').textContent = short;
}

function logout() {
  state.loggedIn = false;
  state.user = null;
  document.getElementById('loginBtn').classList.remove('hidden');
  document.getElementById('signupBtn').classList.remove('hidden');
  document.getElementById('userMenu').classList.add('hidden');
  showToast('info', 'You have been signed out.');
}

// ── Toast ──────────────────────────────────────────────
function showToast(type, msg, duration = 4000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Traffic Map (SVG) ──────────────────────────────────
function initTrafficMap() {
  const svg = document.getElementById('mapSVG');
  if (!svg) return;

  // Background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '700');
  bg.setAttribute('height', '500');
  bg.setAttribute('fill', '#1a2744');
  svg.appendChild(bg);

  // Grid lines
  for (let x = 0; x <= 700; x += 70) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', 0);
    line.setAttribute('x2', x); line.setAttribute('y2', 500);
    line.setAttribute('stroke', '#253561'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }
  for (let y = 0; y <= 500; y += 50) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0); line.setAttribute('y1', y);
    line.setAttribute('x2', 700); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#253561'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  const colorMap = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };

  STREETS.forEach(road => {
    const roadLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    roadLine.setAttribute('x1', road.x1); roadLine.setAttribute('y1', road.y1);
    roadLine.setAttribute('x2', road.x2); roadLine.setAttribute('y2', road.y2);
    roadLine.setAttribute('stroke', '#2d3e6a');
    roadLine.setAttribute('stroke-width', '10');
    roadLine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(roadLine);

    const colorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    colorLine.setAttribute('x1', road.x1); colorLine.setAttribute('y1', road.y1);
    colorLine.setAttribute('x2', road.x2); colorLine.setAttribute('y2', road.y2);
    colorLine.setAttribute('stroke', colorMap[road.status]);
    colorLine.setAttribute('stroke-width', '3');
    colorLine.setAttribute('stroke-linecap', 'round');
    colorLine.setAttribute('opacity', '0.9');
    svg.appendChild(colorLine);

    // Street label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const isHoriz = road.y1 === road.y2;
    label.setAttribute('x', isHoriz ? 88 : road.x1 + 5);
    label.setAttribute('y', isHoriz ? road.y1 - 8 : road.y1 + 18);
    label.setAttribute('fill', '#8899cc');
    label.setAttribute('font-size', '9.5');
    label.setAttribute('font-family', 'Inter, sans-serif');
    label.setAttribute('font-weight', '600');
    label.textContent = road.name;
    svg.appendChild(label);
  });

  // Moving vehicle dots
  animateVehicles(svg);
}

function animateVehicles(svg) {
  const vehicles = [
    { x: 80, y: 200, dx: 2.5, dy: 0, color: '#60a5fa' },
    { x: 400, y: 120, dx: -1.8, dy: 0, color: '#f87171' },
    { x: 160, y: 80, dx: 0, dy: 1.5, color: '#4ade80' },
    { x: 280, y: 300, dx: 0, dy: -2, color: '#fbbf24' },
    { x: 300, y: 370, dx: 1.6, dy: 0, color: '#a78bfa' },
    { x: 520, y: 200, dx: 0, dy: 2, color: '#34d399' },
  ];

  const dots = vehicles.map(v => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', v.x);
    circle.setAttribute('cy', v.y);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', v.color);
    circle.setAttribute('filter', 'url(#glow)');
    svg.appendChild(circle);
    return { el: circle, ...v };
  });

  // Glow filter
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
  svg.insertBefore(defs, svg.firstChild);

  function step() {
    dots.forEach(d => {
      d.x += d.dx;
      d.y += d.dy;
      if (d.x > 680) d.x = 50;
      if (d.x < 50) d.x = 680;
      if (d.y > 470) d.y = 30;
      if (d.y < 30) d.y = 470;
      d.el.setAttribute('cx', d.x);
      d.el.setAttribute('cy', d.y);
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Traffic Light Sync ─────────────────────────────────
function initLightSync() {
  const row = document.getElementById('lightSyncRow');
  if (!row) return;

  state.lightStates = LIGHT_STREETS.map((name, i) => ({
    name,
    phase: i % 3, // 0=red, 1=yellow, 2=green
    countdown: 12 - (i * 4),
  }));

  renderLights();

  if (state.lightInterval) clearInterval(state.lightInterval);
  state.lightInterval = setInterval(() => {
    state.lightStates.forEach(l => {
      l.countdown--;
      if (l.countdown <= 0) {
        l.phase = (l.phase + 1) % 3;
        l.countdown = l.phase === 0 ? 15 : l.phase === 1 ? 4 : 18;
      }
    });
    renderLights();
  }, 1000);
}

function renderLights() {
  const row = document.getElementById('lightSyncRow');
  if (!row) return;
  row.innerHTML = '';
  state.lightStates.forEach(l => {
    const wrap = document.createElement('div');
    wrap.className = 'traffic-light-wrap';
    const box = document.createElement('div');
    box.className = 'traffic-light-box';
    ['red', 'yellow', 'green'].forEach((color, ci) => {
      const dot = document.createElement('div');
      dot.className = `tl-dot${l.phase === ci ? ` active-${color}` : ''}`;
      box.appendChild(dot);
    });
    const label = document.createElement('div');
    label.className = 'tl-street';
    label.textContent = l.name.split(' ')[0];
    wrap.appendChild(box);
    wrap.appendChild(label);
    row.appendChild(wrap);
  });
}

// ── Traffic Alerts ─────────────────────────────────────
function renderAlerts(filter = 'all') {
  const list = document.getElementById('alertsList');
  if (!list) return;
  const filtered = filter === 'all' ? TRAFFIC_ALERTS : TRAFFIC_ALERTS.filter(a => a.type === filter);
  list.innerHTML = filtered.map(a => `
    <div class="alert-card ${a.color}">
      <div class="alert-header">
        <span class="alert-type" style="color:${a.color === 'red' ? '#ef4444' : a.color === 'yellow' ? '#f59e0b' : '#10b981'}">${a.typeLabel}</span>
        <span class="alert-time">${a.time}</span>
      </div>
      <div class="alert-location">${a.location}</div>
      <div class="alert-desc">${a.desc}</div>
    </div>
  `).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.trafficFilter = btn.dataset.filter;
    renderAlerts(state.trafficFilter);
  });
});

// ── Transit Routes ─────────────────────────────────────
function renderRoutes(filter = '') {
  const grid = document.getElementById('routesGrid');
  if (!grid) return;
  const f = filter.toLowerCase();
  const routes = f ? BUS_ROUTES.filter(r =>
    r.num.includes(f) || r.name.toLowerCase().includes(f) || r.desc.toLowerCase().includes(f)
  ) : BUS_ROUTES;

  grid.innerHTML = routes.map(r => `
    <div class="route-card">
      <div class="route-header">
        <div class="route-number">${r.num}</div>
        <div class="route-info">
          <div class="route-name">Route ${r.num} — ${r.name}</div>
          <div class="route-desc">${r.desc}</div>
        </div>
      </div>
      <div class="arrival-list">
        ${r.arrivals.map(a => `
          <div class="arrival-item">
            <span class="arrival-time">${a.time}</span>
            <span class="arrival-countdown ${a.mins === 0 ? 'arriving' : a.mins < 10 ? 'soon' : 'later'}">
              ${a.mins === 0 ? 'Arriving' : `${a.mins} min`}
            </span>
            ${renderOccupancy(a.occ)}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderOccupancy(level) {
  const map = { low: 1, medium: 2, high: 3 };
  const n = map[level] || 1;
  return `<div class="occupancy" title="${level} occupancy">
    ${[1,2,3].map(i => `<div class="occ-bar${i <= n ? ` filled ${level}` : ''}"></div>`).join('')}
  </div>`;
}

function filterRoutes() {
  const val = document.getElementById('routeSearch')?.value || '';
  renderRoutes(val);
}

// ── GO Trains ──────────────────────────────────────────
function renderGoTrains() {
  const el = document.getElementById('goTrains');
  if (!el) return;
  el.innerHTML = GO_TRAINS.map(t => `
    <div class="go-card">
      <div class="go-badge">GO</div>
      <div class="go-info">
        <div class="go-route">${t.route}</div>
        <div class="go-stops">Via ${t.stops}</div>
      </div>
      <div class="go-time">
        <div class="go-departs">${t.departs}</div>
        <div class="go-status ${t.status}">${t.status === 'on-time' ? '✅ On Time' : `⚠️ Delayed ${t.delay}`}</div>
      </div>
    </div>
  `).join('');
}

// ── Nearby Stops ───────────────────────────────────────
function renderStops() {
  const el = document.getElementById('stopsList');
  if (!el) return;
  el.innerHTML = NEARBY_STOPS.map(s => `
    <div class="stop-card">
      <div class="stop-icon">${s.icon}</div>
      <div class="stop-info">
        <div class="stop-name">${s.name}</div>
        <div class="stop-routes">${s.routes}</div>
      </div>
      <div class="stop-distance">${s.distance}</div>
    </div>
  `).join('');
}

function switchTransitTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.transit-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`transit-${tab}`)?.classList.remove('hidden');
}

// ── Commute Planner ────────────────────────────────────
function initPlanner() {
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('departDate');
  if (dateEl) dateEl.value = today;

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMode = btn.dataset.mode;
    });
  });
}

function useSavedLocation(direction) {
  if (!state.loggedIn) {
    showToast('info', '💡 Sign in to use saved home and work locations.');
    return;
  }
  if (direction === 'from') {
    document.getElementById('fromLocation').value = '100 Queen St W, Brampton';
  } else {
    document.getElementById('toLocation').value = 'Bramalea City Centre, Brampton';
  }
}

function planRoute() {
  const from = document.getElementById('fromLocation')?.value.trim();
  const to = document.getElementById('toLocation')?.value.trim();
  if (!from || !to) {
    showToast('warning', '⚠️ Please enter both a start and destination.');
    return;
  }

  const mode = state.selectedMode;
  const time = document.getElementById('departTime')?.value || '08:30';

  const resultsEl = document.getElementById('plannerResults');

  const routes = generateRoutes(mode, from, to, time);
  resultsEl.innerHTML = routes.map((r, i) => `
    <div class="route-result-card${i === 0 ? ' recommended' : ''}">
      <div class="result-header${i === 0 ? ' recommended' : ''}">
        ${i === 0 ? '<span class="rec-badge">⭐ Recommended</span>' : ''}
        <div>
          <div class="result-duration">${r.duration} min</div>
          <div class="result-label">${r.label}</div>
        </div>
        <div class="result-modes">
          ${r.modes.map(m => `<span class="mode-tag">${m}</span>`).join('')}
        </div>
      </div>
      <div class="result-steps">
        ${r.steps.map(s => `
          <div class="result-step">
            <div class="step-icon">${s.icon}</div>
            <div class="step-text">
              <div class="step-main">${s.main}</div>
              <div class="step-detail">${s.detail}</div>
            </div>
            <div class="step-time">${s.time}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function generateRoutes(mode, from, to, time) {
  const base = [
    {
      duration: 28,
      label: 'Fastest • Low traffic expected',
      modes: ['🚌 Transit', '🚶 Walk'],
      steps: [
        { icon: '🚶', main: `Walk to nearest stop`, detail: 'From your location — 4 min', time: '4 min' },
        { icon: '🚌', main: 'Board Route 1 — Queen St', detail: 'Departs 8:14 AM · 6 stops', time: '14 min' },
        { icon: '🔄', main: 'Transfer at Bramalea City Centre', detail: 'Walk to Terminal B — 3 min', time: '3 min' },
        { icon: '🚌', main: 'Board Route 4 — Bovaird', detail: 'Departs 8:33 AM · 3 stops', time: '7 min' },
      ]
    },
    {
      duration: 34,
      label: 'Standard transit via Queen & Bramalea',
      modes: ['🚌 Transit'],
      steps: [
        { icon: '🚶', main: 'Walk to Queen St stop', detail: '6 min walk', time: '6 min' },
        { icon: '🚌', main: 'Route 1 — Direct to destination area', detail: 'Departs 8:18 AM · 10 stops', time: '22 min' },
        { icon: '🚶', main: 'Walk to destination', detail: '6 min', time: '6 min' },
      ]
    },
    {
      duration: 19,
      label: 'Drive — Some congestion on Queen St',
      modes: ['🚗 Drive'],
      steps: [
        { icon: '🚗', main: `Drive via Queen St & Kennedy Rd`, detail: 'Moderate traffic ahead — save 3 min via Bovaird', time: '15 min' },
        { icon: '🅿️', main: 'Parking near destination', detail: 'City lot on Main St — $5/day', time: '4 min' },
      ]
    },
  ];

  if (mode === 'bike') return [{
    duration: 22,
    label: 'Cycling route via Flower City trails',
    modes: ['🚴 Bike'],
    steps: [
      { icon: '🚴', main: 'Cycle via Etobicoke Creek Trail', detail: 'Dedicated bike path — mostly flat', time: '18 min' },
      { icon: '🚴', main: 'Continue via Bovaird Dr bike lane', detail: 'Protected lane for 1.2 km', time: '4 min' },
    ]
  }, ...base];

  if (mode === 'walk') return [{
    duration: 58,
    label: 'Walking route',
    modes: ['🚶 Walk'],
    steps: [
      { icon: '🚶', main: 'Walk via Main St & Queen St', detail: 'Sidewalks available full route', time: '58 min' },
    ]
  }];

  return base;
}

// ── Community Reports ──────────────────────────────────
function initFeedback() {
  document.querySelectorAll('.report-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedReportType = btn.dataset.type;
    });
  });
}

function updateSeverity(val) {
  // Visual feedback could be added
}

function submitReport() {
  const location = document.getElementById('reportLocation')?.value.trim();
  const desc = document.getElementById('reportDescription')?.value.trim();
  const type = state.selectedReportType;
  if (!location) {
    showToast('warning', '⚠️ Please enter a location for your report.');
    return;
  }
  const severity = parseInt(document.getElementById('severitySlider')?.value || '2');
  const labels = { traffic: '🚦 Traffic Jam', accident: '⚠️ Accident', construction: '🚧 Construction', 'bus-delay': '🚌 Bus Delay', 'road-closure': '🚫 Road Closure', hazard: '🌊 Hazard' };

  COMMUNITY_REPORTS.unshift({
    user: state.loggedIn ? state.user.name[0].toUpperCase() : 'A',
    name: state.loggedIn ? state.user.name : 'Anonymous',
    type,
    location,
    desc: desc || 'No additional details provided.',
    time: 'Just now',
    severity,
    votes: 0,
  });

  renderFeed();
  document.getElementById('reportLocation').value = '';
  document.getElementById('reportDescription').value = '';
  showToast('success', `✅ Report submitted! Thank you for helping the community.`);
}

function renderFeed() {
  const list = document.getElementById('feedList');
  if (!list) return;
  const severityLabel = ['', 'Minor', 'Moderate', 'Severe'];
  list.innerHTML = COMMUNITY_REPORTS.map((r, i) => `
    <div class="feed-card">
      <div class="feed-top">
        <div class="feed-avatar">${r.user}</div>
        <div class="feed-user-info">
          <div class="feed-username">${r.name}</div>
          <div class="feed-time">${r.time}</div>
        </div>
        <span class="feed-type-badge badge-${r.type}">${badgeLabel(r.type)}</span>
      </div>
      <div class="feed-location">📍 ${r.location}</div>
      <div class="feed-desc">${r.desc}</div>
      <div class="feed-actions">
        <button class="vote-btn${state.reportVotes[i] ? ' confirmed' : ''}" onclick="voteReport(${i}, this)">
          ${state.reportVotes[i] ? '✅ Confirmed' : '👍 Confirm'} (${r.votes})
        </button>
        <span class="feed-severity">Severity: ${severityLabel[r.severity] || 'Moderate'}</span>
      </div>
    </div>
  `).join('');
}

function badgeLabel(type) {
  return { traffic: '🚦 Traffic', accident: '⚠️ Accident', construction: '🚧 Construction', 'bus-delay': '🚌 Bus Delay', hazard: '🌊 Hazard', 'road-closure': '🚫 Closure' }[type] || type;
}

function voteReport(idx, btn) {
  if (state.reportVotes[idx]) return;
  state.reportVotes[idx] = true;
  COMMUNITY_REPORTS[idx].votes++;
  renderFeed();
  showToast('success', '✅ Thanks for confirming this report!');
}

// ── Hero Map Mockup ────────────────────────────────────
function initHeroMap() {
  const el = document.getElementById('cityMap');
  if (!el) return;
  el.innerHTML = `
    <svg viewBox="0 0 520 420" style="width:100%;height:100%;position:absolute;inset:0">
      <defs>
        <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0d1b3e"/>
          <stop offset="100%" style="stop-color:#162040"/>
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="520" height="420" fill="url(#mapBg)"/>
      <!-- Grid -->
      ${Array.from({length:8},(_,i)=>`<line x1="${i*75}" y1="0" x2="${i*75}" y2="420" stroke="#1e2e5a" stroke-width="1"/>`).join('')}
      ${Array.from({length:7},(_,i)=>`<line x1="0" y1="${i*70}" x2="520" y2="${i*70}" stroke="#1e2e5a" stroke-width="1"/>`).join('')}
      <!-- Roads -->
      <line x1="0" y1="160" x2="520" y2="160" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="0" y1="160" x2="520" y2="160" stroke="#f59e0b" stroke-width="3" opacity="0.9"/>
      <line x1="0" y1="280" x2="520" y2="280" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="0" y1="280" x2="520" y2="280" stroke="#10b981" stroke-width="3" opacity="0.9"/>
      <line x1="0" y1="360" x2="520" y2="360" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="0" y1="360" x2="520" y2="360" stroke="#ef4444" stroke-width="3" opacity="0.9"/>
      <line x1="130" y1="0" x2="130" y2="420" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="130" y1="0" x2="130" y2="420" stroke="#10b981" stroke-width="3" opacity="0.9"/>
      <line x1="280" y1="0" x2="280" y2="420" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="280" y1="0" x2="280" y2="420" stroke="#f59e0b" stroke-width="3" opacity="0.9"/>
      <line x1="420" y1="0" x2="420" y2="420" stroke="#2d3e6a" stroke-width="12" stroke-linecap="round"/>
      <line x1="420" y1="0" x2="420" y2="420" stroke="#ef4444" stroke-width="3" opacity="0.9"/>
      <!-- Buildings -->
      ${[{x:40,y:40,w:60,h:80},{x:155,y:30,w:50,h:100},{x:300,y:50,w:70,h:70},{x:430,y:40,w:55,h:60},{x:45,y:185,w:55,h:60},{x:155,y:300,w:80,h:40},{x:305,y:185,w:60,h:65},{x:440,y:185,w:50,h:70},{x:50,y:300,w:45,h:50},{x:305,y:310,w:75,h:35}].map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="3" fill="#1a2e5a" stroke="#253561" stroke-width="1"/>`).join('')}
      <!-- Bus icon -->
      <g transform="translate(180,140)" filter="url(#glow2)">
        <rect x="-14" y="-10" width="28" height="20" rx="4" fill="#1a6bff"/>
        <text x="0" y="6" text-anchor="middle" font-size="10" fill="white" font-family="Inter">🚌</text>
      </g>
      <!-- Alert dot -->
      <circle cx="280" cy="160" r="8" fill="#ef4444" opacity="0.9" filter="url(#glow2)">
        <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
      <!-- Labels -->
      <text x="10" y="154" fill="#60a5fa" font-size="9" font-family="Inter" font-weight="600">Queen St</text>
      <text x="10" y="274" fill="#34d399" font-size="9" font-family="Inter" font-weight="600">Bovaird Dr</text>
      <text x="10" y="354" fill="#f87171" font-size="9" font-family="Inter" font-weight="600">Steeles Ave</text>
      <!-- Compass -->
      <g transform="translate(480,30)">
        <circle cx="0" cy="0" r="18" fill="rgba(0,0,0,0.4)" stroke="#253561"/>
        <text x="0" y="-7" text-anchor="middle" fill="white" font-size="8" font-family="Inter" font-weight="700">N</text>
        <text x="0" y="14" text-anchor="middle" fill="#64748b" font-size="7" font-family="Inter">S</text>
        <text x="-13" y="4" text-anchor="middle" fill="#64748b" font-size="7" font-family="Inter">W</text>
        <text x="13" y="4" text-anchor="middle" fill="#64748b" font-size="7" font-family="Inter">E</text>
      </g>
      <!-- Brampton label -->
      <rect x="165" y="195" width="120" height="26" rx="13" fill="rgba(26,107,255,0.85)" filter="url(#glow2)"/>
      <text x="225" y="213" text-anchor="middle" fill="white" font-size="11" font-family="Inter" font-weight="700">Brampton, ON</text>
    </svg>
  `;
}

// ── Init ───────────────────────────────────────────────
function init() {
  initHeroMap();
  initTrafficMap();
  initLightSync();
  renderAlerts('all');
  renderRoutes();
  renderGoTrains();
  renderStops();
  initPlanner();
  initFeedback();
  renderFeed();
}

document.addEventListener('DOMContentLoaded', init);
