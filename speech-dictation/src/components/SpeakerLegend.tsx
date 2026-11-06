"use client";

import { useState } from "react";
import { defaultSpeakerName, speakerDisplayName, speakerTheme } from "@/lib/speakers";
import type { SpeakerNames } from "@/lib/types";
import { PencilIcon } from "./icons";

interface SpeakerLegendProps {
  speakers: string[];
  speakerNames: SpeakerNames;
  onRename: (speaker: string, name: string) => void;
}

export function SpeakerLegend({ speakers, speakerNames, onRename }: SpeakerLegendProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (speaker: string) => {
    setEditing(speaker);
    setDraft(speakerNames[speaker] ?? "");
  };

  const commit = () => {
    if (editing) onRename(editing, draft.trim());
    setEditing(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {speakers.map((speaker) => {
        const theme = speakerTheme(speaker, speakers);
        if (editing === speaker) {
          return (
            <form
              key={speaker}
              onSubmit={(event) => {
                event.preventDefault();
                commit();
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${theme.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setEditing(null);
                }}
                placeholder={defaultSpeakerName(speaker)}
                aria-label={`Rename ${defaultSpeakerName(speaker)}`}
                className="w-28 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </form>
          );
        }
        return (
          <button
            key={speaker}
            type="button"
            onClick={() => beginEdit(speaker)}
            title="Rename speaker"
            className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:brightness-125 ${theme.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
            {speakerDisplayName(speaker, speakerNames)}
            <PencilIcon width={11} height={11} className="opacity-0 transition group-hover:opacity-70" />
          </button>
        );
      })}
    </div>
  );
}
