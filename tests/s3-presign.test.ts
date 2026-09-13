import { test } from "node:test";
import assert from "node:assert/strict";
import { createPresignedPutUrl, S3Config } from "../src/lib/storage/s3-presign";

const config: S3Config = {
  endpoint: "https://example.r2.cloudflarestorage.com",
  bucket: "camly-media",
  region: "auto",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secretExampleKey",
};

const fixedDate = new Date("2026-08-20T12:00:00Z");

test("生成されたURLに必要なSigV4クエリパラメータが含まれる", () => {
  const url = createPresignedPutUrl(config, "rentals/abc/return-video.mp4", 900, fixedDate);
  assert.match(url, /X-Amz-Algorithm=AWS4-HMAC-SHA256/);
  assert.match(url, /X-Amz-Credential=AKIAEXAMPLE/);
  assert.match(url, /X-Amz-Date=20260820T120000Z/);
  assert.match(url, /X-Amz-Expires=900/);
  assert.match(url, /X-Amz-SignedHeaders=host/);
  assert.match(url, /X-Amz-Signature=[0-9a-f]{64}/);
});

test("バケット名とオブジェクトキーがパスに正しく反映される", () => {
  const url = createPresignedPutUrl(config, "rentals/abc/return-video.mp4", 900, fixedDate);
  assert.ok(url.startsWith("https://example.r2.cloudflarestorage.com/camly-media/rentals/abc/return-video.mp4?"));
});

test("同一入力なら署名は決定論的(再現可能)", () => {
  const url1 = createPresignedPutUrl(config, "x/y.jpg", 300, fixedDate);
  const url2 = createPresignedPutUrl(config, "x/y.jpg", 300, fixedDate);
  assert.equal(url1, url2);
});

test("秘密鍵が異なれば署名も変わる", () => {
  const url1 = createPresignedPutUrl(config, "x/y.jpg", 300, fixedDate);
  const url2 = createPresignedPutUrl({ ...config, secretAccessKey: "different" }, "x/y.jpg", 300, fixedDate);
  assert.notEqual(url1, url2);
});

test("オブジェクトキーに含まれる特殊文字はエンコードされる", () => {
  const url = createPresignedPutUrl(config, "rentals/a b/c.jpg", 300, fixedDate);
  assert.ok(url.includes("rentals/a%20b/c.jpg"));
});
