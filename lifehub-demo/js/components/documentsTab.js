/**
 * Documents tab — file storage, upload, and AI summaries.
 */

import { formatDate, daysUntil, formatCurrency } from "../utils/dates.js";
import { escapeHtml, DOC_CATEGORIES, DOC_TYPE_ICONS, showToast } from "../utils/helpers.js";
import { openModal, closeModal } from "./modal.js";
import { addDocument, deleteDocument, updateDocument } from "../services/storageService.js";
import { extractFromDocument, summarizeDocument } from "../services/aiService.js";

let activeCategory = "all";

/** Render the Documents tab */
export function renderDocumentsTab(container, state, { onUpdate }) {
  const { documents } = state;
  const filtered =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header__row">
        <div>
          <div class="page-header__title">Secure Vault</div>
          <div class="page-header__sub">${documents.length} documents protected</div>
        </div>
        <button class="btn btn--icon btn--secondary" id="upload-doc-btn" aria-label="Upload document" style="background:var(--color-primary-soft);color:var(--color-primary)">+</button>
      </div>
    </div>

    <div class="main">
      <div class="chip-row" id="doc-categories">
        ${Object.entries(DOC_CATEGORIES)
          .map(
            ([key, { label, icon }]) =>
              `<button class="chip ${key === activeCategory ? "chip--active" : ""}" data-cat="${key}">${icon} ${label}</button>`
          )
          .join("")}
      </div>

      ${
        filtered.length > 0
          ? `<div class="doc-list">${filtered.map((d) => renderDocCard(d)).join("")}</div>`
          : `<div class="empty-state">
              <div class="empty-state__icon">📂</div>
              <div class="empty-state__title">No documents yet</div>
              <p class="empty-state__text">Upload IDs, insurance cards, receipts, or warranties to keep them safe.</p>
            </div>`
      }
    </div>
  `;

  container.querySelector("#upload-doc-btn").addEventListener("click", () => {
    showUploadModal(state, onUpdate);
  });

  container.querySelectorAll("[data-cat]").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCategory = chip.dataset.cat;
      renderDocumentsTab(container, state, { onUpdate });
    });
  });

  container.querySelectorAll("[data-doc-id]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      const docId = card.dataset.docId;
      const doc = documents.find((d) => d.id === docId);
      if (doc) showDocDetail(doc, state, onUpdate);
    });
  });

  container.querySelectorAll("[data-action='delete-doc']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const docId = btn.closest("[data-doc-id]").dataset.docId;
      const updated = deleteDocument(state.documents, docId);
      onUpdate({ ...state, documents: updated });
      showToast("Document removed", "info");
    });
  });
}

function renderDocCard(doc) {
  const cat = DOC_CATEGORIES[doc.category] || DOC_CATEGORIES.other;
  const typeIcon = DOC_TYPE_ICONS[doc.type] || DOC_TYPE_ICONS.other;
  const expiryWarning =
    doc.expiryDate && daysUntil(doc.expiryDate) <= 30 && daysUntil(doc.expiryDate) >= 0;

  return `
    <div class="card doc-card" data-doc-id="${doc.id}">
      <div class="doc-card__icon doc-card__icon--${doc.category}">${typeIcon}</div>
      <div class="doc-card__body">
        <div class="doc-card__title">${escapeHtml(doc.name)}</div>
        <div class="doc-card__meta">
          ${cat.label} · ${doc.size} · ${formatDate(doc.uploadedAt)}
          ${expiryWarning ? ` · <span style="color:var(--color-warning)">Expires soon</span>` : ""}
        </div>
      </div>
      <div class="doc-card__actions">
        <button class="btn btn--icon btn--ghost" data-action="delete-doc" aria-label="Delete">🗑</button>
      </div>
    </div>
  `;
}

/** Show document detail with AI summary */
function showDocDetail(doc, state, onUpdate) {
  const cat = DOC_CATEGORIES[doc.category] || DOC_CATEGORIES.other;

  openModal(
    doc.name,
    `
    <div style="margin-bottom:1rem">
      <span class="badge badge--category">${cat.icon} ${cat.label}</span>
      <span class="badge badge--category" style="margin-left:0.5rem">${doc.type.toUpperCase()}</span>
    </div>

    <div class="text-muted" style="font-size:0.85rem;margin-bottom:1rem">
      Uploaded ${formatDate(doc.uploadedAt)} · ${doc.size}
      ${doc.expiryDate ? ` · Expires ${formatDate(doc.expiryDate)}` : ""}
    </div>

    ${
      doc.extractedDates?.length > 0
        ? `<div class="mb-2">
            <div class="section-title">Extracted Dates</div>
            ${doc.extractedDates.map((d) => `<div class="text-muted" style="font-size:0.85rem">📅 ${escapeHtml(d.label)}: ${formatDate(d.date)}</div>`).join("")}
          </div>`
        : ""
    }

    ${
      doc.extractedAmounts?.length > 0
        ? `<div class="mb-2">
            <div class="section-title">Extracted Amounts</div>
            ${doc.extractedAmounts.map((a) => `<div class="text-muted" style="font-size:0.85rem">💰 ${escapeHtml(a.label)}: ${formatCurrency(a.amount)}</div>`).join("")}
          </div>`
        : ""
    }

    <div class="ai-summary" id="doc-summary">
      <div class="ai-summary__header">✨ AI Summary</div>
      ${
        doc.aiSummary?.length > 0
          ? `<ul class="ai-summary__list">${doc.aiSummary.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : `<div class="ai-summary__loading"><div class="spinner"></div> Generating summary...</div>`
      }
    </div>

    <button class="btn btn--secondary mt-2" id="re-summarize" style="width:100%">Re-summarize with AI</button>
  `
  );

  // Auto-summarize if no summary exists
  if (!doc.aiSummary?.length) {
    runSummarize(doc, state, onUpdate);
  }

  document.getElementById("re-summarize")?.addEventListener("click", () => {
    runSummarize(doc, state, onUpdate);
  });
}

async function runSummarize(doc, state, onUpdate) {
  const summaryEl = document.getElementById("doc-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="ai-summary__header">✨ AI Summary</div>
      <div class="ai-summary__loading"><div class="spinner"></div> Analyzing document...</div>
    `;
  }

  const summary = await summarizeDocument(doc.name);

  const updated = updateDocument(state.documents, doc.id, { aiSummary: summary });
  onUpdate({ ...state, documents: updated });

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="ai-summary__header">✨ AI Summary</div>
      <ul class="ai-summary__list">${summary.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    `;
  }
}

/** Show upload modal with AI extraction */
function showUploadModal(state, onUpdate) {
  openModal(
    "Upload Document",
    `
    <div class="upload-zone" id="upload-zone">
      <div class="upload-zone__icon">📎</div>
      <div class="upload-zone__text">
        <strong>Tap to upload</strong><br/>
        PDFs, screenshots, receipts, IDs
      </div>
      <input type="file" id="file-input" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" class="sr-only" />
    </div>

    <div class="form-group mt-2">
      <label class="form-label" for="doc-name">Document Name</label>
      <input class="form-input" id="doc-name" placeholder="e.g. Car Insurance Card" />
    </div>

    <div class="form-group">
      <label class="form-label" for="doc-category">Category</label>
      <select class="form-select" id="doc-category">
        ${Object.entries(DOC_CATEGORIES)
          .filter(([k]) => k !== "all")
          .map(([k, { label }]) => `<option value="${k}">${label}</option>`)
          .join("")}
      </select>
    </div>

    <div id="ai-extraction" class="hidden"></div>

    <button class="btn btn--primary mt-2" id="save-doc" style="width:100%" disabled>Save Document</button>
  `
  );

  let selectedFile = null;
  let extractionResult = null;

  const zone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("file-input");
  const saveBtn = document.getElementById("save-doc");
  const nameInput = document.getElementById("doc-name");
  const extractionEl = document.getElementById("ai-extraction");

  zone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    selectedFile = fileInput.files[0];
    if (!selectedFile) return;

    nameInput.value = selectedFile.name.replace(/\.[^.]+$/, "");
    zone.querySelector(".upload-zone__text").innerHTML = `<strong>${escapeHtml(selectedFile.name)}</strong><br/>${(selectedFile.size / 1024).toFixed(0)} KB`;

    // Run AI extraction
    extractionEl.classList.remove("hidden");
    extractionEl.innerHTML = `
      <div class="ai-summary">
        <div class="ai-summary__loading"><div class="spinner"></div> AI is extracting dates, amounts, and action items...</div>
      </div>
    `;

    extractionResult = await extractFromDocument(selectedFile);

    extractionEl.innerHTML = `
      <div class="ai-summary">
        <div class="ai-summary__header">✨ AI Extraction Results</div>
        <ul class="ai-summary__list">
          ${extractionResult.summary.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </div>
    `;

    saveBtn.disabled = false;
  });

  saveBtn.addEventListener("click", () => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    const type = ext === "pdf" ? "pdf" : ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? "image" : "other";

    const docData = {
      name: nameInput.value.trim() || selectedFile.name,
      category: document.getElementById("doc-category").value,
      type,
      size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
      aiSummary: extractionResult?.summary || [],
      extractedDates: extractionResult?.dates || [],
      extractedAmounts: extractionResult?.amounts || [],
      expiryDate: extractionResult?.dates?.[0]?.date || null,
      tags: [],
    };

    const updated = addDocument(state.documents, docData);
    onUpdate({ ...state, documents: updated });
    closeModal();
    showToast("Document saved with AI extraction!", "success");
  });
}
