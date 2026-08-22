/**
 * S3互換オブジェクトストレージ向けの署名付きPUT URL生成(AWS Signature V4)。
 *
 * Master Handoff v2 §5, §17準拠: 「S3互換オブジェクトストレージ(動画・写真)」「メディアはprivate、短寿命署名URL」。
 * npm SDK(aws-sdk / @aws-sdk/client-s3)に依存せず、node:crypto のみでSigV4を実装する。
 * AWS S3, Cloudflare R2, Backblaze B2, MinIO等、SigV4互換のS3互換ストレージで動作する。
 *
 * クライアントはこの署名付きURLへ直接PUTでアップロードする(サーバーを経由させない。
 * サーバー負荷を避け、動画のような大きめのファイルでもタイムアウトしにくくする)。
 */
import { createHash, createHmac } from "node:crypto";

export interface S3Config {
  endpoint: string; // 例: https://<account>.r2.cloudflarestorage.com
  bucket: string;
  region: string; // R2等では "auto" でよい場合がある
  accessKeyId: string;
  secretAccessKey: string;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function toAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const amzDate = iso; // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8); // YYYYMMDD
  return { amzDate, dateStamp };
}

/** PUT/GET共通のSigV4署名付きURL生成。expiresInSeconds はAWSの仕様上、最大7日(604800秒)。 */
function createPresignedUrl(
  method: "PUT" | "GET",
  config: S3Config,
  objectKey: string,
  expiresInSeconds: number,
  now: Date = new Date()
): string {
  const { amzDate, dateStamp } = toAmzDate(now);
  const host = new URL(config.endpoint).host;
  const service = "s3";
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const credential = `${config.accessKeyId}/${credentialScope}`;

  const canonicalUri = `/${config.bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;

  const queryParams: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  queryParams.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const canonicalQuerystring = queryParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD"; // ブラウザからの直接PUT/GETのため、事前にボディハッシュ計算しない

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  return `${config.endpoint}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
}

/** 指定オブジェクトキーへの署名付きPUT URLを生成する(アップロード用)。 */
export function createPresignedPutUrl(
  config: S3Config,
  objectKey: string,
  expiresInSeconds: number,
  now: Date = new Date()
): string {
  return createPresignedUrl("PUT", config, objectKey, expiresInSeconds, now);
}

/** 指定オブジェクトキーへの署名付きGET URLを生成する(管理画面での動画・写真再生用)。 */
export function createPresignedGetUrl(
  config: S3Config,
  objectKey: string,
  expiresInSeconds: number,
  now: Date = new Date()
): string {
  return createPresignedUrl("GET", config, objectKey, expiresInSeconds, now);
}
