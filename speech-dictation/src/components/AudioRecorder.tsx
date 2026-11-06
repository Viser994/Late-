"use client";

import { useRecorder, type RecordingResult } from "@/hooks/useRecorder";
import { formatClock } from "@/lib/format";
import { AlertIcon, MicIcon, PauseIcon, PlayIcon, StopIcon, XIcon } from "./icons";
import { Waveform } from "./Waveform";

interface AudioRecorderProps {
  disabled?: boolean;
  onRecordingComplete: (result: RecordingResult) => void;
}

export function AudioRecorder({ disabled, onRecordingComplete }: AudioRecorderProps) {
  const recorder = useRecorder({ onComplete: onRecordingComplete });
  const isRecording = recorder.status === "recording";
  const isPaused = recorder.status === "paused";
  const isActive = isRecording || isPaused;

  return (
    <div className="card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
            <MicIcon width={16} height={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Record</h2>
            <p className="text-xs text-zinc-400">Dictate straight from your microphone</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm tabular-nums text-zinc-300">
          {isRecording && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
          )}
          {isPaused && <span className="text-xs uppercase tracking-wide text-amber-300">Paused</span>}
          <span>{formatClock(recorder.elapsedMs)}</span>
        </div>
      </div>

      <div className="relative flex-1 rounded-xl border border-white/5 bg-surface-900/80 p-3">
        <Waveform
          analyser={recorder.analyser}
          active={isRecording}
          className="h-24 w-full"
        />
        {!isActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            {recorder.status === "requesting"
              ? "Waiting for microphone permission…"
              : "Waveform appears here while recording"}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {!isActive ? (
          <button
            type="button"
            onClick={recorder.start}
            disabled={disabled || recorder.status === "requesting"}
            className="group inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MicIcon width={16} height={16} />
            Start recording
          </button>
        ) : (
          <>
            {isRecording ? (
              <ControlButton label="Pause" onClick={recorder.pause}>
                <PauseIcon width={18} height={18} />
              </ControlButton>
            ) : (
              <ControlButton label="Resume" onClick={recorder.resume}>
                <PlayIcon width={18} height={18} />
              </ControlButton>
            )}
            <button
              type="button"
              onClick={recorder.stop}
              aria-label="Stop recording"
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 ${
                isRecording ? "animate-pulse-ring" : ""
              }`}
            >
              <StopIcon width={22} height={22} />
            </button>
            <ControlButton label="Discard" onClick={recorder.cancel}>
              <XIcon width={18} height={18} />
            </ControlButton>
          </>
        )}
      </div>

      {recorder.error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <AlertIcon width={14} height={14} className="mt-0.5 shrink-0" />
          {recorder.error}
        </p>
      )}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface-700 text-zinc-200 transition hover:border-white/20 hover:bg-surface-600"
    >
      {children}
    </button>
  );
}
