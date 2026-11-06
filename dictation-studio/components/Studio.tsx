"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Captions,
  CircleAlert,
  Download,
  FileText,
  Globe2,
  Languages,
  Loader2,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import Recorder from "./Recorder";
import Dropzone from "./Dropzone";
import MediaPlayer, { type MediaPlayerHandle } from "./MediaPlayer";
import TranscriptList from "./TranscriptList";
import type { JobStatus, TranscriptResult } from "@/lib/types";
import { DEMO_RESULT } from "@/lib/demo";
import {
  downloadTextFile,
  fileBaseName,
  formatClock,
  toSrt,
  toTxt,
  toVtt,
} from "@/lib/subtitles";

function languageName(code: string | null): string {
  if (!code) return "Auto-detected";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "language" }).of(
        code.replace("_", "-"),
      ) ?? code
    );
  } catch {
    return code;
  }
}

export default function Studio() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [speakersExpected, setSpeakersExpected] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);

  const playerRef = useRef<MediaPlayerHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const mediaUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/transcribe")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (status !== "transcribing") return;
    const started = Date.now();
    const id = window.setInterval(
      () => setElapsed((Date.now() - started) / 1000),
      250,
    );
    return () => window.clearInterval(id);
  }, [status]);

  const speakers = useMemo(
    () =>
      result
        ? [...new Set(result.utterances.map((u) => u.speaker))].sort()
        : [],
    [result],
  );

  const wordCount = useMemo(
    () => (result ? result.text.split(/\s+/).filter(Boolean).length : 0),
    [result],
  );

  const isVideo = file
    ? file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name)
    : false;

  function acceptFile(next: File) {
    if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    const url = URL.createObjectURL(next);
    mediaUrlRef.current = url;
    setMediaUrl(url);
    setFile(next);
    setResult(null);
    setSpeakerNames({});
    setCurrentTime(0);
    setError(null);
    setStatus("ready");
  }

  function clearFile() {
    if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    mediaUrlRef.current = null;
    setMediaUrl(null);
    setFile(null);
    setResult(null);
    setSpeakerNames({});
    setCurrentTime(0);
    setStatus("idle");
  }

  async function transcribe() {
    if (!file) return;
    setElapsed(0);
    setStatus("transcribing");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (speakersExpected > 0)
        form.append("speakersExpected", String(speakersExpected));

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as TranscriptResult & {
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Transcription failed. Please try again.");
      }
      setResult(data);
      setSpeakerNames({});
      setCurrentTime(0);
      setStatus("done");
      window.setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Transcription failed unexpectedly. Please try again.",
      );
    }
  }

  function loadDemo() {
    clearFile();
    setResult(DEMO_RESULT);
    setSpeakerNames({});
    setCurrentTime(0);
    setError(null);
    setStatus("done");
    window.setTimeout(
      () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }

  const baseName = fileBaseName(file?.name ?? result?.id ?? "transcript");
  const canExport = Boolean(result?.utterances.length);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100">
      {/* Backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute right-[-10rem] top-64 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070a12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
            <AudioLines className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-white">LingoScribe</p>
            <p className="text-[11px] text-slate-400">Dictation &amp; Subtitle Studio</p>
          </div>
          <nav className="ml-8 hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#studio" className="transition hover:text-white">Studio</a>
            <a href="#transcript" className="transition hover:text-white">Transcript</a>
            <a href="#how" className="transition hover:text-white">How it works</a>
          </nav>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
              configured
                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/25"
                : configured === false
                  ? "bg-amber-500/10 text-amber-300 ring-amber-400/25"
                  : "bg-white/5 text-slate-400 ring-white/10"
            }`}
            title={configured ? "ASSEMBLYAI_API_KEY is set on the server" : "No API key found — demo mode available"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-400" : configured === false ? "bg-amber-400" : "bg-slate-500"}`} />
            {configured ? "AssemblyAI connected" : configured === false ? "Demo mode — no API key" : "Checking API…"}
          </span>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="pb-10 pt-12 text-center sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Multilingual speech-to-text · Speaker diarization · Subtitle export
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Turn speech in any language into{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              perfect subtitles
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Record in your browser or drop in an audio/video file. We detect the
            language automatically, separate every speaker, and give you
            timestamped captions you can click, search, rename, and export.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-cyan-300" /> 99+ languages, auto-detected</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-violet-300" /> Speaker A / B / C diarization</span>
            <span className="inline-flex items-center gap-2"><Captions className="h-4 w-4 text-fuchsia-300" /> SRT · VTT · TXT export</span>
          </div>
        </section>

        {/* Studio */}
        <section id="studio" className="grid scroll-mt-24 gap-5 lg:grid-cols-[420px_1fr]">
          <div className="space-y-5">
            <Recorder onRecordingReady={acceptFile} disabled={status === "transcribing"} />
            <Dropzone file={file} onFile={acceptFile} onClear={clearFile} />

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <label htmlFor="speakers" className="text-sm font-semibold text-white">
                Speakers expected
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Optional hint for diarization. Leave on Auto if you&apos;re unsure.
              </p>
              <select
                id="speakers"
                value={speakersExpected}
                onChange={(e) => setSpeakersExpected(Number(e.target.value))}
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value={0}>Auto-detect speakers</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} speaker{n > 1 ? "s" : ""}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={transcribe}
                disabled={!file || status === "transcribing"}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "transcribing" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Transcribing… {formatClock(elapsed)}</>
                ) : (
                  <><Wand2 className="h-4 w-4" /> Transcribe with AssemblyAI</>
                )}
              </button>
              {status === "transcribing" && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Uploading securely and waiting for diarization — longer files take a little longer.
                </p>
              )}
              <button
                type="button"
                onClick={loadDemo}
                disabled={status === "transcribing"}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" /> Load demo transcript — no key needed
              </button>

              {error && (
                <p className="mt-3 flex gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs leading-5 text-rose-200 ring-1 ring-rose-400/20">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </p>
              )}
              {configured === false && !error && (
                <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-200 ring-1 ring-amber-400/20">
                  Add <code className="font-mono text-amber-100">ASSEMBLYAI_API_KEY</code> to{" "}
                  <code className="font-mono text-amber-100">.env.local</code> and restart to enable
                  live transcription. The demo works fully in the meantime.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <MediaPlayer
              ref={playerRef}
              src={mediaUrl}
              isVideo={isVideo}
              simulatedDuration={!mediaUrl && result ? (result.audioDuration ?? result.utterances.at(-1)?.end ?? null) : null}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              fileName={file?.name ?? "demo"}
            />

            <div
              id="transcript"
              ref={resultRef}
              className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Transcript &amp; subtitles
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Click any card to seek the player to that exact second.
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canExport}
                    onClick={() => result && downloadTextFile(`${baseName}.srt`, toSrt(result.utterances, speakerNames))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-3.5 w-3.5" /> .SRT
                  </button>
                  <button
                    type="button"
                    disabled={!canExport}
                    onClick={() => result && downloadTextFile(`${baseName}.vtt`, toVtt(result.utterances, speakerNames), "text/vtt;charset=utf-8")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Captions className="h-3.5 w-3.5" /> .VTT
                  </button>
                  <button
                    type="button"
                    disabled={!canExport}
                    onClick={() => result && downloadTextFile(`${baseName}.txt`, toTxt(result.utterances, speakerNames))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FileText className="h-3.5 w-3.5" /> .TXT
                  </button>
                </div>
              </div>

              {result ? (
                <>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      { label: "Language", value: languageName(result.language), icon: Languages },
                      { label: "Duration", value: formatClock(result.audioDuration ?? result.utterances.at(-1)?.end ?? 0), icon: AudioLines },
                      { label: "Speakers", value: String(speakers.length || "—"), icon: Users },
                      { label: "Words", value: wordCount.toLocaleString(), icon: FileText },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-2xl bg-black/25 px-3 py-2.5 ring-1 ring-white/5">
                        <dt className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
                          <Icon className="h-3 w-3" /> {label}
                        </dt>
                        <dd className="mt-0.5 truncate text-sm font-semibold text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {typeof result.languageConfidence === "number" && (
                    <p className="mt-2 text-xs text-slate-500">
                      Language confidence {Math.round(result.languageConfidence * 100)}%
                      {result.source === "demo" ? " · Demo transcript" : ""}
                    </p>
                  )}
                  <div className="mt-4">
                    <TranscriptList
                      utterances={result.utterances}
                      speakers={speakers}
                      speakerNames={speakerNames}
                      onRenameSpeaker={(speaker, name) =>
                        setSpeakerNames((prev) => ({ ...prev, [speaker]: name }))
                      }
                      currentTime={currentTime}
                      onSeek={(s) => playerRef.current?.seekTo(s)}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center">
                  <Captions className="mx-auto h-9 w-9 text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-300">No transcript yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Record or upload media on the left, then hit{" "}
                    <span className="text-slate-300">Transcribe with AssemblyAI</span> — or load the
                    demo to see timestamped speaker cards instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-16 scroll-mt-24">
          <h2 className="text-center text-xl font-bold text-white">How it works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Capture",
                body: "Record straight from your microphone with a live waveform, or drag in an .mp3, .wav, .m4a, .mp4 or .webm file.",
              },
              {
                step: "02",
                title: "Transcribe & diarize",
                body: "AssemblyAI detects the spoken language automatically (language_detection) and separates speakers (speaker_labels) server-side — your API key never reaches the browser.",
              },
              {
                step: "03",
                title: "Edit & export",
                body: "Click a card to seek, rename speakers, search the text, then download production-ready .srt, .vtt or .txt captions.",
              },
            ].map((card) => (
              <article key={card.step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-mono text-xs text-cyan-300">{card.step}</p>
                <h3 className="mt-2 text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-white/5 pt-6 text-center text-xs leading-5 text-slate-500">
          Audio is sent from the Next.js server route (<code className="font-mono">app/api/transcribe</code>) to
          AssemblyAI for transcription. Your <code className="font-mono">ASSEMBLYAI_API_KEY</code> stays
          server-side in an environment variable and is never exposed to the browser.
        </footer>
      </main>
    </div>
  );
}
