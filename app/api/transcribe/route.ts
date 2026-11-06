import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supportedTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/webm",
  "video/mp4",
  "video/webm",
]);

type CaptionUtterance = {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
  confidence: number | null;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing ASSEMBLYAI_API_KEY. Add it to your environment before transcribing.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const media = formData.get("media");

  if (!(media instanceof File)) {
    return NextResponse.json(
      { error: "Upload an audio or video file under the `media` field." },
      { status: 400 },
    );
  }

  if (media.size === 0) {
    return NextResponse.json(
      { error: "The uploaded media file is empty." },
      { status: 400 },
    );
  }

  if (media.type && !supportedTypes.has(media.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload .mp3, .wav, .m4a, .mp4, or .webm media.",
      },
      { status: 415 },
    );
  }

  try {
    const client = new AssemblyAI({ apiKey });
    const audio = await media.arrayBuffer();
    const transcript = await client.transcripts.transcribe(
      {
        audio,
        speaker_labels: true,
        language_detection: true,
      },
      {
        pollingInterval: 3000,
        pollingTimeout: 10 * 60 * 1000,
      },
    );

    if (transcript.status === "error") {
      return NextResponse.json(
        { error: transcript.error ?? "AssemblyAI could not transcribe the media." },
        { status: 502 },
      );
    }

    const utterances: CaptionUtterance[] =
      transcript.utterances?.map((utterance, index) => ({
        id: `${transcript.id}-${index}`,
        speaker: utterance.speaker ? `Speaker ${utterance.speaker}` : "Speaker",
        start: utterance.start,
        end: utterance.end,
        text: utterance.text,
        confidence: utterance.confidence ?? null,
      })) ?? [];

    return NextResponse.json({
      id: transcript.id,
      languageCode: transcript.language_code ?? "auto",
      languageConfidence: transcript.language_confidence ?? null,
      duration: transcript.audio_duration ?? null,
      text: transcript.text ?? "",
      utterances,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected transcription failure.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
