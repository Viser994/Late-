"use client";

import { useEffect, useRef, useState } from "react";
import { isAllowedMedia, uploadTooLarge } from "@/lib/media";
import { formatBytes, formatTimer } from "@/lib/time";
import type { MediaSource } from "@/lib/types";
import { Waveform } from "./Waveform";

type SourcePanelProps = {
  media: MediaSource | null;
  busy: boolean;
  phase: "idle" | "uploading" | "transcribing";
  uploadPct: number | null;
  error: string | null;
  onFile: (file: File, origin: "recording" | "upload", durationMs?: number) => void;
  configured: boolean | null;
  onClear: () => void;
  onTranscribe: () => void;
  onCancel: () => void;
  onSample: () => void;
};

function micMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone permission was blocked. Allow the mic for this site, or upload a file.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found. Plug one in, or upload a file.";
  }
  return "The microphone could not be opened. You can still upload an audio or video file.";
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export function SourcePanel({
  media,
  busy,
  phase,
  uploadPct,
  error,
  onFile,
  onClear,
  onTranscribe,
  onCancel,
  onSample,
  configured,
}: SourcePanelProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accumulatedRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const dragDepth = useRef(0);
  const disposedRef = useRef(false);

  function releaseGraph() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    recorderRef.current = null;
    if (!disposedRef.current) setAnalyser(null);
  }

  useEffect(() => {
    return () => {
      disposedRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* The recorder may already be stopping. */
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const context = contextRef.current;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setInterval(() => {
      const running = startedAtRef.current == null ? 0 : performance.now() - startedAtRef.current;
      setElapsed(accumulatedRef.current + running);
    }, 200);
    return () => window.clearInterval(id);
  }, [status]);

  async function startRecording() {
    setLocalError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setLocalError("This browser cannot record here. Open the site over HTTPS, or upload a file.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const context = new AudioContext();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const nextAnalyser = context.createAnalyser();
      nextAnalyser.fftSize = 2048;
      nextAnalyser.smoothingTimeConstant = 0.72;
      source.connect(nextAnalyser);

      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const recordedMs =
          accumulatedRef.current +
          (startedAtRef.current == null ? 0 : performance.now() - startedAtRef.current);
        releaseGraph();
        accumulatedRef.current = 0;
        startedAtRef.current = null;
        if (disposedRef.current) return;
        setElapsed(0);
        setStatus("idle");
        if (blob.size < 800) {
          setLocalError("That recording was too short. Hold the mic open a little longer.");
          return;
        }
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, "0");
        const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const file = new File([blob], `recording-${stamp}.${extensionForMime(type)}`, { type });
        onFile(file, "recording", recordedMs);
      });
      recorder.start(250);
      recorderRef.current = recorder;
      streamRef.current = stream;
      contextRef.current = context;
      setAnalyser(nextAnalyser);
      accumulatedRef.current = 0;
      startedAtRef.current = performance.now();
      setStatus("recording");
    } catch (caught) {
      releaseGraph();
      setStatus("idle");
      setLocalError(micMessage(caught));
    }
  }

  function pauseRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording" || typeof recorder.pause !== "function") {
      setLocalError("This browser can record, but it cannot pause.");
      return;
    }
    recorder.pause();
    if (startedAtRef.current != null) {
      accumulatedRef.current += performance.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    setElapsed(accumulatedRef.current);
    setStatus("paused");
  }

  function resumeRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startedAtRef.current = performance.now();
    setStatus("recording");
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  function takeFile(file: File | undefined) {
    if (!file) return;
    if (status !== "idle") {
      setLocalError("Stop the recording before uploading a file.");
      return;
    }
    if (!isAllowedMedia(file)) {
      setLocalError("Use an mp3, wav, m4a, mp4, or webm file.");
      return;
    }
    if (uploadTooLarge(file.size)) {
      setLocalError("Files need to be 150 MB or smaller.");
      return;
    }
    setLocalError(null);
    onFile(file, "upload");
  }

  const message = localError || error;
  const transcribeLabel =
    phase === "uploading"
      ? `Uploading ${Math.round((uploadPct ?? 0) * 100)}%`
      : phase === "transcribing"
        ? "Transcribing"
        : media?.origin === "sample"
          ? "Transcribe sample"
          : "Transcribe";

  return (
    <section className="flex flex-col gap-4">
      <article
        className={`rounded-3xl border bg-panel/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] ${
          status === "recording" ? "border-coral/50" : "border-white/10"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-acid uppercase">Recorder</p>
            <h2 className="mt-1 font-serif text-3xl text-cream">Microphone</h2>
          </div>
          <p className="font-mono text-2xl tabular-nums text-cream" aria-live="polite">
            {formatTimer(elapsed)}
          </p>
        </div>
        <p className="mt-2 text-sm text-mist">
          {status === "recording"
            ? "Listening. Pause keeps the mic open. Stop saves the take."
            : status === "paused"
              ? "Paused. The microphone is still open until you stop."
              : "Start a take, or drop a file below. Language and speakers are detected on the server."}
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-ink">
          <Waveform analyser={analyser} active={status !== "idle"} paused={status === "paused"} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={status === "paused" ? resumeRecording : startRecording}
            disabled={busy || status === "recording"}
            className="rounded-full bg-coral px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#ff7462] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "paused" ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            onClick={pauseRecording}
            disabled={status !== "recording"}
            aria-pressed={status === "paused"}
            className="rounded-full border border-white/15 px-3 py-3 text-sm font-semibold text-cream transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={status === "idle"}
            className="rounded-full border border-white/15 px-3 py-3 text-sm font-semibold text-cream transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Stop
          </button>
        </div>
      </article>

      <article className="rounded-3xl border border-white/10 bg-panel/90 p-5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-acid uppercase">Upload</p>
        <h2 className="mt-1 font-serif text-3xl text-cream">Audio or video</h2>
        <label
          data-testid="dropzone"
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setOver(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setOver(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${
            over ? "border-acid bg-acid/10" : "border-white/15 bg-ink/50 hover:border-white/35"
          } ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              takeFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <span className="text-sm font-medium text-cream">Drop a file, or click to browse</span>
          <span className="mt-1 text-xs text-mist">mp3, wav, m4a, mp4, webm · up to 150 MB</span>
        </label>

        {media && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-panel-2 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-cream">{media.name}</p>
              <p className="text-xs text-mist">
                {media.kind === "video" ? "Video" : "Audio"} · {formatBytes(media.file.size)} ·{" "}
                {media.origin === "recording" ? "Recording" : media.origin === "sample" ? "Sample" : "Upload"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClear}
              disabled={busy || status !== "idle"}
              className="shrink-0 rounded-full px-3 py-2 text-xs text-mist hover:text-cream disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            data-testid="transcribe-button"
            onClick={onTranscribe}
            disabled={!media || busy || status !== "idle"}
            className="rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {transcribeLabel}
          </button>
          {busy ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-cream hover:border-white/40"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              data-testid="sample-button"
              onClick={onSample}
              disabled={status !== "idle"}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-cream hover:border-white/40 disabled:opacity-40"
            >
              Preview a sample session
            </button>
          )}
        </div>
        {configured === false && phase === "idle" && (
          <p className="mt-3 text-sm leading-6 text-mist">
            Add <span className="text-cream">ASSEMBLYAI_API_KEY</span> on the server for live transcription.
            Seeking, playback, and caption export still work on the sample session.
          </p>
        )}
        {phase === "transcribing" && (
          <p className="mt-3 text-sm text-mist" role="status">
            Detecting the language and separating speakers. Longer files take a minute.
          </p>
        )}
        {message && (
          <p className="mt-3 text-sm text-coral" role="alert">
            {message}
          </p>
        )}
      </article>
    </section>
  );
}
