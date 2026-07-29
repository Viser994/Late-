/* ====================================================
   J.A.R.V.I.S. — Main Application Logic
   ==================================================== */

"use strict";

// ── DOM References ──────────────────────────────────────
const chatMessages     = document.getElementById("chat-messages");
const chatContainer    = document.getElementById("chat-container");
const textInput        = document.getElementById("text-input");
const sendBtn          = document.getElementById("send-btn");
const micBtn           = document.getElementById("mic-btn");
const listeningStatus  = document.getElementById("listening-status");
const arcReactor       = document.getElementById("arc-reactor");
const commLog          = document.getElementById("comm-log");
const bootOverlay      = document.getElementById("boot-overlay");
const bootProgress     = document.getElementById("boot-progress");
const bootLogEl        = document.getElementById("boot-log");
const systemStatusEl   = document.getElementById("system-status");
const aiModeLabel      = document.getElementById("ai-mode-label");
const aiBarEl          = document.getElementById("ai-bar");
const aiValEl          = document.getElementById("ai-val");
const voiceBarEl       = document.getElementById("voice-bar");
const voiceValEl       = document.getElementById("voice-val");
const micBarEl         = document.getElementById("mic-bar");
const micValEl         = document.getElementById("mic-val");
const uptimeEl         = document.getElementById("uptime");
const msgCountEl       = document.getElementById("msg-count");
const latValEl         = document.getElementById("lat-val");
const lonValEl         = document.getElementById("lon-val");
const typingStatusEl   = document.getElementById("typing-status");
const voiceToggle      = document.getElementById("voice-toggle");
const sfxToggle        = document.getElementById("sfx-toggle");
const voiceRate        = document.getElementById("voice-rate");
const voicePitch       = document.getElementById("voice-pitch");
const clearBtn         = document.getElementById("clear-btn");

// ── State ───────────────────────────────────────────────
let conversationHistory = [];
let messageCount        = 0;
let isListening         = false;
let isSpeaking          = false;
let recognition         = null;
let speechSynth         = window.speechSynthesis;
let preferredVoice      = null;
let startTime           = Date.now();
let aiMode              = "connecting";

// ── Audio Context for SFX ───────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playBeep(freq = 440, duration = 0.08, type = "sine", vol = 0.1) {
  if (!sfxToggle.checked) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playActivate() {
  playBeep(880, 0.06, "sine", 0.08);
  setTimeout(() => playBeep(1200, 0.08, "sine", 0.07), 70);
}

function playSend() {
  playBeep(660, 0.05, "sine", 0.06);
  setTimeout(() => playBeep(880, 0.07, "sine", 0.05), 60);
}

function playReceive() {
  playBeep(520, 0.04, "sine", 0.05);
  setTimeout(() => playBeep(720, 0.06, "sine", 0.05), 50);
}

// ── Particles Canvas ────────────────────────────────────
const canvas = document.getElementById("particles-canvas");
const ctx2d  = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x     = Math.random() * canvas.width;
    this.y     = Math.random() * canvas.height;
    this.vx    = (Math.random() - 0.5) * 0.3;
    this.vy    = (Math.random() - 0.5) * 0.3;
    this.alpha = Math.random() * 0.4 + 0.05;
    this.size  = Math.random() * 1.5 + 0.3;
    this.color = Math.random() > 0.7 ? "0, 255, 204" : "0, 212, 255";
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx2d.beginPath();
    ctx2d.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx2d.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx2d.fill();
  }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function animateParticles() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  // Draw faint connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx2d.beginPath();
        ctx2d.strokeStyle = `rgba(0, 212, 255, ${(1 - dist / 100) * 0.06})`;
        ctx2d.lineWidth = 0.5;
        ctx2d.moveTo(particles[i].x, particles[i].y);
        ctx2d.lineTo(particles[j].x, particles[j].y);
        ctx2d.stroke();
      }
    }
    particles[i].update();
    particles[i].draw();
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ── Uptime Counter ──────────────────────────────────────
setInterval(() => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  uptimeEl.textContent = `${h}:${m}:${s}`;
}, 1000);

// ── Geolocation ─────────────────────────────────────────
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    latValEl.textContent = `${pos.coords.latitude.toFixed(2)}°N`;
    lonValEl.textContent = `${Math.abs(pos.coords.longitude).toFixed(2)}°W`;
  }, () => {
    latValEl.textContent = "N/A";
    lonValEl.textContent = "N/A";
  });
}

// ── Speech Synthesis Setup ──────────────────────────────
function loadVoices() {
  const voices = speechSynth.getVoices();
  // Prefer British English male voice
  const preferred = voices.find(v =>
    v.lang === "en-GB" && v.name.toLowerCase().includes("male")
  ) || voices.find(v =>
    v.lang === "en-GB"
  ) || voices.find(v =>
    v.lang.startsWith("en") && (v.name.toLowerCase().includes("daniel") ||
    v.name.toLowerCase().includes("arthur") ||
    v.name.toLowerCase().includes("alex"))
  ) || voices.find(v => v.lang.startsWith("en"));
  preferredVoice = preferred || null;
}

loadVoices();
speechSynth.addEventListener("voiceschanged", loadVoices);

function speak(text) {
  if (!voiceToggle.checked) return;
  if (!text) return;

  speechSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate  = parseFloat(voiceRate.value);
  utterance.pitch = parseFloat(voicePitch.value);
  utterance.volume = 0.9;

  utterance.onstart = () => {
    isSpeaking = true;
    arcReactor.classList.add("talking");
    arcReactor.classList.remove("listening");
    voiceBarEl.style.width = "80%";
    voiceValEl.textContent = "ACTIVE";
    typingStatusEl.textContent = "SPEAKING";
  };

  utterance.onend = () => {
    isSpeaking = false;
    arcReactor.classList.remove("talking");
    voiceBarEl.style.width = "0%";
    voiceValEl.textContent = "STANDBY";
    typingStatusEl.textContent = "STANDBY";
  };

  speechSynth.speak(utterance);
}

// ── Speech Recognition Setup ────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function setupRecognition() {
  if (!SpeechRecognition) return null;
  const rec = new SpeechRecognition();
  rec.continuous     = false;
  rec.interimResults = true;
  rec.lang           = "en-US";
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    arcReactor.classList.add("listening");
    listeningStatus.textContent = "🎙 LISTENING — SPEAK NOW...";
    listeningStatus.style.color = "var(--warning)";
    micBarEl.style.width = "85%";
    micValEl.textContent = "ACTIVE";
    typingStatusEl.textContent = "LISTENING";
  };

  rec.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join("");
    textInput.value = transcript;
    if (event.results[event.results.length - 1].isFinal) {
      handleUserInput(transcript);
    }
  };

  rec.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    stopListening();
    if (event.error === "not-allowed") {
      listeningStatus.textContent = "⚠ MICROPHONE ACCESS DENIED";
    }
  };

  rec.onend = () => {
    stopListening();
  };

  return rec;
}

function startListening() {
  if (isSpeaking) speechSynth.cancel();
  if (!recognition) {
    recognition = setupRecognition();
    if (!recognition) {
      listeningStatus.textContent = "⚠ SPEECH RECOGNITION NOT SUPPORTED IN THIS BROWSER";
      return;
    }
  }
  try {
    recognition.start();
    playActivate();
  } catch (e) {
    stopListening();
  }
}

function stopListening() {
  isListening = false;
  micBtn.classList.remove("listening");
  arcReactor.classList.remove("listening");
  listeningStatus.textContent = "READY — AWAITING INPUT";
  listeningStatus.style.color = "";
  micBarEl.style.width = "0%";
  micValEl.textContent = "STANDBY";
  if (!isSpeaking) typingStatusEl.textContent = "STANDBY";
}

micBtn.addEventListener("click", () => {
  if (isListening) {
    try { recognition?.stop(); } catch (_) {}
    stopListening();
  } else {
    startListening();
  }
});

// ── Chat UI Functions ────────────────────────────────────
function addMessage(text, role) {
  const msgEl = document.createElement("div");
  msgEl.className = `message ${role}`;

  const sender = document.createElement("div");
  sender.className = "msg-sender";
  sender.textContent = role === "jarvis" ? "J.A.R.V.I.S." : "YOU";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msgEl.appendChild(sender);
  msgEl.appendChild(bubble);
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  messageCount++;
  msgCountEl.textContent = messageCount;

  addToCommLog(role, text);
  return msgEl;
}

function addTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.className = "message jarvis";
  wrapper.id = "typing-wrapper";

  const sender = document.createElement("div");
  sender.className = "msg-sender";
  sender.textContent = "J.A.R.V.I.S.";

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    indicator.appendChild(dot);
  }

  wrapper.appendChild(sender);
  wrapper.appendChild(indicator);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrapper;
}

function removeTypingIndicator() {
  const el = document.getElementById("typing-wrapper");
  if (el) el.remove();
}

function addToCommLog(role, text) {
  const entry = document.createElement("div");
  entry.className = `log-entry ${role === "jarvis" ? "jarvis-log" : "user-log"}`;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const shortened = text.length > 55 ? text.substring(0, 55) + "..." : text;
  entry.innerHTML = `<span class="log-time">${time}</span>${role === "jarvis" ? "[J]" : "[U]"} ${shortened}`;
  commLog.appendChild(entry);
  commLog.scrollTop = commLog.scrollHeight;
}

// ── Main Chat Logic ──────────────────────────────────────
async function handleUserInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  textInput.value = "";
  addMessage(trimmed, "user");
  playSend();

  typingStatusEl.textContent = "PROCESSING";
  const typingEl = addTypingIndicator();
  arcReactor.classList.remove("listening");

  conversationHistory.push({ role: "user", content: trimmed });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        history: conversationHistory.slice(-10)
      })
    });

    const data = await response.json();
    removeTypingIndicator();

    const reply = data.reply || "I'm afraid my response module encountered an error, sir.";
    conversationHistory.push({ role: "assistant", content: reply });

    addMessage(reply, "jarvis");
    playReceive();
    speak(reply);

  } catch (err) {
    removeTypingIndicator();
    const errorMsg = "I'm experiencing a communication disruption, sir. Please check the server connection.";
    addMessage(errorMsg, "jarvis");
    speak(errorMsg);
    console.error("Fetch error:", err);
  }
}

// ── Input Handlers ───────────────────────────────────────
sendBtn.addEventListener("click", () => {
  handleUserInput(textInput.value);
});

textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleUserInput(textInput.value);
  }
});

// Quick commands
document.querySelectorAll(".quick-cmd").forEach(btn => {
  btn.addEventListener("click", () => {
    const cmd = btn.dataset.cmd;
    textInput.value = cmd;
    handleUserInput(cmd);
  });
});

// Clear button
clearBtn.addEventListener("click", () => {
  chatMessages.innerHTML = "";
  commLog.innerHTML = "";
  conversationHistory = [];
  messageCount = 0;
  msgCountEl.textContent = "0";
  playBeep(220, 0.15, "sawtooth", 0.05);
  addSystemMessage("Chat cleared. Systems reset.", "info");
});

function addSystemMessage(text, type = "info") {
  const el = document.createElement("div");
  el.style.cssText = `
    text-align: center;
    font-family: var(--font-hud);
    font-size: 0.58rem;
    letter-spacing: 0.15em;
    color: ${type === "info" ? "var(--text-dim)" : "var(--warning)"};
    padding: 0.4rem;
    border-top: 1px solid rgba(0,212,255,0.1);
    border-bottom: 1px solid rgba(0,212,255,0.1);
  `;
  el.textContent = `— ${text} —`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Status Check ─────────────────────────────────────────
async function checkStatus() {
  try {
    const res  = await fetch("/api/status");
    const data = await res.json();
    aiMode = data.aiMode;

    if (aiMode === "openai") {
      aiModeLabel.textContent = "OPENAI GPT";
      aiModeLabel.style.color = "var(--accent2)";
      aiBarEl.style.width = "100%";
      aiValEl.textContent = "ONLINE";
    } else {
      aiModeLabel.textContent = "BUILT-IN";
      aiModeLabel.style.color = "var(--warning)";
      aiBarEl.style.width = "60%";
      aiValEl.textContent = "LIMITED";
    }
  } catch {
    aiModeLabel.textContent = "OFFLINE";
    aiModeLabel.style.color = "var(--danger)";
    aiBarEl.style.width = "0%";
    aiValEl.textContent = "ERROR";
  }
}

// ── Boot Sequence ────────────────────────────────────────
const BOOT_LINES = [
  { text: "[INIT] Booting J.A.R.V.I.S. v4.2.1...", type: "info", delay: 0 },
  { text: "[SYS]  Loading neural network modules...", type: "info", delay: 300 },
  { text: "[SYS]  Calibrating voice synthesis engine...", type: "info", delay: 600 },
  { text: "[OK]   Speech synthesis ready", type: "ok", delay: 900 },
  { text: "[SYS]  Initializing audio input drivers...", type: "info", delay: 1100 },
  { text: "[OK]   Microphone interface available", type: "ok", delay: 1350 },
  { text: "[SYS]  Connecting to AI inference endpoint...", type: "info", delay: 1550 },
  { text: "[SYS]  Loading personality matrix...", type: "info", delay: 1800 },
  { text: "[OK]   British wit module: loaded", type: "ok", delay: 2100 },
  { text: "[SYS]  Encrypting communication channels...", type: "info", delay: 2350 },
  { text: "[OK]   All systems operational", type: "ok", delay: 2600 },
  { text: "[BOOT] J.A.R.V.I.S. is online. Good day, sir.", type: "ok", delay: 2900 },
];

async function runBootSequence() {
  let progress = 0;
  const progressStep = 100 / (BOOT_LINES.length + 1);

  for (const line of BOOT_LINES) {
    await new Promise(r => setTimeout(r, line.delay - (BOOT_LINES.indexOf(line) > 0 ? BOOT_LINES[BOOT_LINES.indexOf(line) - 1].delay : 0)));

    const el = document.createElement("div");
    el.className = `boot-log-line ${line.type === "ok" ? "log-ok" : line.type === "warn" ? "log-warn" : "log-info"}`;
    el.textContent = line.text;
    bootLogEl.appendChild(el);
    bootLogEl.scrollTop = bootLogEl.scrollHeight;

    progress += progressStep;
    bootProgress.style.width = `${Math.min(progress, 100)}%`;
    playBeep(line.type === "ok" ? 880 : 440, 0.03, "sine", 0.04);
  }

  await new Promise(r => setTimeout(r, 500));
  bootProgress.style.width = "100%";
  await new Promise(r => setTimeout(r, 400));

  bootOverlay.classList.add("hidden");
  await new Promise(r => setTimeout(r, 800));
  bootOverlay.style.display = "none";

  // Check server status
  await checkStatus();

  // Greet the user
  const greeting = getTimeBasedGreeting();
  addMessage(greeting, "jarvis");
  playReceive();
  setTimeout(() => speak(greeting), 300);

  addSystemMessage("Voice commands available — click the microphone or type below", "info");
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour < 5)        timeOfDay = "late evening";
  else if (hour < 12)  timeOfDay = "morning";
  else if (hour < 17)  timeOfDay = "afternoon";
  else if (hour < 21)  timeOfDay = "evening";
  else                 timeOfDay = "evening";

  const greetings = [
    `Good ${timeOfDay}, sir. J.A.R.V.I.S. is fully operational. All systems are running within normal parameters. How may I assist you today?`,
    `Good ${timeOfDay}. I've completed my startup diagnostics and everything appears to be functioning optimally. I am at your disposal, sir.`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// ── Init ─────────────────────────────────────────────────
window.addEventListener("load", () => {
  // Preload voices
  speechSynth.getVoices();
  setTimeout(loadVoices, 500);

  // Check if speech recognition is supported
  if (!SpeechRecognition) {
    micBtn.style.opacity = "0.4";
    micBtn.title = "Speech recognition not supported in this browser. Use Chrome for best experience.";
    listeningStatus.textContent = "⚠ USE CHROME/EDGE FOR VOICE INPUT";
  }

  // Run boot sequence
  runBootSequence();
});
