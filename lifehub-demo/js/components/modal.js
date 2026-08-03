/**
 * Modal component — reusable bottom-sheet for forms and details.
 */

import { escapeHtml } from "../utils/helpers.js";

let overlayEl = null;

/** Get or create the modal overlay element */
function getOverlay() {
  if (!overlayEl) {
    overlayEl = document.createElement("div");
    overlayEl.className = "modal-overlay";
    overlayEl.id = "modal-overlay";
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closeModal();
    });
  }
  return overlayEl;
}

/** Open a modal with title and HTML content */
export function openModal(title, contentHTML, { onClose } = {}) {
  const overlay = getOverlay();
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${escapeHtml(title)}">
      <div class="modal__header">
        <h2 class="modal__title">${escapeHtml(title)}</h2>
        <button class="modal__close" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">${contentHTML}</div>
    </div>
  `;

  overlay._onClose = onClose;
  overlay.querySelector(".modal__close").addEventListener("click", closeModal);

  requestAnimationFrame(() => overlay.classList.add("modal-overlay--open"));
}

/** Close the active modal */
export function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove("modal-overlay--open");
  if (overlayEl._onClose) overlayEl._onClose();
}

/** Check if modal is open */
export function isModalOpen() {
  return overlayEl?.classList.contains("modal-overlay--open");
}
