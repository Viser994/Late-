import { AssemblyAI } from "assemblyai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "Missing ASSEMBLYAI_API_KEY. Add it to your environment before transcribing.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json(
        { error: "No audio or video file was provided." },
        { status: 400 },
      );
    }

    const client = new AssemblyAI({ apiKey });
    const transcript = await client.transcripts.transcribe({
      audio: Buffer.from(await file.arrayBuffer()),
      speaker_labels: true,
      language_detection: true,
    });

    if (transcript.status === "error") {
      return Response.json(
        { error: transcript.error ?? "Transcription failed." },
        { status: 500 },
      );
    }

    return Response.json({
      id: transcript.id,
      text: transcript.text ?? "",
      language: transcript.language_code ?? "unknown",
      durationSeconds: transcript.audio_duration
        ? Math.round(transcript.audio_duration / 1000)
        : 0,
      utterances: (transcript.utterances ?? []).map((utterance) => ({
        speaker: utterance.speaker ?? "Speaker",
        text: utterance.text,
        start: utterance.start,
        end: utterance.end,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
