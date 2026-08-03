// ============================================================================
// Documents view
// ----------------------------------------------------------------------------
// A secure vault for IDs, insurance cards, warranties, travel docs, receipts.
// Filterable by category; tapping a tile opens the detail sheet (with AI).
// ============================================================================

import { el } from '../utils/dom.js';
import { icons } from './icons.js';
import { DOC_CATEGORIES } from '../data/sampleData.js';
import { formatDate } from '../utils/dates.js';
import { documentDetailSheet } from './forms.js';

export function documentsView(ctx) {
  const { documents } = ctx.store.state;
  const activeFilter = ctx.viewState.docFilter || 'all';
  const shown = activeFilter === 'all'
    ? documents
    : documents.filter((d) => d.category === activeFilter);

  const header = el('div', { class: 'app-header' }, [
    el('div', { class: 'greeting' }, [
      el('small', {}, `${documents.length} items · encrypted on device`),
      el('h1', {}, 'Documents'),
    ]),
    el('button', { class: 'icon-btn', 'aria-label': 'Add document', html: icons.plus(),
      onclick: () => ctx.openAddDocument() }),
  ]);

  // Category filter row (horizontal scroll)
  const filters = ['all', ...Object.keys(DOC_CATEGORIES)];
  const filterRow = el('div', { class: 'filter-row' }, filters.map((key) => {
    const label = key === 'all' ? 'All' : DOC_CATEGORIES[key].label;
    return el('button', {
      class: `filter-chip ${key === activeFilter ? 'active' : ''}`,
      onclick: () => { ctx.viewState.docFilter = key; ctx.rerender(); },
    }, label);
  }));

  let content;
  if (!shown.length) {
    content = el('div', { class: 'empty' }, [
      el('div', { class: 'emoji' }, '\uD83D\uDCC1'),
      el('h3', {}, 'Nothing here yet'),
      el('p', {}, 'Upload or scan a document to keep it safe and searchable.'),
      el('button', { class: 'btn', style: 'margin-top:16px', html: `${icons.upload()}<span style="margin-left:6px">Add document</span>`,
        onclick: () => ctx.openAddDocument() }),
    ]);
  } else {
    content = el('div', { class: 'doc-grid' }, shown.map((doc) => docTile(doc, ctx)));
  }

  return el('div', {}, [
    header,
    filterRow,
    content,
    el('div', { class: 'secure-note' }, [el('span', { html: icons.lock() }), 'Only you can see these files']),
  ]);
}

function docTile(doc, ctx) {
  const info = DOC_CATEGORIES[doc.category] || DOC_CATEGORIES.document;
  return el('button', { class: 'doc-tile fade-up', onclick: () => ctx.openSheet(documentDetailSheet(ctx, doc.id)) }, [
    el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start' }, [
      el('div', { class: 'doc-icon', style: `background:${info.color}`, html: icons[info.icon]() }),
      doc.summary ? el('span', { class: 'chip brand', style: 'padding:2px 7px', html: icons.sparkle() }) : null,
    ]),
    el('h4', {}, doc.name),
    el('small', {}, `${info.label} · ${formatDate(doc.addedAt)}`),
  ]);
}
