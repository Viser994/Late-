// ============================================================================
// Sheets / Forms
// ----------------------------------------------------------------------------
// Bottom-sheet flows: add a task, add/scan a document, and view a document's
// detail (with AI summarize + extract). These are the app's main interactions,
// so they live together and share small helpers.
// ============================================================================

import { el, qs } from '../utils/dom.js';
import { icons } from './icons.js';
import { TASK_TYPES, DOC_CATEGORIES } from '../data/sampleData.js';
import { aiService } from '../services/aiService.js';
import { isoDaysFromNow, formatDate } from '../utils/dates.js';

/** Shared sheet wrapper: drag handle + close button + title. */
function sheetShell(title, ctx, ...content) {
  const close = el('button', { class: 'icon-btn', 'aria-label': 'Close', html: icons.x(), onclick: () => ctx.closeSheet() });
  const head = el('div', { class: 'section-head', style: 'margin-bottom:16px' }, [
    el('h3', { style: 'margin:0' }, title), close,
  ]);
  return el('div', {}, [el('div', { class: 'sheet-handle' }), head, ...content]);
}

// ---------------------------------------------------------------------------
// Add task / reminder / bill
// ---------------------------------------------------------------------------
export function addTaskSheet(ctx) {
  let selectedType = 'bill';

  const typePicker = el('div', { class: 'type-picker' },
    Object.entries(TASK_TYPES).map(([key, info]) =>
      el('button', {
        class: `type-opt ${key === selectedType ? 'active' : ''}`,
        dataset: { type: key },
        type: 'button',
        onclick: (e) => {
          selectedType = key;
          qs('.type-picker', form)?.querySelectorAll('.type-opt')
            .forEach((n) => n.classList.toggle('active', n.dataset.type === key));
        },
      }, info.label)));

  const titleInput = el('input', { type: 'text', placeholder: 'e.g. Water bill', required: 'true' });
  const dateInput = el('input', { type: 'date', value: isoDaysFromNow(3) });
  const amountInput = el('input', { type: 'number', placeholder: '0.00', step: '0.01', min: '0' });
  const noteInput = el('textarea', { placeholder: 'Add a note (optional)' });

  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (!titleInput.value.trim()) { titleInput.focus(); return; }
      ctx.store.addTask({
        title: titleInput.value.trim(),
        type: selectedType,
        dueDate: dateInput.value || null,
        amount: amountInput.value ? Number(amountInput.value) : null,
        note: noteInput.value.trim(),
      });
      ctx.closeSheet();
      ctx.toast('Task added', icons.check());
    },
  }, [
    el('div', { class: 'field' }, [el('label', {}, 'Type'), typePicker]),
    el('div', { class: 'field' }, [el('label', {}, 'Title'), titleInput]),
    el('div', { style: 'display:flex;gap:12px' }, [
      el('div', { class: 'field', style: 'flex:1' }, [el('label', {}, 'Due date'), dateInput]),
      el('div', { class: 'field', style: 'flex:1' }, [el('label', {}, 'Amount ($)'), amountInput]),
    ]),
    el('div', { class: 'field' }, [el('label', {}, 'Note'), noteInput]),
    el('button', { class: 'btn block', type: 'submit' }, 'Save task'),
  ]);

  return sheetShell('Add task', ctx, form);
}

// ---------------------------------------------------------------------------
// Add / scan a document
// ---------------------------------------------------------------------------
export function addDocumentSheet(ctx) {
  let category = 'receipt';
  let pickedFileName = '';

  const nameInput = el('input', { type: 'text', placeholder: 'e.g. Car insurance card' });

  const categorySelect = el('select', {
    onchange: (e) => { category = e.target.value; },
  }, Object.entries(DOC_CATEGORIES).map(([key, info]) =>
    el('option', { value: key, selected: key === category ? 'true' : null }, info.label)));

  // Hidden native file input; the two big buttons trigger it (upload vs scan).
  const fileInput = el('input', {
    type: 'file', accept: 'image/*,application/pdf', style: 'display:none',
    onchange: (e) => {
      const f = e.target.files[0];
      if (!f) return;
      pickedFileName = f.name;
      if (!nameInput.value) nameInput.value = f.name.replace(/\.[^.]+$/, '');
      qs('.file-hint', root).textContent = `Selected: ${f.name}`;
      qs('.file-hint', root).style.color = 'var(--success-500)';
    },
  });

  const uploadBtn = el('button', { class: 'doc-tile', type: 'button', style: 'align-items:center;text-align:center',
    onclick: () => { fileInput.removeAttribute('capture'); fileInput.click(); } }, [
    el('div', { class: 'doc-icon', style: 'background:var(--brand-500)', html: icons.upload() }),
    el('h4', {}, 'Upload file'),
    el('small', {}, 'PDF, screenshot, receipt'),
  ]);

  const scanBtn = el('button', { class: 'doc-tile', type: 'button', style: 'align-items:center;text-align:center',
    onclick: () => { fileInput.setAttribute('capture', 'environment'); fileInput.click(); } }, [
    el('div', { class: 'doc-icon', style: 'background:var(--accent-500)', html: icons.scan() }),
    el('h4', {}, 'Scan document'),
    el('small', {}, 'Use your camera'),
  ]);

  const form = el('form', {
    onsubmit: (e) => {
      e.preventDefault();
      const doc = ctx.store.addDocument({
        name: nameInput.value.trim() || pickedFileName || 'Untitled document',
        category,
        fileType: /\.pdf$/i.test(pickedFileName) ? 'pdf' : 'image',
        size: '—',
        // For uploaded files we don't OCR in this demo; store the filename as
        // placeholder content so AI actions have something to work with.
        content: pickedFileName
          ? `Uploaded file: ${pickedFileName}. (Text extraction runs on the AI backend once connected.)`
          : 'New document added in LifeHub.',
      });
      ctx.closeSheet();
      ctx.toast('Document saved securely', icons.lock());
      ctx.openSheet(documentDetailSheet(ctx, doc.id));
    },
  }, [
    el('div', { class: 'doc-grid', style: 'margin-bottom:16px' }, [uploadBtn, scanBtn]),
    fileInput,
    el('div', { class: 'file-hint', style: 'font-size:.82rem;color:var(--text-muted);margin-bottom:16px;text-align:center' },
      'No file selected — you can still save a placeholder.'),
    el('div', { class: 'field' }, [el('label', {}, 'Name'), nameInput]),
    el('div', { class: 'field' }, [el('label', {}, 'Category'), categorySelect]),
    el('button', { class: 'btn block', type: 'submit' }, 'Save document'),
    el('div', { class: 'secure-note' }, [el('span', { html: icons.lock() }), 'Stored privately on your device']),
  ]);

  const root = sheetShell('Add document', ctx, form);
  return root;
}

// ---------------------------------------------------------------------------
// Document detail — view metadata + run AI summarize / extract
// ---------------------------------------------------------------------------
export function documentDetailSheet(ctx, docId) {
  const doc = ctx.store.state.documents.find((d) => d.id === docId);
  if (!doc) return sheetShell('Document', ctx, el('p', {}, 'This document no longer exists.'));

  const info = DOC_CATEGORIES[doc.category] || DOC_CATEGORIES.document;

  const aiMount = el('div', {});

  // Render whatever AI results are already cached on the document.
  function renderAI() {
    const nodes = [];
    if (doc.summary) {
      nodes.push(el('div', { class: 'ai-box' }, [
        el('div', { class: 'ai-head', html: `${icons.sparkle()}<span>AI Summary</span>` }),
        el('ul', {}, doc.summary.map((pt) => el('li', {}, pt))),
      ]));
    }
    if (doc.extracted) {
      const { dates, amounts, actions } = doc.extracted;
      nodes.push(el('div', { class: 'ai-box' }, [
        el('div', { class: 'ai-head', html: `${icons.sparkle()}<span>Extracted details</span>` }),
        el('ul', {}, [
          dates?.length ? el('li', {}, `Dates: ${dates.join(', ')}`) : null,
          amounts?.length ? el('li', {}, `Amounts: ${amounts.join(', ')}`) : null,
          ...(actions || []).map((a) => el('li', {}, `Action: ${a}`)),
        ].filter(Boolean)),
        el('button', { class: 'btn sm secondary', style: 'margin-top:10px',
          onclick: () => addExtractedAsTask() }, [/* label set below */]),
      ]));
      // set button label with icon
      const btn = nodes[nodes.length - 1].querySelector('button');
      btn.innerHTML = `${icons.bell()}<span style="margin-left:6px">Add reminder</span>`;
    }
    aiMount.replaceChildren(...nodes);
  }

  async function runSummary(btn) {
    setLoading(btn, 'Summarizing…');
    doc.summary = await aiService.summarize(doc.content || doc.name);
    ctx.store.updateDocument(doc.id, { summary: doc.summary });
    resetBtn(btn, `${icons.sparkle()} Summarize`);
    renderAI();
    ctx.toast('Summary ready', icons.sparkle());
  }

  async function runExtract(btn) {
    setLoading(btn, 'Extracting…');
    doc.extracted = await aiService.extract(doc.content || doc.name);
    ctx.store.updateDocument(doc.id, { extracted: doc.extracted });
    resetBtn(btn, `${icons.scan()} Extract info`);
    renderAI();
    ctx.toast('Details extracted', icons.check());
  }

  async function addExtractedAsTask() {
    const suggestion = await aiService.suggestTask(doc);
    ctx.store.addTask({
      title: suggestion.title,
      type: suggestion.type,
      dueDate: doc.extracted?.dates?.[0] || isoDaysFromNow(7),
      amount: suggestion.amount,
      note: `Created from document: ${doc.name}`,
    });
    ctx.toast('Reminder added to Today', icons.bell());
  }

  const summarizeBtn = el('button', { class: 'btn secondary', style: 'flex:1',
    html: `${icons.sparkle()}<span style="margin-left:6px">Summarize</span>`,
    onclick: (e) => runSummary(e.currentTarget) });
  const extractBtn = el('button', { class: 'btn secondary', style: 'flex:1',
    html: `${icons.scan()}<span style="margin-left:6px">Extract info</span>`,
    onclick: (e) => runExtract(e.currentTarget) });

  const header = el('div', { class: 'card', style: 'display:flex;gap:14px;align-items:center;margin-bottom:16px' }, [
    el('div', { class: 'doc-icon', style: `background:${info.color};width:48px;height:48px`, html: icons[info.icon]() }),
    el('div', { style: 'flex:1;min-width:0' }, [
      el('h3', { style: 'margin:0;font-size:1.05rem' }, doc.name),
      el('small', { style: 'color:var(--text-muted)' }, `${info.label} · ${doc.fileType.toUpperCase()} · Added ${formatDate(doc.addedAt)}`),
    ]),
  ]);

  const aiIntro = el('p', { style: 'font-size:.85rem;color:var(--text-muted);margin-bottom:12px' },
    aiService.AI_CONNECTED ? 'Use AI to understand this document:'
      : 'Use AI to understand this document (demo results — connect a provider to go live):');

  const deleteBtn = el('button', { class: 'btn ghost block', style: 'color:var(--danger-500);margin-top:8px',
    html: `${icons.trash()}<span style="margin-left:6px">Delete document</span>`,
    onclick: () => { if (confirm(`Delete "${doc.name}"?`)) { ctx.store.removeDocument(doc.id); ctx.closeSheet(); ctx.toast('Document deleted'); } } });

  const body = el('div', {}, [
    header,
    doc.note ? el('div', { class: 'chip brand', style: 'margin-bottom:12px' }, doc.note) : null,
    aiIntro,
    el('div', { style: 'display:flex;gap:10px;margin-bottom:4px' }, [summarizeBtn, extractBtn]),
    aiMount,
    el('div', { class: 'divider' }),
    deleteBtn,
  ]);

  const root = sheetShell('Document', ctx, body);
  renderAI();
  return root;
}

// --- small button state helpers --------------------------------------------
function setLoading(btn, label) {
  btn._html = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span><span style="margin-left:8px">${label}</span>`;
}
function resetBtn(btn, html) {
  btn.disabled = false;
  btn.innerHTML = html.replace('<svg', '<svg style="vertical-align:middle"');
}
