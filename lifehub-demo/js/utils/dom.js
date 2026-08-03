// ============================================================================
// DOM helpers
// ----------------------------------------------------------------------------
// Tiny, dependency-free utilities for building UI. Keeping these in one place
// lets components stay declarative and readable.
// ============================================================================

/** Query a single element. */
export const qs = (sel, root = document) => root.querySelector(sel);

/** Query all elements as a real array. */
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Create an element with attributes + children in one call.
 * @param {string} tag
 * @param {object} attrs  className, dataset, on* handlers, html, or attributes
 * @param {Array|string|Node} children
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class' || key === 'className') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value);
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

/** Escape user-supplied strings before injecting as HTML. */
export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Replace the contents of a container with new nodes. */
export function render(container, ...nodes) {
  container.replaceChildren(...nodes.flat().filter(Boolean));
}
