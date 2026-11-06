"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Pencil, Play, Search } from "lucide-react";
import type { Utterance } from "@/lib/types";
import {
  formatClock,
  speakerClasses,
  speakerDot,
  speakerLabel,
} from "@/lib/subtitles";

interface Props {
  utterances: Utterance[];
  speakers: string[];
  speakerNames: Record<string, string>;
  onRenameSpeaker: (speaker: string, name: string) => void;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export default function TranscriptList({
  utterances,
  speakers,
  speakerNames,
  onRenameSpeaker,
  currentTime,
  onSeek,
}: Props) {
  const [query, setQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const activeIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < utterances.length; i++) {
      if (currentTime >= utterances[i].start && currentTime < utterances[i].end) {
        idx = i;
        break;
      }
      if (utterances[i].start <= currentTime) idx = i;
    }
    return idx;
  }, [currentTime, utterances]);

  useEffect(() => {
    if (!autoScroll || activeIdx < 0 || query) return;
    cardRefs.current
      .get(activeIdx)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIdx, autoScroll, query]);

  const visible = utterances
    .map((u, i) => ({ u, i }))
    .filter(({ u }) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        u.text.toLowerCase().includes(q) ||
        speakerLabel(u.speaker, speakerNames).toLowerCase().includes(q)
      );
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-44 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            className="w-full rounded-full border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="accent-cyan-400"
          />
          Auto-scroll
        </label>
      </div>

      {/* Speaker legend with rename */}
      {speakers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {speakers.map((speaker) => (
            <span
              key={speaker}
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${speakerClasses(speaker, speakers)}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${speakerDot(speaker, speakers)}`} />
              {editing === speaker ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => {
                    onRenameSpeaker(speaker, draftName);
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRenameSpeaker(speaker, draftName);
                      setEditing(null);
                    }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="w-28 rounded bg-black/40 px-1.5 py-0.5 text-xs text-white focus:outline-none"
                  aria-label={`Rename Speaker ${speaker}`}
                />
              ) : (
                speakerLabel(speaker, speakerNames)
              )}
              <button
                type="button"
                aria-label={`Rename ${speakerLabel(speaker, speakerNames)}`}
                onClick={() => {
                  setEditing(speaker);
                  setDraftName(speakerNames[speaker] ?? "");
                }}
                className="opacity-60 transition hover:opacity-100"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {visible.length === 0 && (
          <p className="rounded-2xl border border-white/5 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
            No lines match “{query}”.
          </p>
        )}
        {visible.map(({ u, i }) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={`${u.start}-${i}`}
              ref={(el) => {
                if (el) cardRefs.current.set(i, el);
                else cardRefs.current.delete(i);
              }}
              type="button"
              onClick={() => onSeek(u.start)}
              title="Click to play from here"
              className={`group block w-full rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-cyan-400/40 bg-cyan-400/[0.07] shadow-lg shadow-cyan-500/5"
                  : "border-white/5 bg-black/20 hover:border-violet-400/30 hover:bg-violet-400/[0.04]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${speakerClasses(u.speaker, speakers)}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${speakerDot(u.speaker, speakers)}`} />
                  {speakerLabel(u.speaker, speakerNames)}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  {formatClock(u.start)} → {formatClock(u.end)}
                </span>
                {typeof u.confidence === "number" && (
                  <span className="text-[11px] text-slate-500">
                    {Math.round(u.confidence * 100)}% confidence
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Copy this line"
                    onClick={(e) => {
                      e.stopPropagation();
                      void navigator.clipboard
                        ?.writeText(`${speakerLabel(u.speaker, speakerNames)}: ${u.text}`)
                        .catch(() => undefined);
                      setCopiedIdx(i);
                      window.setTimeout(() => setCopiedIdx(null), 1200);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="rounded-full p-1 text-slate-500 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  >
                    {copiedIdx === i ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <Play
                    className={`h-3.5 w-3.5 ${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-violet-300"}`}
                  />
                </span>
              </span>
              <span
                className={`mt-2 block text-[15px] leading-6 ${isActive ? "text-white" : "text-slate-200"}`}
              >
                {u.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
