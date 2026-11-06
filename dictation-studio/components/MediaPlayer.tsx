"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { formatClock } from "@/lib/subtitles";

export interface MediaPlayerHandle {
  seekTo: (seconds: number, autoplay?: boolean) => void;
}

interface Props {
  src: string | null;
  isVideo: boolean;
  /** Used for the simulated playhead in demo mode when there is no media file. */
  simulatedDuration: number | null;
  currentTime: number;
  onTimeUpdate: (seconds: number) => void;
  fileName?: string;
}

const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

const MediaPlayer = forwardRef<MediaPlayerHandle, Props>(function MediaPlayer(
  { src, isVideo, simulatedDuration, currentTime, onTimeUpdate, fileName },
  ref,
) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const simTimerRef = useRef<number | null>(null);
  const simTimeRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  const effectiveDuration = src ? duration : (simulatedDuration ?? 0);
  const progress = effectiveDuration > 0 ? currentTime / effectiveDuration : 0;

  // Deterministic pseudo-peaks so the waveform looks like real audio and is
  // stable across renders for a given file.
  const peaks = useMemo(() => {
    const seed = (fileName ?? "demo").split("").reduce((a, c) => a + c.charCodeAt(0), 7);
    return Array.from({ length: 72 }, (_, i) => {
      const v = Math.sin(i * 12.9898 + seed) * 43758.5453;
      return 0.18 + 0.82 * (v - Math.floor(v));
    });
  }, [fileName]);

  const stopSimulation = () => {
    if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    simTimerRef.current = null;
  };

  useEffect(() => stopSimulation, []);
  useEffect(() => {
    setPlaying(false);
    stopSimulation();
    simTimeRef.current = 0;
    setDuration(0);
  }, [src, simulatedDuration]);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number, autoplay = true) {
      const media = mediaRef.current;
      if (media && src) {
        media.currentTime = seconds;
        onTimeUpdate(seconds);
        if (autoplay) void media.play().catch(() => undefined);
      } else {
        // Demo mode: move the simulated playhead.
        simTimeRef.current = seconds;
        onTimeUpdate(seconds);
        if (autoplay && simulatedDuration) startSimulation(seconds);
      }
    },
  }));

  function startSimulation(from: number) {
    stopSimulation();
    simTimeRef.current = from;
    setPlaying(true);
    const startedAt = Date.now();
    const base = from;
    simTimerRef.current = window.setInterval(() => {
      const t = base + ((Date.now() - startedAt) / 1000) * SPEEDS[speedIdx];
      if (simulatedDuration && t >= simulatedDuration) {
        simTimeRef.current = simulatedDuration;
        onTimeUpdate(simulatedDuration);
        stopSimulation();
        setPlaying(false);
        return;
      }
      simTimeRef.current = t;
      onTimeUpdate(t);
    }, 100);
  }

  function togglePlay() {
    const media = mediaRef.current;
    if (media && src) {
      if (media.paused) void media.play().catch(() => undefined);
      else media.pause();
      return;
    }
    if (!simulatedDuration) return;
    if (playing) {
      stopSimulation();
      setPlaying(false);
    } else {
      startSimulation(
        simTimeRef.current >= simulatedDuration ? 0 : simTimeRef.current || currentTime,
      );
    }
  }

  function seekBy(delta: number) {
    const media = mediaRef.current;
    const target = Math.min(
      Math.max(0, currentTime + delta),
      effectiveDuration || 0,
    );
    if (media && src) {
      media.currentTime = target;
      onTimeUpdate(target);
    } else {
      simTimeRef.current = target;
      onTimeUpdate(target);
      if (playing) startSimulation(target);
    }
  }

  function seekFromBar(clientX: number, rect: DOMRect) {
    if (!effectiveDuration) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const target = ratio * effectiveDuration;
    const media = mediaRef.current;
    if (media && src) {
      media.currentTime = target;
      onTimeUpdate(target);
    } else {
      simTimeRef.current = target;
      onTimeUpdate(target);
      if (playing) startSimulation(target);
    }
  }

  const mediaProps = {
    src: src ?? undefined,
    preload: "metadata" as const,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      onTimeUpdate(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration || 0),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    className: isVideo ? "max-h-64 w-full rounded-2xl bg-black" : "hidden",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-white">Player</h2>
        <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300 ring-1 ring-white/10">
          {formatClock(currentTime)} / {formatClock(effectiveDuration)}
        </span>
      </div>

      {isVideo && src ? (
        <video ref={(el) => { mediaRef.current = el; }} {...mediaProps} controls={false} />
      ) : (
        <audio ref={(el) => { mediaRef.current = el; }} {...mediaProps} />
      )}

      {/* Clickable waveform / progress */}
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(effectiveDuration)}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") seekBy(5);
          if (e.key === "ArrowLeft") seekBy(-5);
        }}
        onClick={(e) => seekFromBar(e.clientX, e.currentTarget.getBoundingClientRect())}
        className="mt-4 flex h-16 cursor-pointer items-end gap-[2px] rounded-2xl border border-white/5 bg-black/30 px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400/50"
        title="Click to seek"
      >
        {peaks.map((peak, i) => {
          const filled = i / peaks.length <= progress;
          return (
            <span
              key={i}
              style={{ height: `${Math.round(peak * 100)}%` }}
              className={`w-full min-w-[2px] rounded-full transition-colors ${filled ? "bg-gradient-to-t from-violet-400 to-cyan-300" : "bg-slate-600/60"}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => seekBy(-5)}
          className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Back 5 seconds"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!src && !simulatedDuration}
          className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => seekBy(5)}
          className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Forward 5 seconds"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const next = (speedIdx + 1) % SPEEDS.length;
            setSpeedIdx(next);
            if (mediaRef.current) mediaRef.current.playbackRate = SPEEDS[next];
            if (playing && !src) startSimulation(simTimeRef.current);
          }}
          className="rounded-full bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
          aria-label="Playback speed"
        >
          {SPEEDS[speedIdx]}×
        </button>
      </div>
      {!src && !simulatedDuration && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Record or upload media to enable playback.
        </p>
      )}
      {!src && simulatedDuration ? (
        <p className="mt-3 text-center text-xs text-slate-500">
          Demo mode — simulated playhead (no audio file attached).
        </p>
      ) : null}
    </div>
  );
});

export default MediaPlayer;
