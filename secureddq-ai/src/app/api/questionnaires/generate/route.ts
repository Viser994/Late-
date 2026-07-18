import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { enqueueJob } from "@/lib/jobs/processor";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("answers:generate");
    const { questionnaireId } = await request.json();

    if (!questionnaireId) {
      return NextResponse.json({ error: "Missing questionnaireId" }, { status: 400 });
    }

    await enqueueJob({
      organizationId: ctx.organizationId,
      type: "GENERATE_ANSWERS",
      payload: {
        questionnaireId,
        organizationId: ctx.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
