import assert from "node:assert/strict";
import { test } from "node:test";
import { displayName, formatSrtTime, formatVttTime, toSrt, toTxt, toVtt } from "./captions";
import { activeCueIndex, buildCues } from "./cues";
import { isAllowedMedia, uploadTooLarge } from "./media";
import { createRateLimiter } from "./rate-limit";
import { createSampleSession } from "./sample";

const cues = [
  { id: "1", speaker: "A", text: "Hello from the first speaker in this short caption.", start: 0, end: 1400, confidence: 0.9 },
  { id: "2", speaker: "B", text: "And a reply that lands a moment later.", start: 1800, end: 3200, confidence: 0.8 },
];

test("formats SRT and VTT timestamps", () => {
  assert.equal(formatSrtTime(0), "00:00:00,000");
  assert.equal(formatSrtTime(3661005), "01:01:01,005");
  assert.equal(formatVttTime(3661005), "01:01:01.005");
});

test("exports speaker names and renamed labels", () => {
  const srt = toSrt(cues, { A: "Mina" });
  assert.match(srt, /Speaker B/);
  assert.match(srt, /Mina/);
  assert.match(srt, /00:00:00,000 --> 00:00:01,400/);
  const vtt = toVtt(cues, { B: "Jonah" });
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /<v Jonah>/);
  assert.match(vtt, /00:00:01\.800 --> 00:00:03\.200/);
  const txt = toTxt(cues, { A: "Mina" });
  assert.match(txt, /\[00:00:01\.800\] Speaker B/);
  assert.equal(displayName("C", {}), "Speaker C");
});

test("splits words into speaker cues and keeps a readable length", () => {
  const words = [
    { text: "Alpha", start: 0, end: 400, speaker: "A", confidence: 1 },
    { text: "continues", start: 400, end: 800, speaker: "A", confidence: 1 },
    { text: "here.", start: 800, end: 1200, speaker: "A", confidence: 1 },
    { text: "Beta", start: 1500, end: 1900, speaker: "B", confidence: 0.5 },
    { text: "answers.", start: 1900, end: 2300, speaker: "B", confidence: 0.5 },
  ];
  const built = buildCues({ words, utterances: null, text: "ignored" });
  assert.equal(built.length, 2);
  assert.equal(built[0].speaker, "A");
  assert.equal(built[1].speaker, "B");
  assert.equal(built[1].text, "Beta answers.");
});

test("prefers diarized utterances and falls back to plain text", () => {
  const fromUtterances = buildCues({
    utterances: [
      {
        speaker: "A",
        text: "Long form without word times. Still captioned.",
        start: 0,
        end: 2000,
        confidence: 0.7,
        words: [],
      },
    ],
  });
  assert.equal(fromUtterances[0].speaker, "A");
  assert.match(fromUtterances[0].text, /Long form/);

  const fallback = buildCues({
    text: "Only a transcript. No timing.",
    audioDurationSec: 3,
  });
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].end, 3000);
});

test("highlights the cue that owns the playhead, including short gaps", () => {
  assert.equal(activeCueIndex(cues, -1), -1);
  assert.equal(activeCueIndex(cues, 0), 0);
  assert.equal(activeCueIndex(cues, 1500), 0);
  assert.equal(activeCueIndex(cues, 1800), 1);
  assert.equal(activeCueIndex(cues, 3200), -1);
});

test("accepts the supported upload types and caps size", () => {
  assert.equal(isAllowedMedia({ name: "take.MP3" }), true);
  assert.equal(isAllowedMedia({ name: "clip.webm" }), true);
  assert.equal(isAllowedMedia({ name: "notes.pdf" }), false);
  assert.equal(uploadTooLarge(150 * 1024 * 1024 + 1), true);
});

test("rate limit allows a burst and then blocks", () => {
  const allow = createRateLimiter({ windowMs: 1000, max: 2 });
  assert.equal(allow("a", 0), true);
  assert.equal(allow("a", 10), true);
  assert.equal(allow("a", 20), false);
  assert.equal(allow("b", 20), true);
  assert.equal(allow("a", 1200), true);
});

test("sample session is a playable wav with three cues", () => {
  const session = createSampleSession();
  assert.equal(session.file.type, "audio/wav");
  assert.ok(session.file.size > 1000);
  assert.equal(session.transcript.cues.length, 3);
  assert.equal(session.transcript.sample, true);
});
