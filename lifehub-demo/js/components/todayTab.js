/**
 * Today tab — dashboard with urgent tasks, stats, and quick actions.
 */

import { formatDate, dueLabel, daysUntil, sortByUrgency, getGreeting, formatCurrency } from "../utils/dates.js";
import { escapeHtml, CATEGORY_LABELS, priorityBadge, showToast } from "../utils/helpers.js";
import { openModal, closeModal } from "./modal.js";
import { addTask, toggleTask } from "../services/storageService.js";

/** Render the Today tab */
export function renderTodayTab(container, state, { onUpdate }) {
  const { tasks, settings } = state;
  const active = tasks.filter((t) => !t.completed);
  const sorted = sortByUrgency(active);
  const overdue = active.filter((t) => daysUntil(t.dueDate) < 0);
  const dueToday = active.filter((t) => daysUntil(t.dueDate) === 0);
  const upcoming = active.filter((t) => daysUntil(t.dueDate) > 0);
  const completed = tasks.filter((t) => t.completed);

  const name = settings.userName ? `, ${escapeHtml(settings.userName)}` : "";

  container.innerHTML = `
    <div class="header">
      <div>
        <div class="header__title">${getGreeting()}${name}</div>
        <div class="header__subtitle">${formatDate(new Date().toISOString())}</div>
      </div>
      <button class="btn btn--icon btn--secondary" id="add-task-btn" aria-label="Add task">+</button>
    </div>

    <div class="main">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__value">${dueToday.length}</div>
          <div class="stat-card__label">Due Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${overdue.length}</div>
          <div class="stat-card__label">Overdue</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${active.length}</div>
          <div class="stat-card__label">Active</div>
        </div>
      </div>

      ${overdue.length > 0 ? renderSection("Overdue", overdue, state, onUpdate) : ""}
      ${dueToday.length > 0 ? renderSection("Due Today", dueToday, state, onUpdate) : ""}
      ${upcoming.length > 0 ? renderSection("Coming Up", upcoming, state, onUpdate) : ""}

      ${
        active.length === 0
          ? `<div class="empty-state">
              <div class="empty-state__icon">✅</div>
              <div class="empty-state__title">All caught up!</div>
              <p class="empty-state__text">No pending tasks. Tap + to add a reminder or deadline.</p>
            </div>`
          : ""
      }

      ${
        completed.length > 0
          ? `<div class="mt-2">
              <div class="section-title">Completed (${completed.length})</div>
              <div class="task-list">${completed.slice(0, 3).map((t) => renderTaskCard(t)).join("")}</div>
            </div>`
          : ""
      }
    </div>
  `;

  container.querySelector("#add-task-btn").addEventListener("click", () => {
    showAddTaskModal(state, onUpdate);
  });

  bindTaskEvents(container, state, onUpdate);
}

function renderSection(title, taskList, state, onUpdate) {
  return `
    <div class="mb-2">
      <div class="section-title">${title}</div>
      <div class="task-list">${taskList.map((t) => renderTaskCard(t)).join("")}</div>
    </div>
  `;
}

function renderTaskCard(task) {
  const badge = priorityBadge(task);
  const badgeLabel =
    badge === "urgent" ? "Urgent" : badge === "soon" ? "Soon" : badge === "done" ? "Done" : CATEGORY_LABELS[task.category] || task.category;

  return `
    <div class="card task-card" data-task-id="${task.id}">
      <div class="task-card__check ${task.completed ? "task-card__check--done" : ""}" data-action="toggle">
        ${task.completed ? "✓" : ""}
      </div>
      <div class="task-card__body">
        <div class="task-card__title ${task.completed ? "task-card__title--done" : ""}">${escapeHtml(task.title)}</div>
        <div class="task-card__meta">
          <span class="badge badge--${badge}">${badgeLabel}</span>
          <span>${dueLabel(task.dueDate)}</span>
          ${task.amount != null ? `<span>${formatCurrency(task.amount)}</span>` : ""}
        </div>
        ${task.notes ? `<div class="text-muted mt-1" style="font-size:0.8rem">${escapeHtml(task.notes)}</div>` : ""}
      </div>
    </div>
  `;
}

function bindTaskEvents(container, state, onUpdate) {
  container.querySelectorAll("[data-action='toggle']").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = el.closest("[data-task-id]");
      const taskId = card.dataset.taskId;
      const updated = toggleTask(state.tasks, taskId);
      onUpdate({ ...state, tasks: updated });
      showToast("Task updated", "success");
    });
  });
}

/** Show modal to add a new task */
export function showAddTaskModal(state, onUpdate) {
  openModal(
    "Add Task or Reminder",
    `
    <form id="add-task-form">
      <div class="form-group">
        <label class="form-label" for="task-title">Title</label>
        <input class="form-input" id="task-title" placeholder="e.g. Pay phone bill" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-due">Due Date</label>
          <input class="form-input" id="task-due" type="date" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="task-category">Category</label>
          <select class="form-select" id="task-category">
            ${Object.entries(CATEGORY_LABELS)
              .map(([k, v]) => `<option value="${k}">${v}</option>`)
              .join("")}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-amount">Amount (optional)</label>
          <input class="form-input" id="task-amount" type="number" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label" for="task-priority">Priority</label>
          <select class="form-select" id="task-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-notes">Notes (optional)</label>
        <textarea class="form-textarea" id="task-notes" placeholder="Additional details..."></textarea>
      </div>
      <button type="submit" class="btn btn--primary" style="width:100%">Add Task</button>
    </form>
  `
  );

  const dueInput = document.getElementById("task-due");
  const today = new Date().toISOString().split("T")[0];
  dueInput.value = today;
  dueInput.min = today;

  document.getElementById("add-task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("task-title").value.trim();
    const dueDate = new Date(document.getElementById("task-due").value);
    dueDate.setHours(12, 0, 0, 0);

    const amountVal = document.getElementById("task-amount").value;
    const taskData = {
      title,
      dueDate: dueDate.toISOString(),
      category: document.getElementById("task-category").value,
      priority: document.getElementById("task-priority").value,
      amount: amountVal ? parseFloat(amountVal) : null,
      notes: document.getElementById("task-notes").value.trim(),
    };

    const updated = addTask(state.tasks, taskData);
    onUpdate({ ...state, tasks: updated });
    closeModal();
    showToast("Task added!", "success");
  });
}
