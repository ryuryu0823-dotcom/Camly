/**
 * POST /api/media/presign
 *
 * 返却動画・写真のアップロード用に、S3互換ストレージへの署名付きPUT URLを発行する(§17)。
 * クライアントはこのURLへ直接PUTし、返却申請APIには返ってきたstorageKeyだけを渡す。
 */
import { NextRequest, NextResponse } from "next/server";
import { createPresignedPutUrl } from "@/lib/storage/s3-presign";
import { randomBytes } from "node:crypto";

interface PresignBody {
  rentalToken: string;
  kind: "RETURN_VIDEO" | "RETURN_PHOTO";
  contentType: string;
  stepKey?: string; // 返却ステップ撮影(src/lib/return-steps.ts)の場合、どのステップの動画か
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function extensionFor(contentType: string, kind: PresignBody["kind"]): string {
  return EXTENSION_BY_MIME_TYPE[contentType] ?? (kind === "RETURN_VIDEO" ? "webm" : "jpg");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PresignBody;
  if (!body.rentalToken || !body.kind) {
    return NextResponse.json({ error: "rentalToken and kind are required" }, { status: 400 });
  }

  const endpoint = process.env.MEDIA_STORAGE_ENDPOINT;
  const bucket = process.env.MEDIA_STORAGE_BUCKET;
  const accessKeyId = process.env.MEDIA_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_STORAGE_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "media storage is not configured (see .env.example)" }, { status: 500 });
  }

  const ext = extensionFor(body.contentType, body.kind);
  const namePart = body.stepKey ? `${body.kind.toLowerCase()}-${body.stepKey}` : body.kind.toLowerCase();
  const objectKey = `rentals/${body.rentalToken}/${namePart}-${randomBytes(6).toString("hex")}.${ext}`;

  const uploadUrl = createPresignedPutUrl(
    { endpoint, bucket, region: process.env.MEDIA_STORAGE_REGION ?? "auto", accessKeyId, secretAccessKey },
    objectKey,
    900 // 15分。短寿命署名URL(§17)
  );

  return NextResponse.json({ uploadUrl, storageKey: objectKey });
}
