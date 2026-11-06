"use client";

import { useEffect, useRef } from "react";
import { formatClock } from "@/lib/format";
import { speakerDisplayName, speakerTheme } from "@/lib/speakers";
import type { SpeakerNames, TranscriptSegment } from "@/lib/types";
import { PlayIcon } from "./icons";

interface TranscriptCardsProps {
  segments: TranscriptSegment[];
  speakers: string[];
  speakerNames: SpeakerNames;
  /** Current playhead position in milliseconds */
  currentMs: number;
  autoScroll: boolean;
  onSeek: (ms: number) => void;
}

export function TranscriptCards({
  segments,
  speakers,
  speakerNames,
  currentMs,
  autoScroll,
  onSeek,
}: TranscriptCardsProps) {
  const activeIndex = findActiveIndex(segments, currentMs);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const lastScrolledRef = useRef<number>(-1);

  useEffect(() => {
    if (!autoScroll || activeIndex < 0 || activeIndex === lastScrolledRef.current) return;
    lastScrolledRef.current = activeIndex;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex, autoScroll]);

  if (segments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
        No speech was detected in this file.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2.5">
      {segments.map((segment, index) => {
        const theme = speakerTheme(segment.speaker, speakers);
        const isActive = index === activeIndex;
        return (
          <li key={segment.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
            <button
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onSeek(segment.start)}
              aria-current={isActive ? "true" : undefined}
              className={`group w-full rounded-xl border p-4 text-left transition ${
                isActive
                  ? `border-white/15 bg-surface-700/80 ring-2 ${theme.ring}`
                  : "border-white/5 bg-surface-850/70 hover:border-white/15 hover:bg-surface-800"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
                  {speakerDisplayName(segment.speaker, speakerNames)}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-zinc-400">
                  <PlayIcon
                    width={10}
                    height={10}
                    className={`transition ${isActive ? theme.text : "text-zinc-600 group-hover:text-zinc-300"}`}
                  />
                  {formatClock(segment.start)}
                  <span className="text-zinc-600">→</span>
                  {formatClock(segment.end)}
                </span>
                <span className="ml-auto text-[11px] text-zinc-500">
                  {Math.round(segment.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-200">
                {isActive && segment.words.length > 0 ? (
                  <WordHighlighter words={segment.words} currentMs={currentMs} accentClass={theme.text} />
                ) : (
                  segment.text
                )}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function WordHighlighter({
  words,
  currentMs,
  accentClass,
}: {
  words: TranscriptSegment["words"];
  currentMs: number;
  accentClass: string;
}) {
  return (
    <>
      {words.map((word, index) => {
        const spoken = word.start <= currentMs;
        return (
          <span key={`${word.start}-${index}`}>
            <span className={spoken ? `${accentClass} transition-colors` : "text-zinc-400"}>
              {word.text}
            </span>
            {index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

function findActiveIndex(segments: TranscriptSegment[], currentMs: number): number {
  if (segments.length === 0) return -1;
  // Binary search for the last segment that starts at or before the playhead.
  let low = 0;
  let high = segments.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (segments[mid].start <= currentMs) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  if (found === -1) return -1;
  // Stay on the last segment while audio is inside it or in the gap before the next one.
  return found;
}
