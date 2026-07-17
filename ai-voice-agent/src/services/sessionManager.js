/**
 * In-memory call session store.
 * Each Twilio call gets its own session keyed by CallSid so conversation
 * history and metadata persist across multiple webhook round-trips.
 */

const sessions = new Map();

// Prune sessions older than 2 hours (Twilio max call duration is ~4 h, but
// most calls finish long before that).
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [sid, session] of sessions) {
    if (session.createdAt < cutoff) sessions.delete(sid);
  }
}, 15 * 60 * 1000); // run every 15 min

/**
 * Retrieve an existing session or create a new one.
 * @param {string} callSid
 * @param {object} [meta] – extra fields merged into a new session
 */
function getOrCreate(callSid, meta = {}) {
  if (!sessions.has(callSid)) {
    sessions.set(callSid, {
      callSid,
      createdAt: Date.now(),
      messages: [],       // OpenAI conversation history
      turns: 0,
      callerName: null,
      callerPhone: meta.caller || null,
      leadCaptured: false,
      escalated: false,
      summary: null,
      ...meta,
    });
  }
  return sessions.get(callSid);
}

function get(callSid) {
  return sessions.get(callSid) || null;
}

function update(callSid, patch) {
  const session = sessions.get(callSid);
  if (!session) return null;
  Object.assign(session, patch);
  return session;
}

function destroy(callSid) {
  sessions.delete(callSid);
}

function list() {
  return [...sessions.values()];
}

module.exports = { getOrCreate, get, update, destroy, list };
