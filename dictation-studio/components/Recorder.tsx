"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/format";
import { Waveform } from "./Waveform";

type RecState = "idle" | "recording" | "paused";

interface RecorderProps {
  disabled?: boolean;
  onComplete: (file: File) => void;
}

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function Recorder({ disabled, onComplete }: RecorderProps) {
  const [state, setState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulatedRef = useRef(0);
  const resumedAtRef = useRef(0);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    resumedAtRef.current = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + (Date.now() - resumedAtRef.current) / 1000);
    }, 200);
  };

  const teardown = useCallback(() => {
    stopTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    setAnalyser(null);
  }, []);

  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        rec.stop();
      }
      teardown();
    };
  }, [teardown]);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser. Try uploading a file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 1024;
      source.connect(node);
      audioCtxRef.current = ctx;
      setAnalyser(node);

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const file = new File([blob], `recording-${stamp}.${extensionFor(type)}`, { type });
        teardown();
        setState("idle");
        onComplete(file);
      };
      recorderRef.current = recorder;
      recorder.start(250);

      accumulatedRef.current = 0;
      setElapsed(0);
      startTimer();
      setState("recording");
    } catch (err) {
      teardown();
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser's site settings and try again."
          : "Could not access a microphone on this device.",
      );
    }
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (state === "recording") {
      rec.pause();
      accumulatedRef.current += (Date.now() - resumedAtRef.current) / 1000;
      stopTimer();
      setState("paused");
    } else if (state === "paused") {
      rec.resume();
      startTimer();
      setState("recording");
    }
  };

  const stop = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  };

  const live = state !== "idle";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Record</h2>
        <span
          className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
            state === "recording"
              ? "bg-red-500/15 text-red-300"
              : state === "paused"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-zinc-800 text-zinc-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              state === "recording" ? "animate-pulse bg-red-400" : state === "paused" ? "bg-amber-400" : "bg-zinc-500"
            }`}
          />
          {state === "recording" ? "Recording" : state === "paused" ? "Paused" : "Ready"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <Waveform analyser={analyser} active={state === "recording"} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="font-mono text-3xl tabular-nums tracking-tight text-zinc-100">{formatClock(elapsed)}</div>

        <div className="flex items-center gap-2">
          {!live ? (
            <button
              type="button"
              onClick={start}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              Start
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
              >
                {state === "paused" ? (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M8 5v14l11-7z" /></svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
                    Pause
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                Stop &amp; transcribe
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
