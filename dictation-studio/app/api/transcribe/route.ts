import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";
import type { TranscriptResult, Utterance } from "@/lib/types";

// This route uses the AssemblyAI Node SDK and reads the secret API key, so it
// must stay server-side. (Node.js is the default runtime for route handlers.)
// Transcription polls until the job completes; allow long-running requests.
export const maxDuration = 300;

const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "mp4", "webm"]);
const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB practical upload cap

/** Lets the UI show whether a real API key is configured (never the key itself). */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ASSEMBLYAI_API_KEY) });
}

interface AssemblyWord {
  text: string;
  start: number;
  end: number;
  speaker?: string | null;
}

/**
 * AssemblyAI only returns `utterances` when diarization finds speech turns.
 * If they're missing, rebuild turns from words (grouping on speaker change
 * or a long pause) so the UI always has clickable, timestamped cards.
 */
function fallbackUtterances(
  words: AssemblyWord[] | null | undefined,
  text: string | null | undefined,
  durationSeconds: number | null | undefined,
): Utterance[] {
  if (!words?.length) {
    return text
      ? [{ speaker: "A", text, start: 0, end: durationSeconds ?? 0 }]
      : [];
  }
  const turns: Utterance[] = [];
  let current: Utterance | null = null;
  for (const word of words) {
    const start = word.start / 1000;
    const end = word.end / 1000;
    const speaker = word.speaker ?? "A";
    const gap = current ? start - current.end : 0;
    if (!current || current.speaker !== speaker || gap > 2.5) {
      if (current) turns.push(current);
      current = { speaker, text: word.text, start, end };
    } else {
      current.text = `${current.text} ${word.text}`.trim();
      current.end = end;
    }
  }
  if (current) turns.push(current);
  return turns;
}

export async function POST(request: Request) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ASSEMBLYAI_API_KEY is not configured on the server. Add it to .env.local and restart, or use “Load demo transcript” to explore the studio.",
        code: "MISSING_API_KEY",
      },
      { status: 501 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload with a `file` field." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No audio file was provided in the `file` field." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      {
        error: `Unsupported file type “.${extension}”. Please use .mp3, .wav, .m4a, .mp4 or .webm.`,
      },
      { status: 415 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is larger than the 200 MB upload limit." },
      { status: 413 },
    );
  }

  const speakersRaw = Number(formData.get("speakersExpected"));
  const speakersExpected =
    Number.isInteger(speakersRaw) && speakersRaw >= 1 && speakersRaw <= 10
      ? speakersRaw
      : undefined;

  try {
    const client = new AssemblyAI({ apiKey });
    const audio = Buffer.from(await file.arrayBuffer());

    const transcript = await client.transcripts.transcribe({
      audio,
      // Isolate and label each speaker (Speaker A, B, C…) turn-by-turn.
      speaker_labels: true,
      // Detect the spoken language automatically — no language picker needed.
      language_detection: true,
      punctuate: true,
      format_text: true,
      ...(speakersExpected ? { speakers_expected: speakersExpected } : {}),
    });

    if (transcript.status === "error") {
      return NextResponse.json(
        { error: transcript.error ?? "AssemblyAI could not transcribe this file." },
        { status: 502 },
      );
    }

    const utterances: Utterance[] =
      transcript.utterances?.length
        ? transcript.utterances.map((u) => ({
            speaker: u.speaker,
            text: u.text,
            start: u.start / 1000, // AssemblyAI timestamps are milliseconds
            end: u.end / 1000,
            confidence: u.confidence,
          }))
        : fallbackUtterances(
            transcript.words as AssemblyWord[] | null,
            transcript.text,
            transcript.audio_duration,
          );

    const result: TranscriptResult = {
      id: transcript.id,
      text: transcript.text ?? utterances.map((u) => u.text).join(" "),
      language: transcript.language_code ?? null,
      languageConfidence: transcript.language_confidence ?? null,
      audioDuration: transcript.audio_duration ?? null,
      utterances,
      source: "assemblyai",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("AssemblyAI transcription failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Transcription failed: ${error.message}`
            : "Transcription failed unexpectedly. Please try again.",
      },
      { status: 500 },
    );
  }
}
