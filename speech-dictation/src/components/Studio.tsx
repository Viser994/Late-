"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordingResult } from "@/hooks/useRecorder";
import { formatBytes, formatSeconds, languageName } from "@/lib/format";
import type { SpeakerNames, TranscriptResult } from "@/lib/types";
import { AudioPlayer, type AudioPlayerHandle } from "./AudioPlayer";
import { AudioRecorder } from "./AudioRecorder";
import { ExportButtons } from "./ExportButtons";
import { FileDropzone } from "./FileDropzone";
import { SpeakerLegend } from "./SpeakerLegend";
import { TranscriptCards } from "./TranscriptCards";
import {
  AlertIcon,
  ClockIcon,
  FileAudioIcon,
  GlobeIcon,
  RefreshIcon,
  SparklesIcon,
  SpinnerIcon,
  UsersIcon,
  XIcon,
} from "./icons";

interface MediaSource {
  file: File;
  url: string;
  isVideo: boolean;
  origin: "recording" | "upload";
  /** Known duration in seconds (recordings only) */
  durationHint?: number;
}

type JobStatus =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "processing" }
  | { kind: "error"; message: string };

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function stripExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(0, index) : name;
}

export function Studio() {
  const [source, setSource] = useState<MediaSource | null>(null);
  const [job, setJob] = useState<JobStatus>({ kind: "idle" });
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [speakerNames, setSpeakerNames] = useState<SpeakerNames>({});
  const [currentMs, setCurrentMs] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const playerRef = useRef<AudioPlayerHandle>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
  }, [source]);

  const busy = job.kind === "uploading" || job.kind === "processing";

  const replaceSource = useCallback((file: File, origin: MediaSource["origin"], durationHint?: number) => {
    requestRef.current?.abort();
    setResult(null);
    setSpeakerNames({});
    setCurrentMs(0);
    setJob({ kind: "idle" });
    setSource({
      file,
      url: URL.createObjectURL(file),
      isVideo:
        file.type.startsWith("video/") ||
        (/\.(mp4|webm)$/i.test(file.name) && !file.type.startsWith("audio/")),
      origin,
      durationHint,
    });
  }, []);

  const handleRecording = useCallback(
    ({ blob, mimeType, durationMs }: RecordingResult) => {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const file = new File([blob], `recording-${stamp}.${extensionForMime(mimeType)}`, {
        type: mimeType,
      });
      replaceSource(file, "recording", durationMs / 1000);
    },
    [replaceSource],
  );

  const handleUpload = useCallback(
    (file: File) => replaceSource(file, "upload"),
    [replaceSource],
  );

  const clearSource = () => {
    requestRef.current?.abort();
    setSource(null);
    setResult(null);
    setJob({ kind: "idle" });
    setCurrentMs(0);
  };

  const transcribe = () => {
    if (!source) return;
    setResult(null);
    setJob({ kind: "uploading", progress: 0 });

    const body = new FormData();
    body.append("file", source.file, source.file.name);

    const xhr = new XMLHttpRequest();
    requestRef.current = xhr;
    xhr.open("POST", "/api/transcribe");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setJob({ kind: "uploading", progress: Math.round((event.loaded / event.total) * 100) });
      }
    };
    xhr.upload.onload = () => setJob({ kind: "processing" });
    xhr.onerror = () => setJob({ kind: "error", message: "Network error while uploading. Check your connection and try again." });
    xhr.onabort = () => setJob({ kind: "idle" });
    xhr.onload = () => {
      requestRef.current = null;
      const payload = xhr.response as TranscriptResult | { error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && payload && "segments" in payload) {
        setResult(payload);
        setJob({ kind: "idle" });
      } else {
        const message =
          payload && "error" in payload && payload.error
            ? payload.error
            : `Transcription failed (HTTP ${xhr.status}).`;
        setJob({ kind: "error", message });
      }
    };
    xhr.send(body);
  };

  const seekTo = useCallback((ms: number) => {
    playerRef.current?.seekTo(ms / 1000, { play: true });
  }, []);

  const handleTimeUpdate = useCallback((seconds: number) => {
    setCurrentMs(seconds * 1000);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2">
        <AudioRecorder disabled={busy} onRecordingComplete={handleRecording} />
        <FileDropzone disabled={busy} onFileSelected={handleUpload} />
      </section>

      {source && (
        <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-700 text-accent-300">
            <FileAudioIcon width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100" title={source.file.name}>
              {source.file.name}
            </p>
            <p className="text-xs text-zinc-400">
              {source.origin === "recording" ? "Microphone recording" : "Uploaded file"} ·{" "}
              {formatBytes(source.file.size)}
              {source.file.type ? ` · ${source.file.type}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!result && (
              <button
                type="button"
                onClick={transcribe}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-400 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? <SpinnerIcon width={16} height={16} /> : <SparklesIcon width={16} height={16} />}
                {busy ? "Working…" : "Transcribe"}
              </button>
            )}
            {result && (
              <button
                type="button"
                onClick={transcribe}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surface-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-surface-700"
              >
                <RefreshIcon width={16} height={16} />
                Re-run
              </button>
            )}
            <button
              type="button"
              onClick={clearSource}
              aria-label="Remove file"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface-800 text-zinc-400 transition hover:bg-surface-700 hover:text-zinc-100"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>
        </section>
      )}

      {busy && <ProgressPanel job={job} />}

      {job.kind === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <p className="font-medium">Transcription failed</p>
            <p className="mt-0.5 text-rose-200/80">{job.message}</p>
          </div>
        </div>
      )}

      {source && result && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <AudioPlayer
              key={source.url}
              ref={playerRef}
              src={source.url}
              isVideo={source.isVideo}
              title={source.file.name}
              durationHint={source.durationHint}
              onTimeUpdate={handleTimeUpdate}
            />

            <div className="card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Transcript details
              </h3>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Stat
                  icon={<GlobeIcon width={14} height={14} />}
                  label="Language"
                  value={languageName(result.languageCode)}
                  hint={
                    result.languageConfidence !== null
                      ? `${Math.round(result.languageConfidence * 100)}% confidence`
                      : undefined
                  }
                />
                <Stat
                  icon={<UsersIcon width={14} height={14} />}
                  label="Speakers"
                  value={String(result.speakers.length)}
                />
                <Stat
                  icon={<ClockIcon width={14} height={14} />}
                  label="Duration"
                  value={result.audioDuration !== null ? formatSeconds(result.audioDuration) : "—"}
                />
              </dl>

              {result.speakers.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-zinc-500">Click a speaker to rename them.</p>
                  <SpeakerLegend
                    speakers={result.speakers}
                    speakerNames={speakerNames}
                    onRename={(speaker, name) =>
                      setSpeakerNames((prev) => ({ ...prev, [speaker]: name }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Export captions
              </h3>
              <ExportButtons
                result={result}
                speakerNames={speakerNames}
                baseName={stripExtension(source.file.name)}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Transcript{" "}
                <span className="font-normal text-zinc-500">· {result.segments.length} segments</span>
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-surface-800 accent-indigo-500"
                />
                Follow playback
              </label>
            </div>
            <div className="scrollbar-thin max-h-[70vh] overflow-y-auto pr-1 lg:max-h-[calc(100vh-6rem)]">
              <TranscriptCards
                segments={result.segments}
                speakers={result.speakers}
                speakerNames={speakerNames}
                currentMs={currentMs}
                autoScroll={autoScroll}
                onSeek={seekTo}
              />
            </div>
          </div>
        </section>
      )}

      {source && !result && !busy && job.kind !== "error" && (
        <AudioPlayer
          key={source.url}
          ref={playerRef}
          src={source.url}
          isVideo={source.isVideo}
          title={source.file.name}
          durationHint={source.durationHint}
          onTimeUpdate={handleTimeUpdate}
        />
      )}
    </div>
  );
}

function ProgressPanel({ job }: { job: JobStatus }) {
  const uploading = job.kind === "uploading";
  const progress = uploading ? job.progress : 100;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <SpinnerIcon width={18} height={18} className="text-accent-300" />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-100">
            {uploading ? `Uploading… ${progress}%` : "Detecting language and separating speakers…"}
          </p>
          <p className="text-xs text-zinc-400">
            {uploading
              ? "Sending your media to the server."
              : "AssemblyAI is transcribing your audio. This usually takes a fraction of the audio length."}
          </p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-700">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-accent-500 to-fuchsia-400 transition-[width] duration-300 ${
            uploading ? "" : "animate-pulse"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Step label="Upload" state={uploading ? "active" : "done"} />
        <Step label="Transcribe" state={uploading ? "pending" : "active"} />
        <Step label="Subtitles" state="pending" />
      </ol>
    </div>
  );
}

function Step({ label, state }: { label: string; state: "pending" | "active" | "done" }) {
  const styles = {
    pending: "border-white/5 text-zinc-500",
    active: "border-accent-500/40 bg-accent-500/10 text-accent-200",
    done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  }[state];
  return (
    <li className={`rounded-lg border px-3 py-2 text-center font-medium ${styles}`}>{label}</li>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-surface-900/60 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-zinc-100" title={value}>
        {value}
      </dd>
      {hint && <dd className="text-[11px] text-zinc-500">{hint}</dd>}
    </div>
  );
}
