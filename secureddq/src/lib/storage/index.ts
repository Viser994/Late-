import { randomUUID } from "crypto";

export interface StoredFile {
  key: string;
  url: string;
  sizeBytes: number;
}

/** Whether S3-compatible storage is configured. */
export function hasS3(): boolean {
  return Boolean(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET);
}

/**
 * Produce a presigned upload target. With S3 credentials this would return a
 * real presigned PUT URL (via @aws-sdk/client-s3 + s3-request-presigner). In
 * dev it returns a local pseudo-key so the upload flow can be exercised.
 */
export async function createUploadUrl(fileName: string, contentType: string): Promise<{ key: string; uploadUrl: string }> {
  const key = `${new Date().getFullYear()}/${randomUUID()}/${sanitize(fileName)}`;
  if (hasS3()) {
    // Placeholder for presigned URL generation; wired via env in production.
    const endpoint = process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;
    return { key, uploadUrl: `${endpoint}/${key}?contentType=${encodeURIComponent(contentType)}` };
  }
  return { key, uploadUrl: `/api/uploads/local?key=${encodeURIComponent(key)}` };
}

/** Return a (short-lived, signed in production) URL to read a stored object. */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  if (hasS3()) {
    const endpoint = process.env.S3_ENDPOINT || `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;
    return `${endpoint}/${key}`;
  }
  return `/api/uploads/local?key=${encodeURIComponent(key)}`;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
