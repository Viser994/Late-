import { dueLabel, formatDate, isUrgent } from "../utils/formatters.js";

export function renderTodayTab(state) {
  const urgentCount = state.tasks.filter((task) => !task.completed && isUrgent(task.dueAt)).length;

  return `
    <article class="card hero-card">
      <h2>Today Dashboard</h2>
      <p>${urgentCount} urgent item(s). Start with deadlines and payments due soon.</p>
    </article>

    <article class="card">
      <div class="split-header">
        <h3>Add task or reminder</h3>
      </div>
      <form id="taskForm">
        <div class="row">
          <input name="title" required maxlength="80" placeholder="Task title (e.g., Pay water bill)">
          <select name="category" aria-label="Category">
            <option>Bills</option>
            <option>Appointments</option>
            <option>Home</option>
            <option>Health</option>
            <option>Travel</option>
            <option>Other</option>
          </select>
        </div>
        <div class="row" style="margin-top:0.6rem;">
          <input type="date" name="dueDate" required>
          <button class="primary-button" type="submit">Add</button>
        </div>
        <textarea name="notes" placeholder="Optional notes"></textarea>
      </form>
    </article>

    <article class="card">
      <div class="split-header">
        <h3>Open tasks</h3>
        <span class="badge">${state.tasks.filter((task) => !task.completed).length} active</span>
      </div>
      ${renderTaskList(state.tasks)}
    </article>
  `;
}

function renderTaskList(tasks) {
  const openTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  if (!openTasks.length) {
    return `<p class="task-meta">No active tasks. Add one above.</p>`;
  }

  return `
    <ul class="task-list">
      ${openTasks
        .map((task) => {
          const urgent = isUrgent(task.dueAt);
          return `
            <li class="task-item">
              <div class="split-header">
                <h4>${escapeHtml(task.title)}</h4>
                <span class="badge ${urgent ? "urgent" : ""}">${escapeHtml(task.category)}</span>
              </div>
              <p class="task-meta">${dueLabel(task.dueAt)} • ${formatDate(task.dueAt)}</p>
              <p class="task-meta">${escapeHtml(task.notes || "No notes")}</p>
              <div class="task-actions">
                <button class="secondary-button" data-action="complete-task" data-id="${task.id}">Mark done</button>
                <button class="secondary-button" data-action="notify-task" data-id="${task.id}">Notify me</button>
              </div>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

export function renderDocumentsTab(state) {
  return `
    <article class="card">
      <div class="split-header">
        <h3>Upload or scan document</h3>
      </div>
      <form id="documentForm">
        <input name="name" required placeholder="File name (e.g., Electricity-Aug.pdf)">
        <div class="row" style="margin-top:0.6rem;">
          <select name="type">
            <option>Bill</option>
            <option>Insurance</option>
            <option>Warranty</option>
            <option>ID</option>
            <option>Travel</option>
            <option>Other</option>
          </select>
          <button class="primary-button" type="submit">Upload</button>
        </div>
      </form>
      <p class="task-meta" style="margin-top:0.7rem;">Supports PDFs, screenshots, receipts, and scans.</p>
    </article>

    <article class="card">
      <div class="split-header">
        <h3>Stored documents</h3>
        <span class="badge">${state.documents.length} files</span>
      </div>
      ${renderDocumentList(state.documents)}
    </article>
  `;
}

function renderDocumentList(documents) {
  if (!documents.length) {
    return `<p class="task-meta">No documents yet. Upload one above.</p>`;
  }

  return `
    <ul class="doc-list">
      ${documents
        .map(
          (doc) => `
            <li class="doc-item">
              <div class="split-header">
                <h4>${escapeHtml(doc.name)}</h4>
                <span class="badge">${escapeHtml(doc.type)}</span>
              </div>
              <p class="doc-meta">Uploaded ${formatDate(doc.uploadedAt)}</p>
              <p class="doc-meta"><strong>Amount:</strong> ${escapeHtml(doc.extracted.amount)}</p>
              <p class="doc-meta"><strong>Date:</strong> ${escapeHtml(doc.extracted.date)}</p>
              <p class="doc-meta"><strong>Action:</strong> ${escapeHtml(doc.extracted.actionItem)}</p>
              <ul>
                ${doc.summary.map((point) => `<li class="doc-meta">${escapeHtml(point)}</li>`).join("")}
              </ul>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

export function renderSettingsTab(state, notificationCount) {
  return `
    <article class="card">
      <h3>Profile & app</h3>
      <p class="task-meta">LifeHub is built for clarity and secure-feeling organization for daily life admin.</p>
    </article>

    <article class="card">
      <h3>Preferences</h3>
      <p class="task-meta">Theme: ${state.theme === "dark" ? "Dark" : "Light"}</p>
      <p class="task-meta">Scheduled reminders: ${notificationCount}</p>
      <button id="settingsThemeToggle" class="secondary-button">Toggle theme</button>
    </article>

    <article class="card">
      <h3>Document categories</h3>
      <p class="task-meta">IDs, insurance, warranties, travel docs, and bills are grouped for quick retrieval.</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
