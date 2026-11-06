"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileAudio, X } from "lucide-react";

export const ACCEPTED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "webm"];

export function isAcceptedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function Dropzone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!isAcceptedFile(next)) {
      setError(`“${next.name}” isn't supported. Please choose an .mp3, .wav, .m4a, .mp4 or .webm file.`);
      return;
    }
    setError(null);
    onFile(next);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
        <CloudUpload className="h-4 w-4 text-violet-300" /> Upload audio or video
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        We extract the audio track and transcribe it with speaker labels.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an audio or video file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
          dragging
            ? "border-cyan-400/70 bg-cyan-400/10"
            : "border-white/15 bg-black/20 hover:border-violet-400/50 hover:bg-violet-400/5"
        }`}
      >
        <CloudUpload className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-200">
          Drag &amp; drop your file here, or{" "}
          <span className="text-cyan-300 underline underline-offset-4">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">.mp3 · .wav · .m4a · .mp4 · .webm — up to 200 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <FileAudio className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-slate-400">
              {formatBytes(file.size)} · {file.type || "audio file"}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Remove selected file"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs leading-5 text-rose-300">{error}</p>}
    </section>
  );
}
