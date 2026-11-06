"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { formatSeconds } from "@/lib/format";
import { PauseIcon, PlayIcon, VolumeIcon } from "./icons";

export interface AudioPlayerHandle {
  seekTo: (seconds: number, options?: { play?: boolean }) => void;
  pause: () => void;
}

interface AudioPlayerProps {
  src: string;
  isVideo: boolean;
  title: string;
  onTimeUpdate?: (seconds: number) => void;
  ref?: Ref<AudioPlayerHandle>;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({ src, isVideo, title, onTimeUpdate, ref }: AudioPlayerProps) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds, options) => {
        const media = mediaRef.current;
        if (!media) return;
        media.currentTime = Math.max(0, seconds);
        setCurrentTime(media.currentTime);
        onTimeUpdateRef.current?.(media.currentTime);
        if (options?.play) void media.play().catch(() => undefined);
      },
      pause: () => mediaRef.current?.pause(),
    }),
    [],
  );

  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) void media.play().catch(() => undefined);
    else media.pause();
  }, []);

  const skip = (delta: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.min(
      Math.max(0, media.currentTime + delta),
      Number.isFinite(media.duration) ? media.duration : media.currentTime + delta,
    );
  };

  const attachMedia = (node: HTMLMediaElement | null) => {
    mediaRef.current = node;
    if (node) {
      node.playbackRate = speed;
      node.volume = volume;
    }
  };

  const mediaEvents = {
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onTimeUpdate: (event: React.SyntheticEvent<HTMLMediaElement>) => {
      const t = event.currentTarget.currentTime;
      setCurrentTime(t);
      onTimeUpdateRef.current?.(t);
    },
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLMediaElement>) => {
      const d = event.currentTarget.duration;
      setDuration(Number.isFinite(d) ? d : 0);
    },
    onDurationChange: (event: React.SyntheticEvent<HTMLMediaElement>) => {
      const d = event.currentTarget.duration;
      if (Number.isFinite(d)) setDuration(d);
    },
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="card overflow-hidden">
      {isVideo ? (
        <video
          ref={attachMedia}
          src={src}
          preload="metadata"
          playsInline
          onClick={togglePlay}
          className="aspect-video w-full cursor-pointer bg-black"
          {...mediaEvents}
        />
      ) : (
        <audio ref={attachMedia} src={src} preload="metadata" {...mediaEvents} />
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-400"
          >
            {playing ? <PauseIcon /> : <PlayIcon className="translate-x-px" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100" title={title}>
              {title}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-zinc-400">
                {formatSeconds(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={Math.min(currentTime, duration || 0)}
                onChange={(event) => {
                  const media = mediaRef.current;
                  if (!media) return;
                  media.currentTime = Number(event.target.value);
                }}
                aria-label="Seek"
                className="player-range w-full"
                style={{ ["--progress" as string]: `${progress}%` }}
              />
              <span className="font-mono text-xs tabular-nums text-zinc-400">
                {formatSeconds(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => skip(-10)}
              className="rounded-md border border-white/10 bg-surface-800 px-2 py-1 font-mono text-zinc-300 transition hover:bg-surface-700"
            >
              −10s
            </button>
            <button
              type="button"
              onClick={() => skip(10)}
              className="rounded-md border border-white/10 bg-surface-800 px-2 py-1 font-mono text-zinc-300 transition hover:bg-surface-700"
            >
              +10s
            </button>
          </div>

          <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSpeed(value);
                  if (mediaRef.current) mediaRef.current.playbackRate = value;
                }}
                className={`rounded-md px-2 py-1 font-mono transition ${
                  speed === value
                    ? "bg-accent-500/20 text-accent-200"
                    : "text-zinc-400 hover:bg-surface-700 hover:text-zinc-200"
                }`}
              >
                {value}×
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-zinc-400">
            <VolumeIcon width={16} height={16} />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => {
                const v = Number(event.target.value);
                setVolume(v);
                if (mediaRef.current) mediaRef.current.volume = v;
              }}
              aria-label="Volume"
              className="player-range w-20"
              style={{ ["--progress" as string]: `${volume * 100}%` }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
