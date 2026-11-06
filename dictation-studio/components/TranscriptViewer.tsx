"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExportButtons } from "./ExportButtons";
import { formatClock, speakerLabel } from "@/lib/format";
import { speakerStyle } from "@/lib/speakers";
import type { SpeakerNames, TranscriptResult } from "@/lib/types";
import { useFixInfiniteDuration } from "@/lib/useMediaDuration";

interface TranscriptViewerProps {
  file: File;
  result: TranscriptResult;
  onReset: () => void;
}

function languageName(code: string | null): string | null {
  if (!code) return null;
  try {
    const base = code.split(/[-_]/)[0];
    return new Intl.DisplayNames(["en"], { type: "language" }).of(base) ?? code;
  } catch {
    return code;
  }
}

export function TranscriptViewer({ file, result, onReset }: TranscriptViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [names, setNames] = useState<SpeakerNames>({});
  const [followAlong, setFollowAlong] = useState(true);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => setAudioEl(audioRef.current), [src]);
  useFixInfiniteDuration(audioEl, src);

  useEffect(() => {
    if (!audioEl) return;
    let raf = 0;
    const tick = () => {
      setCurrentMs(audioEl.currentTime * 1000);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      setCurrentMs(audioEl.currentTime * 1000);
    };
    audioEl.addEventListener("play", start);
    audioEl.addEventListener("pause", stop);
    audioEl.addEventListener("ended", stop);
    audioEl.addEventListener("seeked", stop);
    if (!audioEl.paused) start();
    return () => {
      cancelAnimationFrame(raf);
      audioEl.removeEventListener("play", start);
      audioEl.removeEventListener("pause", stop);
      audioEl.removeEventListener("ended", stop);
      audioEl.removeEventListener("seeked", stop);
    };
  }, [audioEl]);

  const { segments } = result;
  const speakers = useMemo(() => Array.from(new Set(segments.map((s) => s.speaker))).sort(), [segments]);

  const activeId = useMemo(() => {
    let active = -1;
    for (const seg of segments) {
      if (seg.start <= currentMs) active = seg.id;
      else break;
    }
    if (active >= 0 && currentMs > segments[active].end + 1500) return -1;
    return active;
  }, [segments, currentMs]);

  useEffect(() => {
    if (!followAlong || activeId < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-seg="${activeId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, followAlong]);

  const seek = (ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = ms / 1000;
    setCurrentMs(ms);
    void audio.play().catch(() => undefined);
  };

  const baseName = file.name.replace(/\.[^.]+$/, "") || "transcript";
  const lang = languageName(result.languageCode);

  return (
    <section aria-label="Transcript" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-100">{file.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {lang && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
                Detected: <span className="font-medium text-zinc-100">{lang}</span>
                {result.languageConfidence != null && ` (${Math.round(result.languageConfidence * 100)}%)`}
              </span>
            )}
            <span className="rounded-full bg-zinc-800 px-2.5 py-1">
              {speakers.length} speaker{speakers.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-zinc-800 px-2.5 py-1">{segments.length} segments</span>
            {result.duration != null && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1">{formatClock(result.duration)}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          New transcription
        </button>
      </div>

      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur">
        {src && <audio ref={audioRef} src={src} controls preload="metadata" className="h-11 w-full" data-testid="player" />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Speakers</span>
          {speakers.map((sp) => {
            const style = speakerStyle(speakers, sp);
            return (
              <label key={sp} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ${style.badge}`}>
                <span className={`h-2 w-2 rounded-full ${style.bar}`} />
                <input
                  value={names[sp] ?? ""}
                  placeholder={`Speaker ${sp}`}
                  aria-label={`Rename speaker ${sp}`}
                  onChange={(e) => setNames((n) => ({ ...n, [sp]: e.target.value }))}
                  className="w-24 bg-transparent placeholder:text-current placeholder:opacity-70 focus:outline-none"
                />
              </label>
            );
          })}
        </div>
        <ExportButtons segments={segments} names={names} baseName={baseName} />
      </div>

      <div className="flex items-center justify-between px-5 pt-3 text-xs text-zinc-500">
        <span>Click a card to jump to that moment.</span>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={followAlong}
            onChange={(e) => setFollowAlong(e.target.checked)}
            className="h-3.5 w-3.5 accent-indigo-500"
          />
          Follow along
        </label>
      </div>

      <div ref={listRef} className="max-h-[32rem] space-y-2 overflow-y-auto p-5 pt-3">
        {segments.map((seg) => {
          const style = speakerStyle(speakers, seg.speaker);
          const active = seg.id === activeId;
          return (
            <button
              key={seg.id}
              type="button"
              data-seg={seg.id}
              onClick={() => seek(seg.start)}
              aria-current={active}
              className={`group relative flex w-full gap-4 overflow-hidden rounded-xl border p-4 pl-5 text-left transition ${
                active
                  ? "border-indigo-400/60 bg-indigo-500/10 shadow-glow"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-600 hover:bg-zinc-900"
              }`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${style.bar} ${active ? "opacity-100" : "opacity-60"}`} />
              <span className="mt-0.5 shrink-0 self-start rounded-md bg-zinc-800 px-2 py-1 font-mono text-xs tabular-nums text-zinc-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-200">
                {formatClock(seg.start / 1000)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${style.badge}`}>
                  {speakerLabel(seg.speaker, names)}
                </span>
                <span className="mt-1.5 block text-[15px] leading-relaxed text-zinc-200">{seg.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
