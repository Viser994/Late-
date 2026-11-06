import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";
import type {
  TranscribeErrorResponse,
  TranscriptResult,
  TranscriptSegment,
  TranscriptWord,
} from "@/lib/types";

// Transcription polls until AssemblyAI finishes; allow long-running requests on
// platforms that honor this (e.g. Vercel).
export const maxDuration = 300;

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg"];
const ACCEPTED_MIME_PREFIXES = ["audio/", "video/"];
const POLLING_TIMEOUT_MS = 10 * 60 * 1000;

function errorResponse(message: string, status: number) {
  return NextResponse.json<TranscribeErrorResponse>(
    { error: message },
    { status },
  );
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );
  const hasAcceptedMime = ACCEPTED_MIME_PREFIXES.some((prefix) =>
    file.type.startsWith(prefix),
  );
  return hasAcceptedExtension || hasAcceptedMime;
}

export async function POST(request: Request) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "Server is missing the ASSEMBLYAI_API_KEY environment variable.",
      500,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data with a `file` field.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("No file was uploaded.", 400);
  }
  if (file.size === 0) {
    return errorResponse("The uploaded file is empty.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse("File is too large. The maximum size is 200 MB.", 413);
  }
  if (!isAcceptedFile(file)) {
    return errorResponse(
      "Unsupported file type. Upload .mp3, .wav, .m4a, .mp4, or .webm.",
      415,
    );
  }

  const client = new AssemblyAI({ apiKey });

  try {
    const audio = Buffer.from(await file.arrayBuffer());
    const transcript = await client.transcripts.transcribe(
      {
        audio,
        speech_model: "universal",
        speaker_labels: true,
        language_detection: true,
        punctuate: true,
        format_text: true,
      },
      { pollingInterval: 2000, pollingTimeout: POLLING_TIMEOUT_MS },
    );

    if (transcript.status === "error") {
      return errorResponse(
        transcript.error ?? "AssemblyAI failed to transcribe this file.",
        502,
      );
    }

    const words: TranscriptWord[] = (transcript.words ?? []).map((w) => ({
      text: w.text,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
      speaker: w.speaker ?? null,
    }));

    let segments: TranscriptSegment[];
    if (transcript.utterances && transcript.utterances.length > 0) {
      segments = transcript.utterances.map((u, index) => ({
        id: `${transcript.id}-${index}`,
        speaker: u.speaker,
        start: u.start,
        end: u.end,
        text: u.text,
        confidence: u.confidence,
        words: u.words.map((w) => ({
          text: w.text,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
          speaker: w.speaker ?? u.speaker,
        })),
      }));
    } else if (words.length > 0) {
      segments = [
        {
          id: `${transcript.id}-0`,
          speaker: "A",
          start: words[0].start,
          end: words[words.length - 1].end,
          text: transcript.text ?? words.map((w) => w.text).join(" "),
          confidence: transcript.confidence ?? 0,
          words,
        },
      ];
    } else {
      segments = [];
    }

    const speakers = Array.from(new Set(segments.map((s) => s.speaker))).sort();

    const result: TranscriptResult = {
      id: transcript.id,
      text: transcript.text ?? "",
      languageCode: transcript.language_code ?? null,
      languageConfidence: transcript.language_confidence ?? null,
      audioDuration: transcript.audio_duration ?? null,
      segments,
      speakers,
    };

    return NextResponse.json<TranscriptResult>(result);
  } catch (error) {
    console.error("[api/transcribe]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while contacting AssemblyAI.";
    return errorResponse(message, 502);
  }
}
