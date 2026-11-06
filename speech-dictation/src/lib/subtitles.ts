import { formatClock, formatSrtTime, formatVttTime } from "./format";
import { speakerDisplayName } from "./speakers";
import type {
  ExportFormat,
  SpeakerNames,
  TranscriptResult,
  TranscriptSegment,
  TranscriptWord,
} from "./types";

export interface Caption {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface CaptionOptions {
  /** Maximum characters per caption before splitting on word boundaries. */
  maxChars?: number;
  /** Maximum caption duration in milliseconds. */
  maxDurationMs?: number;
}

const DEFAULT_OPTIONS: Required<CaptionOptions> = {
  maxChars: 84,
  maxDurationMs: 7000,
};

/**
 * Splits long utterances into caption-sized chunks using word-level timings so
 * that each caption stays readable and in sync with the audio.
 */
export function buildCaptions(
  segments: TranscriptSegment[],
  options: CaptionOptions = {},
): Caption[] {
  const { maxChars, maxDurationMs } = { ...DEFAULT_OPTIONS, ...options };
  const captions: Caption[] = [];

  for (const segment of segments) {
    if (segment.words.length === 0) {
      captions.push({
        speaker: segment.speaker,
        start: segment.start,
        end: segment.end,
        text: segment.text,
      });
      continue;
    }

    let current: TranscriptWord[] = [];
    const flush = () => {
      if (current.length === 0) return;
      captions.push({
        speaker: segment.speaker,
        start: current[0].start,
        end: current[current.length - 1].end,
        text: current.map((w) => w.text).join(" "),
      });
      current = [];
    };

    for (const word of segment.words) {
      const nextLength =
        current.reduce((sum, w) => sum + w.text.length + 1, 0) +
        word.text.length;
      const nextDuration =
        current.length > 0 ? word.end - current[0].start : 0;
      const endsSentence = /[.!?。！？]$/.test(
        current[current.length - 1]?.text ?? "",
      );

      if (
        current.length > 0 &&
        (nextLength > maxChars || nextDuration > maxDurationMs || endsSentence)
      ) {
        flush();
      }
      current.push(word);
    }
    flush();
  }

  return captions;
}

export function toSrt(result: TranscriptResult, names: SpeakerNames): string {
  const captions = buildCaptions(result.segments);
  const multiSpeaker = result.speakers.length > 1;
  return (
    captions
      .map((caption, index) => {
        const prefix = multiSpeaker
          ? `${speakerDisplayName(caption.speaker, names)}: `
          : "";
        return [
          String(index + 1),
          `${formatSrtTime(caption.start)} --> ${formatSrtTime(caption.end)}`,
          `${prefix}${caption.text}`,
        ].join("\n");
      })
      .join("\n\n") + "\n"
  );
}

export function toVtt(result: TranscriptResult, names: SpeakerNames): string {
  const captions = buildCaptions(result.segments);
  const multiSpeaker = result.speakers.length > 1;
  const cues = captions.map((caption, index) => {
    const voice = multiSpeaker
      ? `<v ${speakerDisplayName(caption.speaker, names)}>`
      : "";
    return [
      String(index + 1),
      `${formatVttTime(caption.start)} --> ${formatVttTime(caption.end)}`,
      `${voice}${caption.text}`,
    ].join("\n");
  });
  const header = result.languageCode
    ? `WEBVTT\nLanguage: ${result.languageCode.replace("_", "-")}`
    : "WEBVTT";
  return [header, ...cues].join("\n\n") + "\n";
}

export function toTxt(result: TranscriptResult, names: SpeakerNames): string {
  return (
    result.segments
      .map(
        (segment) =>
          `[${formatClock(segment.start)}] ${speakerDisplayName(segment.speaker, names)}: ${segment.text}`,
      )
      .join("\n\n") + "\n"
  );
}

export function exportTranscript(
  format: ExportFormat,
  result: TranscriptResult,
  names: SpeakerNames,
): { content: string; mimeType: string; extension: string } {
  switch (format) {
    case "srt":
      return {
        content: toSrt(result, names),
        mimeType: "application/x-subrip",
        extension: "srt",
      };
    case "vtt":
      return {
        content: toVtt(result, names),
        mimeType: "text/vtt",
        extension: "vtt",
      };
    case "txt":
      return {
        content: toTxt(result, names),
        mimeType: "text/plain",
        extension: "txt",
      };
  }
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
