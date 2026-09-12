/**
 * POST /api/rentals/:token/defect
 *
 * 初期不良(貸出直後に見つかった破損・起動しない等の症状)の申請(§9, §15)。
 * 通常の返却フロー(RETURN_STEPS)とは別に、いつでも(貸出中のどのタイミングでも)
 * 症状動画1本+テキストで申請できる軽量な入口。DamageCase(既存の破損申請モデル)に
 * 積むだけで、Rental.statusは変更しない(返却自体は通常どおり別途必要)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLogBestEffort } from "@/lib/audit";

interface DefectReportBody {
  storageKey: string;
  mimeType: string;
  description: string;
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = (await req.json()) as DefectReportBody;
  if (!body.storageKey || !body.mimeType) {
    return NextResponse.json({ error: "storageKey and mimeType are required" }, { status: 400 });
  }
  if (!body.description || !body.description.trim()) {
    return NextResponse.json({ error: "症状を入力してください" }, { status: 400 });
  }

  const rental = await prisma.rental.findUnique({ where: { token: params.token } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });

  await prisma.mediaAsset.create({
    data: {
      rentalId: rental.id,
      kind: "DAMAGE_EVIDENCE",
      stepKey: "defect_report",
      storageKey: body.storageKey,
      mimeType: body.mimeType,
      retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const damageCase = await prisma.damageCase.create({
    data: {
      rentalId: rental.id,
      status: "REPORTED",
      reportedBy: "customer",
      description: `[初期不良申請]\n${body.description.trim()}`,
    },
  });

  await writeAuditLogBestEffort({
    actorType: "customer",
    action: "damage_case.defect_report",
    targetType: "damage_case",
    targetId: damageCase.id,
    metadata: { rentalId: rental.id },
  });

  return NextResponse.json({ message: "初期不良のご申請を受け付けました。内容を確認のうえご連絡します。" });
}
