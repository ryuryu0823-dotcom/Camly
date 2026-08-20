import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  verifyStripeWebhookSignature,
  WebhookVerificationError,
  isDuplicateWebhookEvent,
} from "../src/lib/stripe/webhook";

const SECRET = "whsec_test_secret";

function buildSignatureHeader(rawBody: string, secret: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${rawBody}`;
  const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

test("正当な署名は検証を通過しイベントを返す", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  const body = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded", data: { object: {} } });
  const header = buildSignatureHeader(body, SECRET, Math.floor(now.getTime() / 1000));
  const event = verifyStripeWebhookSignature(body, header, SECRET, now);
  assert.equal(event.id, "evt_1");
  assert.equal(event.type, "payment_intent.succeeded");
});

test("秘密鍵が異なると署名不一致で拒否される", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  const body = JSON.stringify({ id: "evt_2", type: "payment_intent.succeeded", data: { object: {} } });
  const header = buildSignatureHeader(body, "wrong_secret", Math.floor(now.getTime() / 1000));
  assert.throws(() => verifyStripeWebhookSignature(body, header, SECRET, now), WebhookVerificationError);
});

test("本文が改ざんされると拒否される", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  const body = JSON.stringify({ id: "evt_3", type: "payment_intent.succeeded", data: { object: { amount: 50000 } } });
  const header = buildSignatureHeader(body, SECRET, Math.floor(now.getTime() / 1000));
  const tampered = JSON.stringify({ id: "evt_3", type: "payment_intent.succeeded", data: { object: { amount: 1 } } });
  assert.throws(() => verifyStripeWebhookSignature(tampered, header, SECRET, now), WebhookVerificationError);
});

test("許容範囲を超えた古いtimestampはreplayとして拒否される", () => {
  const eventTime = new Date("2026-08-20T12:00:00Z");
  const verifyTime = new Date("2026-08-20T12:20:00Z"); // 20分後
  const body = JSON.stringify({ id: "evt_4", type: "payment_intent.succeeded", data: { object: {} } });
  const header = buildSignatureHeader(body, SECRET, Math.floor(eventTime.getTime() / 1000));
  assert.throws(
    () => verifyStripeWebhookSignature(body, header, SECRET, verifyTime, 5 * 60),
    WebhookVerificationError
  );
});

test("Stripe-Signatureヘッダが無い場合は拒否される", () => {
  const body = JSON.stringify({ id: "evt_5", type: "x", data: { object: {} } });
  assert.throws(() => verifyStripeWebhookSignature(body, null, SECRET), WebhookVerificationError);
});

test("複数のv1署名のうち1つでも一致すれば通る(Stripeのキーローテーション対応)", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  const body = JSON.stringify({ id: "evt_6", type: "payment_intent.succeeded", data: { object: {} } });
  const ts = Math.floor(now.getTime() / 1000);
  const validSig = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  const header = `t=${ts},v1=deadbeef,v1=${validSig}`;
  const event = verifyStripeWebhookSignature(body, header, SECRET, now);
  assert.equal(event.id, "evt_6");
});

test("event ID重複チェック", () => {
  const seen = new Set(["evt_100"]);
  assert.equal(isDuplicateWebhookEvent("evt_100", seen), true);
  assert.equal(isDuplicateWebhookEvent("evt_200", seen), false);
});
