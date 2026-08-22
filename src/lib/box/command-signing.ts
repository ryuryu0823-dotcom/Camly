/**
 * Box command signing
 *
 * Master Handoff v2 §12.3, §17 準拠。
 * - unlock等のcommandは一回限り、短寿命、署名付き。
 * - 期限切れ・重複・replayを拒否する。
 * - HMAC-SHA256を使用(Box側は共有鍵を持つ前提。OEM adapterでは鍵交換方式を別途定義する)。
 *
 * node:crypto のみに依存。npmパッケージ不要。
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export interface BoxCommandPayload {
  commandId: string;
  boxId: string;
  compartmentId: string | null;
  type: "UNLOCK" | "LOCK" | "STATUS_REQUEST" | "REBOOT" | "OTA_UPDATE";
  nonce: string;
  expiresAt: string; // ISO8601
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

function canonicalize(payload: BoxCommandPayload): string {
  // キー順を固定した単純なJSON直列化。実装をまたいで再現可能にする。
  return JSON.stringify({
    commandId: payload.commandId,
    boxId: payload.boxId,
    compartmentId: payload.compartmentId,
    type: payload.type,
    nonce: payload.nonce,
    expiresAt: payload.expiresAt,
  });
}

export function signCommand(payload: BoxCommandPayload, secret: string): string {
  return createHmac("sha256", secret).update(canonicalize(payload)).digest("hex");
}

export function verifyCommandSignature(
  payload: BoxCommandPayload,
  signature: string,
  secret: string
): boolean {
  const expected = signCommand(payload, secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export class BoxCommandRejectedError extends Error {}

/**
 * Box側(またはSimulator)が受信したcommandを検証する。
 * - 署名不一致 → 拒否
 * - 期限切れ → 拒否
 * - nonce再利用(seenNonces) → replayとして拒否
 *
 * seenNoncesは呼び出し側がDB(box_commands.nonce UNIQUE)等で管理する前提。
 * ここでは検証ロジックのみを純粋関数として提供する。
 */
export function verifyIncomingCommand(
  payload: BoxCommandPayload,
  signature: string,
  secret: string,
  now: Date,
  seenNonces: ReadonlySet<string>
): { ok: true } | { ok: false; reason: string } {
  if (!verifyCommandSignature(payload, signature, secret)) {
    return { ok: false, reason: "invalid_signature" };
  }
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  if (seenNonces.has(payload.nonce)) {
    return { ok: false, reason: "replay_detected" };
  }
  return { ok: true };
}
