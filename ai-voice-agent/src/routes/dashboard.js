/**
 * Dashboard API and page routes.
 */

const express = require("express");
const sessionManager = require("../services/sessionManager");
const { getRecent } = require("../services/leadService");
const config = require("../config/business");

const router = express.Router();

// ── Dashboard page ────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// ── REST API endpoints ────────────────────────────────────────────────────────

/** GET /api/status – agent health + configuration summary */
router.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    agentName: config.agentName,
    businessName: config.businessName,
    businessHours: config.businessHours,
    voice: config.agentVoice,
    language: config.language,
    escalationEnabled: Boolean(config.escalationPhone),
    leadCaptureEnabled: config.captureLeads,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/** GET /api/calls – list active + recent call sessions */
router.get("/api/calls", (req, res) => {
  const sessions = sessionManager.list().map((s) => ({
    callSid: s.callSid,
    callerPhone: s.callerPhone,
    turns: s.turns,
    leadCaptured: s.leadCaptured,
    escalated: s.escalated,
    summary: s.summary,
    duration: s.duration,
    createdAt: s.createdAt,
    endedAt: s.endedAt,
    status: s.endedAt ? "ended" : "active",
  }));
  res.json({ calls: sessions, total: sessions.length });
});

/** GET /api/calls/:sid – full session including transcript */
router.get("/api/calls/:sid", (req, res) => {
  const session = sessionManager.get(req.params.sid);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

/** GET /api/leads – recent captured leads */
router.get("/api/leads", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  res.json({ leads: getRecent(limit) });
});

module.exports = router;
