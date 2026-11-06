import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "mp4", "webm"]);

export async function POST(request: Request) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Transcription is not configured. Add ASSEMBLYAI_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An audio or video file is required." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use MP3, WAV, M4A, MP4, or WEBM." },
        { status: 415 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: file.size === 0 ? "The selected file is empty." : "The selected file exceeds 500 MB." },
        { status: 413 },
      );
    }

    const client = new AssemblyAI({ apiKey });
    const transcript = await client.transcripts.transcribe({
      audio: file,
      speaker_labels: true,
      language_detection: true,
      format_text: true,
    });

    if (transcript.status === "error") {
      console.error("AssemblyAI transcription failed:", transcript.error);
      return NextResponse.json(
        { error: transcript.error || "AssemblyAI could not transcribe this file." },
        { status: 502 },
      );
    }

    const segments =
      transcript.utterances?.map((utterance, index) => ({
        id: `${transcript.id}-${index}`,
        speaker: `Speaker ${utterance.speaker || "A"}`,
        start: utterance.start / 1000,
        end: utterance.end / 1000,
        text: utterance.text,
      })) ?? [];

    if (!segments.length && transcript.text) {
      segments.push({
        id: `${transcript.id}-0`,
        speaker: "Speaker A",
        start: 0,
        end: transcript.audio_duration ?? 0,
        text: transcript.text,
      });
    }

    return NextResponse.json({
      id: transcript.id,
      language: transcript.language_code ?? null,
      duration: transcript.audio_duration ?? null,
      segments,
      text: transcript.text ?? "",
    });
  } catch (error) {
    console.error("Unexpected transcription error:", error);
    return NextResponse.json(
      { error: "The transcription service could not process this file. Please try again." },
      { status: 500 },
    );
  }
}
