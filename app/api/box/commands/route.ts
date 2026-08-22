/**
 * POST /api/box/commands
 *
 * Backend→Box のコマンド発行(§12.3)。管理画面からの手動解錠、またはPhase B貸出フローの
 * 内部処理から呼ばれる想定。呼び出し元(管理者操作の場合)はadminUserId+reasonを必須とし、
 * 監査ログに残す(§15「遠隔解錠は理由入力+管理者再認証+監査ログ」)。
 *
 * commandは一回限り・短寿命・署名付き(nonce/signature/expiresAt)。DBのBoxCommand.nonceに
 * UNIQUE制約があるため、同一nonceの重複挿入はDBレベルでも拒否される。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveBoxProvider } from "@/lib/box/simulator-singleton";
import { writeAuditLogBestEffort } from "@/lib/audit";

interface CommandBody {
  boxId: string;
  compartmentId?: string;
  type: "UNLOCK" | "LOCK" | "STATUS_REQUEST" | "REBOOT" | "OTA_UPDATE";
  ttlSeconds?: number;
  reason?: string;
  adminUserId?: string; // 管理者による手動操作の場合は必須(監査ログに残す)
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CommandBody;
  if (!body.boxId || !body.type) {
    return NextResponse.json({ error: "boxId and type are required" }, { status: 400 });
  }

  const provider = getActiveBoxProvider();
  const result = await provider.sendCommand({
    boxId: body.boxId,
    compartmentId: body.compartmentId ?? null,
    type: body.type,
    ttlSeconds: body.ttlSeconds ?? 30,
    reason: body.reason,
    issuedByAdminId: body.adminUserId,
  });

  await prisma.boxCommand.create({
    data: {
      boxId: body.boxId,
      compartmentId: body.compartmentId,
      type: body.type,
      status: result.status === "FAILED" ? "FAILED" : "SENT",
      nonce: result.nonce,
      signature: result.signature,
      expiresAt: result.expiresAt,
      issuedByAdminId: body.adminUserId,
      reason: body.reason,
      resultPayload: result.status === "FAILED" ? { error: result.error } : undefined,
      resultAt: result.status === "FAILED" ? new Date() : undefined,
    },
  });

  if (body.adminUserId) {
    await writeAuditLogBestEffort({
      actorType: "admin",
      actorId: body.adminUserId,
      action: `box.command.${body.type.toLowerCase()}`,
      targetType: "box",
      targetId: body.boxId,
      reasonText: body.reason,
      metadata: { compartmentId: body.compartmentId, commandId: result.commandId, status: result.status },
    });
  }

  return NextResponse.json(result);
}
