"use client";

import { useCallback, useRef, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Recorder } from "@/components/Recorder";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import type { TranscriptResult } from "@/lib/types";

type Status = "idle" | "transcribing" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const transcribe = useCallback(async (selected: File) => {
    const id = ++requestId.current;
    setFile(selected);
    setResult(null);
    setError(null);
    setStatus("transcribing");

    try {
      const body = new FormData();
      body.append("file", selected, selected.name);
      const res = await fetch("/api/transcribe", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (id !== requestId.current) return;
      if (!res.ok || !json) {
        throw new Error(json?.error ?? `Transcription failed (HTTP ${res.status}).`);
      }
      setResult(json as TranscriptResult);
      setStatus("done");
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  const reset = () => {
    requestId.current++;
    setStatus("idle");
    setFile(null);
    setResult(null);
    setError(null);
  };

  const busy = status === "transcribing";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth={2} strokeLinecap="round">
                <path d="M4 10v4M8 6v12M12 3v18M16 8v8M20 11v2" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dictation Studio</h1>
          </div>
          <p className="mt-3 max-w-xl text-zinc-400">
            Record or upload speech in any language. Get a speaker-labelled, timestamped transcript you can click through
            and export as subtitles.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <li className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Auto language detection</li>
          <li className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Speaker diarization</li>
        </ul>
      </header>

      {status !== "done" && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur">
            <Recorder disabled={busy} onComplete={transcribe} />
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/30 backdrop-blur">
            <Dropzone disabled={busy} onFile={transcribe} />
          </div>
        </div>
      )}

      {busy && file && (
        <div
          role="status"
          className="mt-5 overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5"
        >
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-indigo-300" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-medium text-zinc-100">Transcribing {file.name}</p>
              <p className="text-xs text-zinc-400">
                Uploading, detecting language and identifying speakers. This can take a little while for long files.
              </p>
            </div>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-500 to-purple-400" />
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div>
            <p className="text-sm font-semibold text-red-200">Transcription failed</p>
            <p className="mt-1 text-sm text-red-300/90">{error}</p>
          </div>
          {file && (
            <button
              type="button"
              onClick={() => transcribe(file)}
              className="shrink-0 rounded-lg border border-red-400/40 px-3 py-1.5 text-sm text-red-100 transition hover:bg-red-500/20"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {status === "done" && file && result && (
        <TranscriptViewer key={result.id} file={file} result={result} onReset={reset} />
      )}

      <footer className="mt-16 text-center text-xs text-zinc-600">
        Audio is sent to AssemblyAI for transcription. Nothing is stored by this app.
      </footer>
    </main>
  );
}
