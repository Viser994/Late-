import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSignedUploadUrl } from "@/lib/storage";

const requestSchema = z.object({
  organizationId: z.string(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  checksum: z.string().optional()
});

export async function POST(request: Request) {
  const input = requestSchema.parse(await request.json());
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${input.organizationId}/evidence/${crypto.randomUUID()}-${safeFileName}`;
  const uploadUrl = await createSignedUploadUrl({
    key,
    contentType: input.contentType,
    checksum: input.checksum
  });

  return NextResponse.json({
    key,
    uploadUrl,
    expiresIn: 900
  });
}
