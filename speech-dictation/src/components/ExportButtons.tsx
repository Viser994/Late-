"use client";

import { useState } from "react";
import { downloadTextFile, exportTranscript } from "@/lib/subtitles";
import type { ExportFormat, SpeakerNames, TranscriptResult } from "@/lib/types";
import { CheckIcon, DownloadIcon } from "./icons";

interface ExportButtonsProps {
  result: TranscriptResult;
  speakerNames: SpeakerNames;
  baseName: string;
}

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "srt", label: ".srt", hint: "SubRip captions" },
  { id: "vtt", label: ".vtt", hint: "WebVTT captions" },
  { id: "txt", label: ".txt", hint: "Plain transcript" },
];

export function ExportButtons({ result, speakerNames, baseName }: ExportButtonsProps) {
  const [justExported, setJustExported] = useState<ExportFormat | null>(null);

  const handleExport = (format: ExportFormat) => {
    const { content, mimeType, extension } = exportTranscript(format, result, speakerNames);
    downloadTextFile(`${baseName}.${extension}`, content, mimeType);
    setJustExported(format);
    window.setTimeout(() => setJustExported((current) => (current === format ? null : current)), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FORMATS.map((format) => {
        const done = justExported === format.id;
        return (
          <button
            key={format.id}
            type="button"
            onClick={() => handleExport(format.id)}
            title={format.hint}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              done
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-surface-800 text-zinc-200 hover:border-accent-400/50 hover:bg-accent-500/10 hover:text-accent-200"
            }`}
          >
            {done ? <CheckIcon width={14} height={14} /> : <DownloadIcon width={14} height={14} />}
            <span className="font-mono">{format.label}</span>
          </button>
        );
      })}
    </div>
  );
}
