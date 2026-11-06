"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { AlertIcon, UploadIcon } from "./icons";

interface FileDropzoneProps {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}

export const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];
const ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_EXTENSIONS,
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "video/mp4",
  "video/webm",
].join(",");
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const okExtension = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const okMime = file.type.startsWith("audio/") || file.type.startsWith("video/");
  if (!okExtension && !okMime) {
    return `"${file.name}" is not a supported format. Use ${ACCEPTED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return "That file is larger than the 200 MB limit.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}

export function FileDropzone({ disabled, onFileSelected }: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      const problem = validateFile(file);
      setError(problem);
      if (!problem) onFileSelected(file);
    },
    [onFileSelected],
  );

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!disabled) setDragging(true);
  };

  return (
    <div className="card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
          <UploadIcon width={16} height={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-white">Upload</h2>
          <p className="text-xs text-zinc-400">Audio or video, up to 200 MB</p>
        </div>
      </div>

      <label
        htmlFor={inputId}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-accent-400 bg-accent-500/10"
            : "border-white/10 bg-surface-900/60 hover:border-white/20 hover:bg-surface-900"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
            dragging
              ? "border-accent-400/50 bg-accent-500/20 text-accent-200"
              : "border-white/10 bg-surface-800 text-zinc-300"
          }`}
        >
          <UploadIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-100">
            {dragging ? "Drop to upload" : "Drag & drop a file here"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            or <span className="text-accent-300 underline-offset-2 hover:underline">browse your computer</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {ACCEPTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-md border border-white/10 bg-surface-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
            >
              {ext}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <AlertIcon width={14} height={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
