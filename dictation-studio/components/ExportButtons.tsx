"use client";

import { EXPORT_MIME, serialize, type ExportFormat } from "@/lib/format";
import type { Segment, SpeakerNames } from "@/lib/types";

interface ExportButtonsProps {
  segments: Segment[];
  names: SpeakerNames;
  baseName: string;
}

const FORMATS: { format: ExportFormat; label: string; hint: string }[] = [
  { format: "srt", label: ".srt", hint: "SubRip subtitles" },
  { format: "vtt", label: ".vtt", hint: "WebVTT subtitles" },
  { format: "txt", label: ".txt", hint: "Plain-text transcript" },
];

export function ExportButtons({ segments, names, baseName }: ExportButtonsProps) {
  const download = (format: ExportFormat) => {
    const content = serialize(format, segments, names);
    const blob = new Blob([format === "vtt" || format === "srt" ? "\uFEFF" + content : content], {
      type: `${EXPORT_MIME[format]};charset=utf-8`,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Export</span>
      {FORMATS.map(({ format, label, hint }) => (
        <button
          key={format}
          type="button"
          title={hint}
          onClick={() => download(format)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 font-mono text-sm text-zinc-100 transition hover:border-indigo-400/60 hover:bg-zinc-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
          </svg>
          {label}
        </button>
      ))}
    </div>
  );
}
