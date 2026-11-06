import { AssemblyAI } from "assemblyai";
import type { Transcript, TranscriptUtterance } from "assemblyai";
import { NextResponse } from "next/server";
import type { Segment, TranscriptResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function toSegments(transcript: Transcript): Segment[] {
  const utterances: TranscriptUtterance[] = transcript.utterances ?? [];

  if (utterances.length > 0) {
    return utterances.map((u, i) => ({
      id: i,
      speaker: u.speaker,
      start: u.start,
      end: u.end,
      text: u.text,
      words: u.words.map((w) => ({ text: w.text, start: w.start, end: w.end })),
    }));
  }

  const words = transcript.words ?? [];
  if (words.length > 0) {
    return [
      {
        id: 0,
        speaker: "A",
        start: words[0].start,
        end: words[words.length - 1].end,
        text: transcript.text ?? words.map((w) => w.text).join(" "),
        words: words.map((w) => ({ text: w.text, start: w.start, end: w.end })),
      },
    ];
  }

  return [];
}

export async function POST(request: Request) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ASSEMBLYAI_API_KEY is not set on the server. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  let file: File;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (!(entry instanceof File) || entry.size === 0) {
      return NextResponse.json({ error: "No audio file was provided." }, { status: 400 });
    }
    file = entry;
  } catch {
    return NextResponse.json({ error: "Request must be multipart/form-data with a 'file' field." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large (limit 500 MB)." }, { status: 413 });
  }

  const client = new AssemblyAI({
    apiKey,
    ...(process.env.ASSEMBLYAI_BASE_URL ? { baseUrl: process.env.ASSEMBLYAI_BASE_URL } : {}),
  });

  try {
    const audio = Buffer.from(await file.arrayBuffer());

    const transcript = await client.transcripts.transcribe({
      audio,
      speaker_labels: true,
      language_detection: true,
      punctuate: true,
      format_text: true,
    });

    if (transcript.status === "error") {
      return NextResponse.json({ error: transcript.error ?? "Transcription failed." }, { status: 502 });
    }

    const segments = toSegments(transcript);
    if (segments.length === 0) {
      return NextResponse.json({ error: "No speech was detected in this recording." }, { status: 422 });
    }

    const result: TranscriptResult = {
      id: transcript.id,
      languageCode: transcript.language_code ?? null,
      languageConfidence: transcript.language_confidence ?? null,
      duration: transcript.audio_duration ?? null,
      segments,
    };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error while transcribing.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
