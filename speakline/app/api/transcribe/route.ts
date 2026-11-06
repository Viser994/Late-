import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";
import { requireIdentity } from "../../../cursor/identity";
import { buildCues } from "@/lib/cues";
import { isAllowedMedia, MAX_UPLOAD_BYTES, uploadTooLarge } from "@/lib/media";
import { createRateLimiter } from "@/lib/rate-limit";
import type { TranscriptResult, UtteranceLike, WordLike } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const allowRequest = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 });

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "local";
}

function publicError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Transcription failed.";
  if (/api[_ -]?key|authorization|bearer|secret/i.test(message)) {
    return "The transcription service rejected the request.";
  }
  const cleaned = message.replace(/[A-Za-z0-9_\-]{24,}/g, "[redacted]").slice(0, 300);
  return cleaned || "Transcription failed.";
}

function asWords(words: unknown): WordLike[] {
  if (!Array.isArray(words)) return [];
  return words.flatMap((word) => {
    if (!word || typeof word !== "object") return [];
    const record = word as Record<string, unknown>;
    if (typeof record.text !== "string" || typeof record.start !== "number" || typeof record.end !== "number") {
      return [];
    }
    return [
      {
        text: record.text,
        start: record.start,
        end: record.end,
        speaker: typeof record.speaker === "string" ? record.speaker : null,
        confidence: typeof record.confidence === "number" ? record.confidence : null,
      },
    ];
  });
}

function asUtterances(utterances: unknown): UtteranceLike[] {
  if (!Array.isArray(utterances)) return [];
  return utterances.flatMap((utterance) => {
    if (!utterance || typeof utterance !== "object") return [];
    const record = utterance as Record<string, unknown>;
    if (typeof record.text !== "string" || typeof record.start !== "number" || typeof record.end !== "number") {
      return [];
    }
    return [
      {
        speaker: typeof record.speaker === "string" ? record.speaker : "A",
        text: record.text,
        start: record.start,
        end: record.end,
        confidence: typeof record.confidence === "number" ? record.confidence : null,
        words: asWords(record.words),
      },
    ];
  });
}

export async function GET() {
  return NextResponse.json(
    { configured: Boolean(process.env.ASSEMBLYAI_API_KEY?.trim()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many transcriptions from this network. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "That file is larger than 150 MB." }, { status: 413 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live transcription is unavailable until ASSEMBLYAI_API_KEY is set on the server." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload the audio as form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an audio or video file first." }, { status: 400 });
  }
  if (!file.size) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (uploadTooLarge(file.size)) {
    return NextResponse.json({ error: "That file is larger than 150 MB." }, { status: 413 });
  }
  if (!isAllowedMedia(file)) {
    return NextResponse.json(
      { error: "Use an mp3, wav, m4a, mp4, or webm file." },
      { status: 415 },
    );
  }

  try {
    const client = new AssemblyAI({ apiKey });
    const audio = Buffer.from(await file.arrayBuffer());
    const transcript = await client.transcripts.transcribe({
      audio,
      speech_models: ["universal-3-5-pro", "universal-2"],
      speaker_labels: true,
      language_detection: true,
    });

    if (transcript.status === "error") {
      return NextResponse.json(
        { error: publicError(new Error(transcript.error || "Transcription failed.")) },
        { status: 502 },
      );
    }

    const cues = buildCues({
      text: transcript.text,
      audioDurationSec: transcript.audio_duration,
      utterances: asUtterances(transcript.utterances),
      words: asWords(transcript.words),
    });

    const body: TranscriptResult = {
      id: transcript.id,
      text: transcript.text ?? "",
      languageCode: transcript.language_code ?? null,
      languageConfidence:
        typeof transcript.language_confidence === "number" ? transcript.language_confidence : null,
      audioDuration: transcript.audio_duration ?? null,
      cues,
    };

    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("transcribe_failed", publicError(error));
    return NextResponse.json({ error: publicError(error) }, { status: 502 });
  }
}
