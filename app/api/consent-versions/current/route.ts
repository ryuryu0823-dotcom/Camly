/**
 * GET /api/consent-versions/current
 *
 * terms/care/privacyそれぞれの現在有効なConsentVersion.idを返す。
 * 貸出フロー(§6 step5)で、利用者が同意した規約のversionを固定するために使う。
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const KINDS = ["terms", "care", "privacy"] as const;

export async function GET() {
  const results = await Promise.all(
    KINDS.map((kind) => prisma.consentVersion.findFirst({ where: { kind }, orderBy: { createdAt: "desc" } }))
  );

  const missing = KINDS.filter((_, i) => !results[i]);
  if (missing.length > 0) {
    return NextResponse.json({ error: `missing ConsentVersion for: ${missing.join(", ")}` }, { status: 500 });
  }

  return NextResponse.json({
    consentVersionIds: results.map((r) => r!.id),
    details: results.map((r) => ({ kind: r!.kind, version: r!.version, bodyUrl: r!.bodyUrl })),
  });
}
