import { prisma } from "./db";

/**
 * すべての決済操作・状態遷移・管理者操作の監査ログ記録(§13, §15, §17)。
 * 呼び出し側は必ずこの関数を通してAuditLogに残す。
 */
export async function writeAuditLog(params: {
  actorType: "admin" | "system" | "customer" | "box";
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  reasonText?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      reasonText: params.reasonText,
      metadata: params.metadata as any,
    },
  });
}

export async function writeRentalEvent(params: {
  rentalId: string;
  fromStatus?: string | null;
  toStatus: string;
  actor: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.rentalEvent.create({
    data: {
      rentalId: params.rentalId,
      fromStatus: params.fromStatus as any,
      toStatus: params.toStatus as any,
      actor: params.actor,
      reason: params.reason,
      metadata: params.metadata as any,
    },
  });
}
