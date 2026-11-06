"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, CircleAlert } from "lucide-react";
import LiveWaveform from "./LiveWaveform";
import { formatClock } from "@/lib/subtitles";

type RecorderState = "idle" | "recording" | "paused";

export default function Recorder({
  onRecordingReady,
  disabled,
}: {
  onRecordingReady: (file: File) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    stopTimer();
    startedAtRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(
        accumulatedRef.current + (Date.now() - startedAtRef.current) / 1000,
      );
    }, 200);
  };

  const teardownAudio = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    setAnalyser(null);
  };

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close().catch(() => undefined);
    },
    [],
  );

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording isn't supported in this browser. Try Chrome, Edge, or Safari 14.1+, or upload a file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const node = ctx.createAnalyser();
        node.fftSize = 2048;
        ctx.createMediaStreamSource(stream).connect(node);
        setAnalyser(node);
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(chunksRef.current, { type });
        const file = new File([blob], `recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`, {
          type,
        });
        teardownAudio();
        setState("idle");
        setElapsed(0);
        accumulatedRef.current = 0;
        if (blob.size > 0) onRecordingReady(file);
      };
      recorder.start(250);
      accumulatedRef.current = 0;
      setElapsed(0);
      startTimer();
      setState("recording");
    } catch (err) {
      teardownAudio();
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser, then try again — or upload a file."
          : "Couldn't start recording. Check your microphone and try again.",
      );
    }
  }

  function pause() {
    recorderRef.current?.pause();
    accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
    stopTimer();
    setState("paused");
  }

  function resume() {
    recorderRef.current?.resume();
    startTimer();
    setState("recording");
  }

  function stop() {
    recorderRef.current?.stop();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
            <Mic className="h-4 w-4 text-cyan-300" /> Record in your browser
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Dictate in any language — detection is automatic.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
            state === "recording"
              ? "bg-rose-500/10 text-rose-300 ring-rose-400/30"
              : state === "paused"
                ? "bg-amber-500/10 text-amber-300 ring-amber-400/30"
                : "bg-white/5 text-slate-400 ring-white/10"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${state === "recording" ? "animate-pulse bg-rose-400" : state === "paused" ? "bg-amber-400" : "bg-slate-500"}`}
          />
          {state === "recording" ? "Recording" : state === "paused" ? "Paused" : "Ready"}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 px-3 py-2">
        <LiveWaveform analyser={analyser} active={state !== "idle"} paused={state === "paused"} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="font-mono text-2xl tabular-nums text-white" aria-live="off">
          {formatClock(elapsed)}
        </div>
        <div className="flex items-center gap-2">
          {state === "idle" && (
            <button
              type="button"
              onClick={start}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Mic className="h-4 w-4" /> Start
            </button>
          )}
          {state === "recording" && (
            <button
              type="button"
              onClick={pause}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}
          {state === "paused" && (
            <button
              type="button"
              onClick={resume}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {state !== "idle" && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 flex gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-200 ring-1 ring-rose-400/20">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}
