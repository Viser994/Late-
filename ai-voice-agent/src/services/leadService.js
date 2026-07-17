/**
 * Lead capture service.
 * Persists caller leads in memory and optionally POSTs them to a webhook.
 */

const config = require("../config/business");

const leads = [];

/**
 * Save a new lead and fire the webhook if configured.
 * @param {object} lead – { name, phone, callSid, callerPhone, summary }
 */
async function saveLead(lead) {
  const record = {
    ...lead,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    capturedAt: new Date().toISOString(),
  };

  leads.push(record);

  if (config.leadWebhook) {
    try {
      const response = await fetch(config.leadWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!response.ok) {
        console.error(`[Lead webhook] HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("[Lead webhook] Failed:", err.message);
    }
  }

  console.log(`[Lead] Captured: ${record.name || "Unknown"} – ${record.phone || record.callerPhone}`);
  return record;
}

function getAll() {
  return [...leads].reverse(); // newest first
}

function getRecent(limit = 20) {
  return leads.slice(-limit).reverse();
}

module.exports = { saveLead, getAll, getRecent };
