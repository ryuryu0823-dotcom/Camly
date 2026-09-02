import { randomBytes } from "node:crypto";

/** QR/URLに使う推測困難なpublicID/tokenを生成する(§4)。 */
export function generatePublicId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("base64url")}`;
}

export function generateRentalToken(): string {
  return randomBytes(20).toString("base64url");
}

export function generateIdempotencyKey(scope: string, id: string): string {
  return `camly-${scope}-${id}`;
}
