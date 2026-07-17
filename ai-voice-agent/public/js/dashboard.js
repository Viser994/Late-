const panels = {
  overview: {
    title: 'Overview',
    subtitle: 'Your AI receptionist at a glance',
    showSave: false,
  },
  configure: {
    title: 'Configure Agent',
    subtitle: 'Customize how your AI handles calls',
    showSave: true,
  },
  calls: {
    title: 'Call Log',
    subtitle: 'Calls handled by your AI agent',
    showSave: false,
  },
  setup: {
    title: 'Setup Guide',
    subtitle: 'Get your voice agent live in minutes',
    showSave: false,
  },
};

let currentConfig = {};

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.panel;
    switchPanel(panel);
  });
});

function switchPanel(name) {
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${name}`);
  });

  const meta = panels[name];
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.subtitle;
  document.getElementById('saveConfigBtn').hidden = !meta.showSave;

  if (name === 'calls') loadCalls();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    const dot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.sidebar-status span:last-child');

    const allConfigured =
      data.twilioConfigured && data.openaiConfigured && data.businessPhoneConfigured;

    if (allConfigured) {
      dot.className = 'status-dot online';
      statusText.textContent = 'Agent ready';
    } else {
      dot.className = 'status-dot warning';
      statusText.textContent = 'Setup required';
    }

    document.getElementById('statAgentStatus').textContent = allConfigured
      ? 'Online'
      : 'Needs setup';
    document.getElementById('statHoursHint').textContent = data.withinBusinessHours
      ? 'Within business hours'
      : 'Outside business hours';
    document.getElementById('statBusinessName').textContent = data.businessName;

    const integrations = [];
    if (data.twilioConfigured) integrations.push('Twilio ✓');
    else integrations.push('Twilio ✗');
    if (data.openaiConfigured) integrations.push('OpenAI ✓');
    else integrations.push('OpenAI ✗');
    document.getElementById('statIntegrations').textContent = integrations.join(' · ');

    updateSetupChecklist(data);
  } catch {
    document.querySelector('.sidebar-status span:last-child').textContent = 'Offline';
  }
}

function updateSetupChecklist(status) {
  const items = {
    twilio: status.twilioConfigured,
    'twilio-phone': status.twilioConfigured,
    'business-phone': status.businessPhoneConfigured,
    openai: status.openaiConfigured,
  };

  document.querySelectorAll('#setupChecklist li').forEach((li) => {
    const key = li.dataset.key;
    li.classList.toggle('done', items[key]);
  });
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    currentConfig = await res.json();
    populateForm(currentConfig);

    document.getElementById('statBusinessName').textContent = currentConfig.businessName;
    document.getElementById('statAgentName').textContent = `Agent: ${currentConfig.agentName}`;
  } catch (err) {
    showToast('Failed to load configuration');
  }
}

function populateForm(config) {
  const form = document.getElementById('configForm');
  form.businessName.value = config.businessName || '';
  form.industry.value = config.industry || '';
  form.timezone.value = config.timezone || 'America/New_York';
  form.tagline.value = config.tagline || '';
  form.agentName.value = config.agentName || '';
  form.voice.value = config.voice || 'Polly.Joanna-Neural';
  form.personality.value = config.personality || '';
  form.greeting.value = config.greeting || '';
  form.afterHoursMessage.value = config.afterHoursMessage || '';
  form.services.value = (config.services || []).join('\n');
}

function collectFormData() {
  const form = document.getElementById('configForm');
  return {
    businessName: form.businessName.value,
    industry: form.industry.value,
    timezone: form.timezone.value,
    tagline: form.tagline.value,
    agentName: form.agentName.value,
    voice: form.voice.value,
    personality: form.personality.value,
    greeting: form.greeting.value,
    afterHoursMessage: form.afterHoursMessage.value,
    services: form.services.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

document.getElementById('saveConfigBtn').addEventListener('click', async () => {
  const data = collectFormData();
  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Save failed');
    currentConfig = await res.json();
    showToast('Configuration saved');
    loadStatus();
  } catch {
    showToast('Failed to save configuration');
  }
});

async function loadCalls() {
  try {
    const res = await fetch('/api/calls');
    const calls = await res.json();
    const tbody = document.getElementById('callsTableBody');

    const aiCalls = calls.filter((c) => c.handledBy === 'ai' && c.messageCount > 0);
    document.getElementById('statCallsHandled').textContent = aiCalls.length;

    if (calls.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty-state">No calls yet — call your Twilio number to test</td></tr>';
      return;
    }

    tbody.innerHTML = calls
      .map((call) => {
        const time = new Date(call.startedAt).toLocaleString();
        const statusBadge =
          call.status === 'completed'
            ? '<span class="badge badge-success">Completed</span>'
            : '<span class="badge badge-active">Active</span>';
        const summary = call.summary || (call.messageCount > 0 ? 'AI conversation' : 'Rang business');
        return `<tr>
          <td>${escapeHtml(time)}</td>
          <td>${escapeHtml(call.from || 'Unknown')}</td>
          <td>${statusBadge}</td>
          <td>${escapeHtml(summary)}</td>
        </tr>`;
      })
      .join('');
  } catch {
    showToast('Failed to load calls');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('refreshCallsBtn').addEventListener('click', loadCalls);

const baseUrl = window.location.origin;
document.getElementById('webhookUrl').textContent = `${baseUrl}/voice/incoming`;

loadStatus();
loadConfig();
loadCalls();

setInterval(loadStatus, 30000);
