/* ============================================================
   Answerly - in-browser AI voice agent demo
   Uses the Web Speech API (SpeechSynthesis + SpeechRecognition).
   No backend required. See server/ for the production reference.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Business profiles (fully customizable per client) ---------- */
  const BUSINESSES = [
    {
      name: "Bright Smile Dental",
      type: "Dental clinic · Brampton, ON",
      agent: "Ava",
      owner: "Dr. Patel",
      greeting: "Thanks for calling Bright Smile Dental - sorry we missed you!",
      hours: "We're open Monday to Friday, 9 AM to 6 PM, and Saturdays 9 to 2.",
      location: "We're at 25 Peel Centre Drive, Suite 200, in Brampton.",
      pricing: "New-patient exams and cleanings start at 129 dollars, and we accept most insurance plans.",
      bookingWord: "appointment",
      service: "cleaning or check-up",
    },
    {
      name: "Sharp Cuts Barbershop",
      type: "Barber & salon · Brampton, ON",
      agent: "Milo",
      owner: "Sam",
      greeting: "Thanks for calling Sharp Cuts - sorry we couldn't grab the phone!",
      hours: "We're open Tuesday to Saturday, 10 AM to 8 PM. Closed Sundays and Mondays.",
      location: "You'll find us at 55 Queen Street East in downtown Brampton.",
      pricing: "Haircuts are 35 dollars, beard trims are 20, and the cut-and-beard combo is 50.",
      bookingWord: "appointment",
      service: "haircut",
    },
    {
      name: "Peel Pro Plumbing",
      type: "Plumbing & HVAC · Brampton, ON",
      agent: "Riley",
      owner: "the on-call tech",
      greeting: "Thanks for calling Peel Pro Plumbing - sorry we missed your call!",
      hours: "We take calls 24/7 for emergencies, and our office hours are 8 AM to 6 PM daily.",
      location: "We service all of Brampton, Mississauga, and Caledon.",
      pricing: "Our standard service call is 89 dollars, which we waive if you book the repair with us.",
      bookingWord: "service visit",
      service: "repair",
    },
    {
      name: "Bella Notte Ristorante",
      type: "Restaurant · Brampton, ON",
      agent: "Gia",
      owner: "the host team",
      greeting: "Thanks for calling Bella Notte - sorry we couldn't pick up!",
      hours: "We're open for dinner Tuesday to Sunday, 4 PM to 10 PM.",
      location: "We're at 120 Main Street North in Brampton, with free parking in the back.",
      pricing: "Most mains run between 22 and 34 dollars, and we offer a 3-course prix fixe for 45.",
      bookingWord: "reservation",
      service: "table",
    },
  ];

  let bizIndex = 0;
  let biz = BUSINESSES[bizIndex];

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const startBtn = $("startCall");
  const endBtn = $("endCall");
  const micToggle = $("micToggle");
  const micRow = $("micRow");
  const textInput = $("textInput");
  const sendText = $("sendText");
  const transcript = $("transcript");
  const transcriptEmpty = $("transcriptEmpty");
  const listenHint = $("listenHint");
  const callStatus = $("callStatus");
  const callSub = $("callSub");
  const callTimer = $("callTimer");
  const captureList = $("captureList");
  const notifyCard = $("notifyCard");
  const smsBubble = $("smsBubble");
  const bizNameEl = $("bizName");
  const bizTypeEl = $("bizType");
  const switchBiz = $("switchBiz");

  /* ---------- Capabilities ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSynth = "speechSynthesis" in window;
  let useTyping = !SR; // fall back to typing when no recognition

  /* ---------- Call state ---------- */
  let active = false;
  let recognizer = null;
  let recognizing = false;
  let timerInt = null;
  let seconds = 0;
  let voice = null;

  let call = newCall();
  function newCall() {
    return { step: "idle", intent: null, name: null, phone: null, details: null, wrapCount: 0 };
  }

  /* ---------- Voice selection ---------- */
  function pickVoice() {
    if (!canSynth) return;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const prefer = [
      "Google US English", "Samantha", "Microsoft Aria Online", "Microsoft Jenny Online",
      "Microsoft Zira", "Karen", "Moira", "Google UK English Female",
    ];
    for (const p of prefer) {
      const v = voices.find((x) => x.name === p);
      if (v) { voice = v; return; }
    }
    voice = voices.find((v) => /en[-_]/i.test(v.lang) && /female|zira|aria|samantha|jenny/i.test(v.name))
      || voices.find((v) => /en[-_]/i.test(v.lang))
      || voices[0];
  }
  if (canSynth) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* ---------- UI helpers ---------- */
  function addMsg(who, text) {
    if (transcriptEmpty) transcriptEmpty.style.display = "none";
    const el = document.createElement("div");
    el.className = "msg " + who;
    const label = who === "ai" ? biz.agent + " (AI)" : who === "caller" ? "Caller" : "";
    el.innerHTML = (label ? '<span class="who">' + label + "</span>" : "") + escapeHtml(text);
    transcript.appendChild(el);
    transcript.scrollTop = transcript.scrollHeight;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function setPhoneState(state, sub) {
    callStatus.className = "call-status" + (state ? " " + state : "");
    if (sub !== undefined) callSub.textContent = sub;
  }
  function setCapture(key, value) {
    const li = captureList.querySelector('li[data-key="' + key + '"] b');
    if (li) { li.textContent = value; li.classList.add("filled"); }
  }
  function resetCapture() {
    captureList.querySelectorAll("b").forEach((b) => { b.textContent = "-"; b.classList.remove("filled"); });
    notifyCard.hidden = true;
    smsBubble.textContent = "";
  }

  /* ---------- Speaking ---------- */
  function speak(text, onDone) {
    addMsg("ai", text);
    setPhoneState("speaking", "On call · speaking");
    if (!canSynth) {
      setTimeout(() => { if (active) onDone && onDone(); }, Math.min(4200, 700 + text.length * 32));
      return;
    }
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.02; u.pitch = 1.0;
    u.onend = () => { if (active) onDone && onDone(); };
    u.onerror = () => { if (active) onDone && onDone(); };
    speechSynthesis.speak(u);
  }

  /* ---------- Listening ---------- */
  function listen() {
    if (!active) return;
    if (useTyping) {
      setPhoneState("listening", "On call · your turn");
      micRow.hidden = false;
      listenHint.hidden = true;
      textInput.focus();
      return;
    }
    setPhoneState("listening", "On call · listening");
    listenHint.hidden = false;
    try {
      recognizer = new SR();
      recognizer.lang = "en-US";
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizing = true;
      recognizer.onresult = (e) => {
        const said = e.results[0][0].transcript.trim();
        recognizing = false;
        listenHint.hidden = true;
        if (said) { addMsg("caller", said); process(said); }
        else listen();
      };
      recognizer.onerror = (e) => {
        recognizing = false;
        listenHint.hidden = true;
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          useTyping = true;
          micToggle.textContent = "🎤 Use mic";
          addMsg("system", "Microphone unavailable - switching to typing. Type your reply below.");
          listen();
        } else if (e.error === "no-speech" || e.error === "aborted") {
          if (active) listen();
        }
      };
      recognizer.onend = () => { recognizing = false; };
      recognizer.start();
    } catch (err) {
      useTyping = true;
      listen();
    }
  }
  function stopListening() {
    listenHint.hidden = true;
    if (recognizer && recognizing) { try { recognizer.stop(); } catch (e) {} }
    recognizing = false;
  }

  /* ---------- Intent detection ---------- */
  function detectIntent(t) {
    const s = t.toLowerCase();
    if (/(emergenc|urgent|flood|leak|burst|no heat|right now|asap|bleeding|severe|pain)/.test(s)) return "emergency";
    if (/(hour|open|close|closing|what time|when.*open)/.test(s)) return "hours";
    if (/(where|address|location|directions|parking|find you)/.test(s)) return "location";
    if (/(price|cost|how much|rate|fee|charge|quote|expensive)/.test(s)) return "pricing";
    if (/(book|appointment|schedule|reservation|reserve|table|come in|slot|availab)/.test(s)) return "booking";
    if (/(message|call.*back|leave.*message|have.*call|reach me)/.test(s)) return "message";
    return null;
  }
  const AFFIRM = /\b(yes|yeah|yep|sure|please|okay|ok|sounds good|that works|correct|right|absolutely)\b/i;
  const NEGATE = /\b(no|nope|nah|that's all|thats all|nothing else|i'm good|im good|all set)\b/i;
  const BYE = /\b(bye|goodbye|thank you|thanks|that's it|thats it|cheers)\b/i;

  function extractPhone(t) {
    const digits = (t.match(/\d/g) || []).join("");
    if (digits.length >= 7 && digits.length <= 15) return formatPhone(digits);
    return null;
  }
  function formatPhone(d) {
    if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    if (d.length === 11 && d[0] === "1") return d.slice(1).replace(/(\d{3})(\d{3})(\d{4})/, "+1 ($1) $2-$3");
    return d;
  }
  function extractName(t) {
    let m = t.match(/(?:my name is|this is|it's|its|i am|i'm|name's)\s+([a-z][a-z'.-]+(?:\s+[a-z][a-z'.-]+)?)/i);
    if (m) return titleCase(m[1]);
    const words = t.trim().split(/\s+/);
    if (words.length <= 3 && /^[a-z][a-z'.-]+$/i.test(words[0]) && !detectIntent(t)) return titleCase(t.trim());
    return null;
  }
  function titleCase(s) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }
  function withArticle(word) { return (/^[aeiou]/i.test(word) ? "an " : "a ") + word; }

  /* ---------- Conversation engine ---------- */
  function process(said) {
    if (!active) return;

    // Slot filling takes priority
    if (call.step === "getName") {
      const name = extractName(said) || (said.split(/\s+/).length <= 4 ? titleCase(said.trim()) : null);
      if (name) { call.name = name; setCapture("name", name); }
      askPhone();
      return;
    }
    if (call.step === "getPhone") {
      const phone = extractPhone(said);
      if (phone) { call.phone = phone; setCapture("phone", phone); confirmAndClose(); }
      else {
        speak("Sorry, I didn't catch a full number. What's the best 10-digit number to reach you at?", listen);
      }
      return;
    }
    if (call.step === "getDetails") {
      call.details = said;
      setCapture("details", said.length > 40 ? said.slice(0, 40) + "…" : said);
      speak("Got it. And who am I speaking with?", listen);
      call.step = "getName";
      return;
    }

    // General turn - detect intent / wrap-up cues
    if (BYE.test(said) && (call.name || call.phone)) { confirmAndClose(); return; }

    const intent = detectIntent(said);
    if (intent) { call.intent = call.intent || intent; setCapture("intent", labelIntent(intent)); handleIntent(intent, said); return; }

    if (call.step === "askElse") {
      if (NEGATE.test(said)) { wrapUp(); return; }
      if (AFFIRM.test(said)) { speak("Of course - what else can I help with?", listen); call.step = "open"; return; }
    }
    if (call.step === "askBookingChoice") {
      if (AFFIRM.test(said)) { startBooking(); return; }
      if (NEGATE.test(said)) { speak("No problem. Let me take your details so someone can follow up - what's your name?", listen); call.step = "getName"; return; }
    }

    // No clear intent -> treat as a message / reason
    if (!call.intent) { call.intent = "message"; setCapture("intent", "Message / inquiry"); }
    if (!call.details) { call.details = said; setCapture("details", said.length > 40 ? said.slice(0, 40) + "…" : said); }
    speak("Thanks for letting me know. I'll pass that along to " + biz.owner + ". Let me grab your details so someone can follow up - what's your name?", listen);
    call.step = "getName";
  }

  function labelIntent(i) {
    return { emergency: "Urgent / emergency", hours: "Business hours", location: "Location / directions",
      pricing: "Pricing inquiry", booking: "Wants to book " + withArticle(biz.bookingWord), message: "Message / inquiry" }[i] || i;
  }

  function handleIntent(intent, said) {
    switch (intent) {
      case "hours":
        speak(biz.hours + " Would you like me to book you " + withArticle(biz.bookingWord) + " while I have you?", () => { call.step = "askBookingChoice"; listen(); });
        break;
      case "location":
        speak(biz.location + " Is there anything else I can help you with?", () => { call.step = "askElse"; listen(); });
        break;
      case "pricing":
        speak(biz.pricing + " I'd be happy to set up " + withArticle(biz.bookingWord) + " for you - would that help?", () => { call.step = "askBookingChoice"; listen(); });
        break;
      case "booking":
        startBooking();
        break;
      case "emergency":
        speak("I'm so sorry - that sounds urgent. I'm flagging this as a priority right now and I'll have " + biz.owner + " call you back immediately. What's the best number to reach you?", listen);
        call.step = "getPhone";
        break;
      case "message":
      default:
        speak("Absolutely, I can take a message for " + biz.owner + ". What would you like me to pass along?", listen);
        call.step = "getDetails";
        break;
    }
  }

  function startBooking() {
    call.intent = "booking";
    setCapture("intent", labelIntent("booking"));
    speak("I'd love to get you booked. What day and time works best for your " + biz.service + "?", listen);
    call.step = "getDetails";
  }

  function askPhone() {
    speak((call.name ? "Thanks " + call.name + "! " : "") + "And what's the best phone number for us to call you back on?", listen);
    call.step = "getPhone";
  }

  function wrapUp() {
    if (!call.name) { speak("Before you go, can I grab your name so someone can follow up?", listen); call.step = "getName"; return; }
    if (!call.phone) { askPhone(); return; }
    confirmAndClose();
  }

  function confirmAndClose() {
    call.step = "closing";
    const parts = [];
    parts.push((call.name ? "Perfect, " + call.name + "! " : "Perfect! ") + "I've got everything I need.");
    if (call.intent === "emergency") parts.push((biz.owner === "the on-call tech" ? "Our on-call tech" : biz.owner) + " will call you back right away.");
    else parts.push("Someone from " + biz.name + " will reach out" + (call.phone ? " at " + call.phone : "") + " shortly.");
    parts.push("Thanks so much for calling - have a great day!");
    speak(parts.join(" "), () => { showNotification(); endCall(true); });
  }

  /* ---------- Owner notification (simulated SMS) ---------- */
  function showNotification() {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const lines = [
      "New lead from Answerly - " + now,
      "",
      "Business: " + biz.name,
      "Caller: " + (call.name || "Not provided"),
      "Callback: " + (call.phone || "Not provided"),
      "Reason: " + (call.intent ? labelIntent(call.intent) : "General inquiry"),
    ];
    if (call.details) lines.push("Notes: " + call.details);
    lines.push("", "Full transcript in your Answerly dashboard.");
    smsBubble.textContent = lines.join("\n");
    notifyCard.hidden = false;
  }

  /* ---------- Call lifecycle ---------- */
  function startCall() {
    if (active) return;
    if (canSynth) { try { speechSynthesis.resume(); } catch (e) {} }
    call = newCall();
    active = true;
    seconds = 0;
    callTimer.textContent = "00:00";
    resetCapture();
    transcript.querySelectorAll(".msg").forEach((m) => m.remove());
    startBtn.disabled = true;
    endBtn.disabled = false;
    micToggle.disabled = false;
    micRow.hidden = true;

    setPhoneState("ringing", "Incoming call… ringing");
    addMsg("system", "Incoming call - your line didn't pick up. Answerly is answering…");
    let rings = 0;
    const ringInt = setInterval(() => {
      rings++;
      if (rings >= 2 || !active) {
        clearInterval(ringInt);
        if (active) answer();
      }
    }, 950);
  }

  function answer() {
    startTimer();
    call.step = "open";
    const opener = biz.greeting + " This is " + biz.agent + ", the virtual assistant for " + biz.name + ". How can I help you today?";
    speak(opener, listen);
  }

  function endCall(natural) {
    active = false;
    stopListening();
    stopTimer();
    if (canSynth && !natural) { try { speechSynthesis.cancel(); } catch (e) {} }
    setPhoneState("", natural ? "Call completed · lead captured" : "Call ended");
    if (!natural) addMsg("system", "Call ended.");
    startBtn.disabled = false;
    startBtn.textContent = "📞 Simulate another call";
    endBtn.disabled = true;
    micToggle.disabled = true;
    micRow.hidden = true;
    listenHint.hidden = true;
  }

  function startTimer() {
    stopTimer();
    timerInt = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      callTimer.textContent = m + ":" + s;
    }, 1000);
  }
  function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; }

  /* ---------- Typing fallback ---------- */
  function submitText() {
    const val = textInput.value.trim();
    if (!val || !active) return;
    textInput.value = "";
    addMsg("caller", val);
    micRow.hidden = true;
    process(val);
  }

  /* ---------- Events ---------- */
  startBtn.addEventListener("click", startCall);
  endBtn.addEventListener("click", () => endCall(false));
  sendText.addEventListener("click", submitText);
  textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submitText(); } });

  micToggle.addEventListener("click", () => {
    useTyping = !useTyping;
    micToggle.textContent = useTyping ? "🎤 Use mic" : "⌨ Type instead";
    if (active) { stopListening(); listen(); }
  });

  switchBiz.addEventListener("click", () => {
    if (active) endCall(false);
    bizIndex = (bizIndex + 1) % BUSINESSES.length;
    biz = BUSINESSES[bizIndex];
    bizNameEl.textContent = biz.name;
    bizTypeEl.textContent = biz.type;
    resetCapture();
  });

  const ctaForm = $("ctaForm");
  if (ctaForm) {
    ctaForm.addEventListener("submit", (e) => {
      e.preventDefault();
      ctaForm.reset();
      const note = $("ctaNote");
      if (note) note.hidden = false;
    });
  }

  bizNameEl.textContent = biz.name;
  bizTypeEl.textContent = biz.type;
})();
