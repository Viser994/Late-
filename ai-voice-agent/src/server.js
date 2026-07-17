/**
 * AI Voice Agent – main server entry point
 */

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const callRoutes = require("./routes/call");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false, // dashboard uses inline scripts
  })
);
app.use(cors());
app.use(morgan("dev"));

// Twilio sends URL-encoded form data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static dashboard files
app.use(express.static(path.join(__dirname, "../public")));

// ── Twilio signature validation (production safeguard) ────────────────────────
// Disabled by default in dev; enable by setting VALIDATE_TWILIO_SIGNATURE=true
if (process.env.VALIDATE_TWILIO_SIGNATURE === "true") {
  const twilio = require("twilio");
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  app.use("/call", (req, res, next) => {
    const signature = req.headers["x-twilio-signature"] || "";
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    if (!twilio.validateRequest(authToken, signature, url, req.body)) {
      console.warn("[Security] Invalid Twilio signature – request rejected");
      return res.status(403).send("Forbidden");
    }
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/call", callRoutes);
app.use("/", dashboardRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", ts: Date.now() }));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Server error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤖  AI Voice Agent running on port ${PORT}`);
  console.log(`    Dashboard → http://localhost:${PORT}`);
  console.log(`    Twilio webhook → http://<your-public-url>/call/incoming\n`);
});

module.exports = app;
