import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env, requireEnv } from "@/lib/env";

export function getS3Client() {
  return new S3Client({
    region: requireEnv("S3_REGION"),
    credentials:
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY
          }
        : undefined
  });
}

export async function createSignedUploadUrl(input: {
  key: string;
  contentType: string;
  checksum?: string;
}) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: requireEnv("S3_BUCKET"),
    Key: input.key,
    ContentType: input.contentType,
    ChecksumSHA256: input.checksum,
    ServerSideEncryption: "aws:kms"
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
}
