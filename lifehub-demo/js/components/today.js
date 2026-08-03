// ============================================================================
// Today view
// ----------------------------------------------------------------------------
// The dashboard. Surfaces the most urgent items first (overdue + due today),
// then upcoming, plus a quick AI action to summarize a pasted message/email.
// ============================================================================

import { el } from '../utils/dom.js';
import { icons } from './icons.js';
import { taskCard } from './taskCard.js';
import { greeting, formatLongDate, daysUntil, urgency } from '../utils/dates.js';
import { aiService } from '../services/aiService.js';
import { sampleEmail } from '../data/sampleData.js';

/** Order tasks so the most pressing appear first. */
const URGENCY_RANK = { overdue: 0, today: 1, soon: 2, upcoming: 3, none: 4 };
function byUrgency(a, b) {
  const ra = URGENCY_RANK[urgency(a.dueDate)];
  const rb = URGENCY_RANK[urgency(b.dueDate)];
  if (ra !== rb) return ra - rb;
  return daysUntil(a.dueDate) - daysUntil(b.dueDate);
}

export function todayView(ctx) {
  const { tasks, userName } = ctx.store.state;
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const overdue = active.filter((t) => urgency(t.dueDate) === 'overdue').sort(byUrgency);
  const todayTasks = active.filter((t) => urgency(t.dueDate) === 'today').sort(byUrgency);
  const upcoming = active.filter((t) => ['soon', 'upcoming', 'none'].includes(urgency(t.dueDate))).sort(byUrgency);

  const urgentCount = overdue.length + todayTasks.length;
  const weekCount = active.filter((t) => daysUntil(t.dueDate) <= 7).length;

  // --- Header ---------------------------------------------------------------
  const header = el('div', { class: 'app-header' }, [
    el('div', { class: 'greeting' }, [
      el('small', {}, formatLongDate()),
      el('h1', {}, `${greeting()}, ${userName}`),
    ]),
    el('div', { class: 'avatar' }, userName.charAt(0).toUpperCase()),
  ]);

  // --- Hero summary ---------------------------------------------------------
  const hero = el('div', { class: 'hero fade-up' }, [
    el('h2', {}, urgentCount ? `${urgentCount} ${urgentCount === 1 ? 'thing' : 'things'} need attention` : 'You’re all caught up'),
    el('p', {}, urgentCount ? 'Here’s what to handle first today.' : 'Nothing urgent right now — nice work.'),
    el('div', { class: 'hero-stats' }, [
      stat(overdue.length, 'Overdue'),
      stat(todayTasks.length, 'Due today'),
      stat(weekCount, 'This week'),
    ]),
  ]);

  // --- Optional reminder banner (notifications) -----------------------------
  const soon = active.filter((t) => daysUntil(t.dueDate) >= 0 && daysUntil(t.dueDate) <= 3);
  const banner = (ctx.store.state.notificationsEnabled && soon.length)
    ? el('button', { class: 'card fade-up', style: 'display:flex;gap:12px;align-items:center;width:100%;text-align:left;margin-bottom:24px',
        onclick: () => ctx.navigate('today') }, [
        el('div', { class: 'doc-icon', style: 'background:var(--warn-500);width:38px;height:38px', html: icons.bell() }),
        el('div', { style: 'flex:1' }, [
          el('b', { style: 'font-size:.92rem' }, `${soon.length} reminder${soon.length > 1 ? 's' : ''} coming up`),
          el('div', { style: 'font-size:.82rem;color:var(--text-muted)' }, 'LifeHub will notify you before each due date.'),
        ]),
      ])
    : null;

  // --- Task sections --------------------------------------------------------
  const sections = [];
  if (overdue.length || todayTasks.length) {
    sections.push(section('Do first', [...overdue, ...todayTasks], ctx, urgentCount));
  }
  if (upcoming.length) {
    sections.push(section('Upcoming', upcoming, ctx, upcoming.length));
  }
  if (!active.length) {
    sections.push(el('div', { class: 'empty' }, [
      el('div', { class: 'emoji' }, '\u2705'),
      el('h3', {}, 'All clear'),
      el('p', {}, 'Tap the + button to add a task, bill, or reminder.'),
    ]));
  }
  if (done.length) {
    sections.push(section(`Completed (${done.length})`, done, ctx, done.length));
  }

  const aiCard = smartSummaryCard(ctx);

  return el('div', {}, [header, hero, banner, aiCard, ...sections,
    el('div', { class: 'secure-note' }, [el('span', { html: icons.shield() }), 'Your data stays private on this device']),
  ]);
}

function stat(value, label) {
  return el('div', { class: 'stat' }, [el('b', {}, String(value)), el('span', {}, label)]);
}

function section(title, list, ctx, count) {
  return el('div', { class: 'section' }, [
    el('div', { class: 'section-head' }, [
      el('h2', {}, title),
      el('span', { class: 'count' }, String(count)),
    ]),
    el('div', { class: 'card-stack' }, list.map((t) => taskCard(t, ctx))),
  ]);
}

/**
 * A quick AI demo card: paste any message/email and get simple bullet points.
 * Showcases the "summarize long documents or emails" feature on the dashboard.
 */
function smartSummaryCard(ctx) {
  const textarea = el('textarea', { placeholder: 'Paste an email or long message…', 'aria-label': 'Message to summarize', style: 'min-height:70px' }, sampleEmail);
  const output = el('div', {});

  const runBtn = el('button', { class: 'btn sm', style: 'margin-top:10px',
    html: `${icons.sparkle()}<span style="margin-left:6px">Summarize</span>`,
    onclick: async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span><span style="margin-left:8px">Working…</span>';
      const bullets = await aiService.summarize(textarea.value);
      btn.disabled = false;
      btn.innerHTML = `${icons.sparkle()}<span style="margin-left:6px">Summarize</span>`;
      output.replaceChildren(el('div', { class: 'ai-box' }, [
        el('div', { class: 'ai-head', html: `${icons.sparkle()}<span>Summary</span>` }),
        el('ul', {}, bullets.map((b) => el('li', {}, b))),
      ]));
    } });

  return el('div', { class: 'section' }, [
    el('div', { class: 'section-head' }, [el('h2', {}, 'AI assistant')]),
    el('div', { class: 'card' }, [
      el('div', { style: 'display:flex;gap:8px;align-items:center;margin-bottom:10px' }, [
        el('div', { class: 'doc-icon', style: 'background:linear-gradient(135deg,var(--brand-500),var(--accent-500));width:34px;height:34px', html: icons.sparkle() }),
        el('b', { style: 'font-size:.95rem' }, 'Summarize a message'),
      ]),
      textarea, runBtn, output,
    ]),
  ]);
}
