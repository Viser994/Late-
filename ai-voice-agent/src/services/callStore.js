import { v4 as uuidv4 } from 'uuid';

const calls = new Map();
const MAX_CALLS = 500;

export function createCallSession(callSid, from) {
  const session = {
    id: uuidv4(),
    callSid,
    from,
    startedAt: new Date().toISOString(),
    messages: [],
    collected: {
      name: null,
      phone: null,
      email: null,
      reason: null,
      callbackRequested: false,
      preferredCallbackTime: null,
    },
    status: 'active',
    handledBy: 'ai',
  };

  calls.set(callSid, session);
  trimOldCalls();
  return session;
}

export function getCallSession(callSid) {
  return calls.get(callSid);
}

export function addMessage(callSid, role, content) {
  const session = calls.get(callSid);
  if (!session) return null;

  session.messages.push({
    role,
    content,
    at: new Date().toISOString(),
  });
  return session;
}

export function updateCollected(callSid, data) {
  const session = calls.get(callSid);
  if (!session) return null;

  session.collected = { ...session.collected, ...data };
  return session;
}

export function endCallSession(callSid, summary = null) {
  const session = calls.get(callSid);
  if (!session) return null;

  session.status = 'completed';
  session.endedAt = new Date().toISOString();
  if (summary) session.summary = summary;
  return session;
}

export function getRecentCalls(limit = 50) {
  return Array.from(calls.values())
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

function trimOldCalls() {
  if (calls.size <= MAX_CALLS) return;
  const sorted = Array.from(calls.entries()).sort(
    (a, b) => new Date(a[1].startedAt) - new Date(b[1].startedAt)
  );
  const toRemove = sorted.slice(0, calls.size - MAX_CALLS);
  for (const [key] of toRemove) {
    calls.delete(key);
  }
}
