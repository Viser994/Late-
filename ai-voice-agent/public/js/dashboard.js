/* AI Voice Agent – Dashboard JavaScript */
(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────
  let allCalls = [];
  let allLeads = [];

  // ── Navigation ─────────────────────────────────────────────────────────
  const sections = document.querySelectorAll('.section');
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const target = item.dataset.section;

      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`section-${target}`).classList.add('active');

      document.getElementById('pageTitle').textContent = item.textContent.trim();

      const subs = {
        overview: 'Real-time AI voice agent dashboard',
        calls: 'All handled call sessions',
        leads: 'Caller contact information captured by the AI',
        setup: 'Get your AI voice agent running in minutes',
      };
      document.getElementById('pageSub').textContent = subs[target] || '';
    });
  });

  // ── Fetch helpers ──────────────────────────────────────────────────────
  async function apiFetch(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ── Format helpers ─────────────────────────────────────────────────────
  function relativeTime(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  function formatDuration(sec) {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Status / header update ─────────────────────────────────────────────
  async function refreshStatus() {
    try {
      const data = await apiFetch('/api/status');
      document.getElementById('statusDot').className = 'status-dot online';
      document.getElementById('statusText').textContent = 'Online';
      document.getElementById('agentName').textContent = data.agentName;

      const h = Math.floor(data.uptime / 3600);
      const m = Math.floor((data.uptime % 3600) / 60);
      document.getElementById('uptime').textContent =
        h ? `Uptime: ${h}h ${m}m` : `Uptime: ${m}m`;
    } catch {
      document.getElementById('statusDot').className = 'status-dot offline';
      document.getElementById('statusText').textContent = 'Offline';
    }
  }

  // ── Calls ──────────────────────────────────────────────────────────────
  async function refreshCalls() {
    try {
      const { calls } = await apiFetch('/api/calls');
      allCalls = calls;
      renderOverviewCalls(calls);
      renderCallsTable(calls);
      updateStats(calls);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
    }
  }

  function updateStats(calls) {
    const active = calls.filter(c => c.status === 'active').length;
    const escalated = calls.filter(c => c.escalated).length;
    document.getElementById('totalCalls').textContent = calls.length;
    document.getElementById('activeCalls').textContent = active;
    document.getElementById('escalatedCalls').textContent = escalated;
  }

  function renderOverviewCalls(calls) {
    const el = document.getElementById('recentCallsList');
    const badge = document.getElementById('recentCallsBadge');
    const recent = calls.slice(0, 8);
    badge.textContent = calls.length;

    if (!recent.length) {
      el.innerHTML = '<div class="empty-state">No calls yet. Waiting for the first call…</div>';
      return;
    }

    el.innerHTML = recent.map(c => `
      <div class="call-item" onclick="openTranscript('${escHtml(c.callSid)}')">
        <div class="call-item-left">
          <div class="call-avatar">📞</div>
          <div>
            <div class="call-phone">${escHtml(c.callerPhone || 'Unknown')}</div>
            <div class="call-time">${relativeTime(c.createdAt)} · ${c.turns} turn${c.turns !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="call-status ${c.status}">${c.status === 'active' ? '● Live' : 'Ended'}</div>
      </div>`).join('');
  }

  function renderCallsTable(calls) {
    const el = document.getElementById('callsTable');
    if (!calls.length) {
      el.innerHTML = '<div class="empty-state">No calls recorded yet.</div>';
      return;
    }

    el.innerHTML = `<table class="data-table">
      <thead><tr>
        <th>Caller</th><th>Status</th><th>Turns</th><th>Duration</th>
        <th>Lead</th><th>Escalated</th><th>Time</th><th>Transcript</th>
      </tr></thead>
      <tbody>${calls.map(c => `<tr>
        <td>${escHtml(c.callerPhone || '—')}</td>
        <td><span class="badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}">${c.status}</span></td>
        <td>${c.turns}</td>
        <td>${formatDuration(parseInt(c.duration))}</td>
        <td>${c.leadCaptured ? '<span class="badge badge-blue">Yes</span>' : '—'}</td>
        <td>${c.escalated ? '<span class="badge badge-yellow">Yes</span>' : '—'}</td>
        <td>${relativeTime(c.createdAt)}</td>
        <td><span class="clickable" onclick="openTranscript('${escHtml(c.callSid)}')">View</span></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  // ── Leads ──────────────────────────────────────────────────────────────
  async function refreshLeads() {
    try {
      const { leads } = await apiFetch('/api/leads');
      allLeads = leads;
      renderOverviewLeads(leads);
      renderLeadsTable(leads);
      document.getElementById('totalLeads').textContent = leads.length;
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  }

  function renderOverviewLeads(leads) {
    const el = document.getElementById('recentLeadsList');
    const badge = document.getElementById('recentLeadsBadge');
    const recent = leads.slice(0, 8);
    badge.textContent = leads.length;

    if (!recent.length) {
      el.innerHTML = '<div class="empty-state">No leads captured yet.</div>';
      return;
    }

    el.innerHTML = recent.map(l => `
      <div class="lead-item">
        <div>
          <div class="lead-name">${escHtml(l.name || 'Name not given')}</div>
          <div class="lead-phone">${escHtml(l.phone || l.callerPhone || '—')}</div>
        </div>
        <div class="call-time">${relativeTime(new Date(l.capturedAt).getTime())}</div>
      </div>`).join('');
  }

  function renderLeadsTable(leads) {
    const el = document.getElementById('leadsTable');
    if (!leads.length) {
      el.innerHTML = '<div class="empty-state">No leads captured yet.</div>';
      return;
    }

    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Name</th><th>Phone</th><th>Caller ID</th><th>Captured</th></tr></thead>
      <tbody>${leads.map(l => `<tr>
        <td>${escHtml(l.name || '—')}</td>
        <td>${escHtml(l.phone || '—')}</td>
        <td>${escHtml(l.callerPhone || '—')}</td>
        <td>${new Date(l.capturedAt).toLocaleString()}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  // ── Transcript modal ───────────────────────────────────────────────────
  window.openTranscript = async function (sid) {
    const modal = document.getElementById('transcriptModal');
    const body  = document.getElementById('modalBody');
    const title = document.getElementById('modalTitle');
    modal.classList.remove('hidden');
    body.innerHTML = '<div class="empty-state">Loading…</div>';

    try {
      const session = await apiFetch(`/api/calls/${encodeURIComponent(sid)}`);
      title.textContent = `Transcript — ${session.callerPhone || sid}`;

      if (!session.messages || !session.messages.length) {
        body.innerHTML = '<div class="empty-state">No transcript available.</div>';
        return;
      }

      body.innerHTML = [
        session.summary ? `<div style="background:rgba(99,102,241,0.1);border-radius:8px;padding:12px 14px;margin-bottom:12px;font-size:13px;color:var(--text-muted)"><strong style="color:var(--text)">Summary:</strong> ${escHtml(session.summary)}</div>` : '',
        ...session.messages.map(m => `
          <div class="msg ${m.role}">
            <div class="msg-role">${m.role === 'assistant' ? 'Agent' : 'Caller'}</div>
            <div class="msg-bubble">${escHtml(m.content)}</div>
          </div>`),
      ].join('');
    } catch {
      body.innerHTML = '<div class="empty-state">Failed to load transcript.</div>';
    }
  };

  window.closeModal = function () {
    document.getElementById('transcriptModal').classList.add('hidden');
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeModal();
  });

  // ── Polling ────────────────────────────────────────────────────────────
  async function refresh() {
    await Promise.allSettled([refreshStatus(), refreshCalls(), refreshLeads()]);
  }

  refresh();
  setInterval(refresh, 5000); // poll every 5 seconds
})();
