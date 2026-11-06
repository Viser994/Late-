import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ASSEMBLYAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let buffer: Buffer;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file in form field \"file\"." }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Could not read uploaded file." }, { status: 400 });
  }

  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }

  const client = new AssemblyAI({ apiKey });

  try {
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      speaker_labels: true,
      language_detection: true,
    });

    if (transcript.status === "error") {
      return NextResponse.json(
        { error: transcript.error || "Transcription failed." },
        { status: 422 }
      );
    }

    const utterances = (transcript.utterances ?? []).map((u) => ({
      start: u.start,
      end: u.end,
      speaker: u.speaker,
      text: u.text.trim(),
    }));

    return NextResponse.json({
      id: transcript.id,
      text: transcript.text ?? "",
      utterances,
      language_code: transcript.language_code,
      language_codes: transcript.language_codes,
      language_confidence: transcript.language_confidence,
      duration: transcript.audio_duration ?? null,
    });
  } catch (err) {
    console.error("[transcribe]", err);
    const message = err instanceof Error ? err.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
