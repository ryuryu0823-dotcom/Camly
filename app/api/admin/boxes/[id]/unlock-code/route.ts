/**
 * POST /api/admin/boxes/:id/unlock-code
 *
 * 管理者が物理キーボックスの暗証番号を更新する(§17)。
 * 監査で判明した既存実装の問題(全利用者へ固定の"2580"を表示)への是正として
 * currentPhysicalUnlockCodeカラムは用意されていたが、それを設定する手段がこれまで無かった。
 * 定期的なローテーションは運用側の責務(LAUNCH_BLOCKERS.md参照)。
 *
 * 認証: 他のadmin系routeと同様、このMVPではadminUserIdをボディで受け取る簡易実装。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAuditLogBestEffort } from "@/lib/audit";

interface UpdateUnlockCodeBody {
  adminUserId: string;
  code: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as UpdateUnlockCodeBody;
  if (!body.adminUserId) {
    return NextResponse.json({ error: "adminUserId is required (audit trail)" }, { status: 400 });
  }
  if (!body.code || !/^[0-9]{4,8}$/.test(body.code)) {
    return NextResponse.json({ error: "code must be a 4-8 digit number" }, { status: 400 });
  }

  const box = await prisma.box.findUnique({ where: { id: params.id } });
  if (!box) return NextResponse.json({ error: "box not found" }, { status: 404 });

  await prisma.box.update({
    where: { id: box.id },
    data: { currentPhysicalUnlockCode: body.code, unlockCodeUpdatedAt: new Date() },
  });

  await writeAuditLogBestEffort({
    actorType: "admin",
    actorId: body.adminUserId,
    action: "box.unlock_code_update",
    targetType: "box",
    targetId: box.id,
  });

  return NextResponse.json({ status: "ok" });
}
