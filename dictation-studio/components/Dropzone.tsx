"use client";

import { useRef, useState } from "react";

const ACCEPT_EXT = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];
const ACCEPT_ATTR = [...ACCEPT_EXT, "audio/*", "video/mp4", "video/webm"].join(",");

interface DropzoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPT_EXT.some((ext) => name.endsWith(ext)) || file.type.startsWith("audio/");
}

export function Dropzone({ disabled, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!isAccepted(file)) {
      setError(`Unsupported file type. Use ${ACCEPT_EXT.join(", ")}.`);
      return;
    }
    setError(null);
    onFile(file);
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Upload</h2>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handle(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          dragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-zinc-700 bg-zinc-950/60 hover:border-zinc-500 hover:bg-zinc-900/60"
        } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-200">
          Drag &amp; drop a file, or <span className="text-indigo-300 underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">{ACCEPT_EXT.join("  ")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          data-testid="file-input"
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
