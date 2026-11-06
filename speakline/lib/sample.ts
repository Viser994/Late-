import type { TranscriptResult } from "./types";

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function addTone(samples: Float32Array, sampleRate: number, startSec: number, endSec: number, frequency: number) {
  const start = Math.floor(startSec * sampleRate);
  const end = Math.min(samples.length, Math.floor(endSec * sampleRate));
  for (let index = start; index < end; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, (index - start) / (sampleRate * 0.03));
    const release = Math.min(1, (end - index) / (sampleRate * 0.05));
    const envelope = Math.max(0, Math.min(attack, release));
    samples[index] +=
      (Math.sin(2 * Math.PI * frequency * time) * 0.22 +
        Math.sin(2 * Math.PI * frequency * 2 * time) * 0.06) *
      envelope;
  }
}

export function createSampleSession(): { file: File; transcript: TranscriptResult } {
  const sampleRate = 16_000;
  const duration = 9;
  const samples = new Float32Array(sampleRate * duration);
  addTone(samples, sampleRate, 0.2, 2.6, 392);
  addTone(samples, sampleRate, 2.9, 5.4, 523.25);
  addTone(samples, sampleRate, 5.7, 8.6, 659.25);
  const blob = encodeWav(samples, sampleRate);
  const file = new File([blob], "speakline-sample.wav", { type: "audio/wav" });
  const transcript: TranscriptResult = {
    id: "sample",
    sample: true,
    languageCode: null,
    languageConfidence: null,
    audioDuration: duration,
    text: "Welcome in. This sample session lets you try seeking and export before a live transcription. Click any card and the playhead jumps to that moment. Export the same cues as SRT, VTT, or plain text.",
    cues: [
      {
        id: "sample-1",
        speaker: "A",
        start: 200,
        end: 2600,
        confidence: null,
        text: "Welcome in. This sample session lets you try seeking and export before a live transcription.",
      },
      {
        id: "sample-2",
        speaker: "B",
        start: 2900,
        end: 5400,
        confidence: null,
        text: "Click any card and the playhead jumps to that moment.",
      },
      {
        id: "sample-3",
        speaker: "A",
        start: 5700,
        end: 8600,
        confidence: null,
        text: "Export the same cues as SRT, VTT, or plain text.",
      },
    ],
  };
  return { file, transcript };
}
