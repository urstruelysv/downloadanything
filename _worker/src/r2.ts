import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  const accountId = required("R2_ACCOUNT_ID");
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export async function uploadToR2(
  key: string,
  body: Readable,
  contentType: string,
): Promise<string> {
  const bucket = required("R2_BUCKET");
  const upload = new Upload({
    client: client(),
    params: { Bucket: bucket, Key: key, Body: body, ContentType: contentType },
  });
  await upload.done();
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 3600,
  });
}
