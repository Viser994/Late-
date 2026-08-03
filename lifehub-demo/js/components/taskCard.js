// ============================================================================
// Task card
// ----------------------------------------------------------------------------
// Renders a single task/reminder/bill row with a completion checkbox, urgency
// styling, category chip and (optional) amount. Pure view: all mutations are
// delegated back through the store passed in `ctx`.
// ============================================================================

import { el } from '../utils/dom.js';
import { icons } from './icons.js';
import { relativeLabel, urgency } from '../utils/dates.js';
import { TASK_TYPES } from '../data/sampleData.js';

const URGENCY_CHIP = {
  overdue: 'danger',
  today: 'danger',
  soon: 'warn',
  upcoming: '',
  none: '',
};

export function taskCard(task, ctx) {
  const u = task.done ? 'none' : urgency(task.dueDate);
  const typeInfo = TASK_TYPES[task.type] || TASK_TYPES.reminder;

  const check = el('button', {
    class: `check ${task.done ? 'checked' : ''}`,
    'aria-label': task.done ? 'Mark as not done' : 'Mark as done',
    html: icons.check(),
    onclick: (e) => { e.stopPropagation(); ctx.store.toggleTask(task.id); },
  });

  const meta = el('div', { class: 'task-meta' }, [
    // Category chip
    el('span', {
      class: 'chip',
      html: `<span class="dot" style="color:${typeInfo.color}"></span>${typeInfo.label}`,
    }),
    // Due-date chip, colored by urgency
    el('span', {
      class: `chip ${URGENCY_CHIP[u] || ''}`,
      html: `${icons.clock()}<span style="display:inline-flex">${relativeLabel(task.dueDate)}</span>`,
    }),
  ]);

  const body = el('div', { class: 'task-body' }, [
    el('div', { class: 'task-title', html: task.title }),
    task.note ? el('div', { class: 'task-note', html: task.note }) : null,
    meta,
  ]);

  const right = task.amount != null
    ? el('div', { class: 'amount' }, `$${Number(task.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
    : null;

  const card = el('div', {
    class: `card task fade-up ${task.done ? 'done' : u === 'overdue' || u === 'today' ? 'urgent' : u === 'soon' ? 'soon' : ''}`,
  }, [check, body, right]);

  // Long-press / secondary action: allow deleting via a small button that
  // appears on hover-capable devices; on touch, users can still delete from detail.
  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm(`Delete "${task.title}"?`)) ctx.store.removeTask(task.id);
  });

  return card;
}
