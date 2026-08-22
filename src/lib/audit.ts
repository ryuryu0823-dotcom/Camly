import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

/**
 * すべての決済操作・状態遷移・管理者操作の監査ログ記録(§13, §15, §17)。
 * 呼び出し側は必ずこの関数を通してAuditLogに残す。
 *
 * $transaction(async (tx) => {...}) の中から呼ぶ場合は、第2引数に必ず tx を渡すこと。
 * 省略するとグローバルなprismaクライアント(別コネクション)で実行され、
 * まだコミットされていない行(例: 直前にtx内でcreateしたrental)を参照する外部キー制約違反になる。
 */
export async function writeAuditLog(
  params: {
    actorType: "admin" | "system" | "customer" | "box";
    actorId?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    reasonText?: string;
    metadata?: Record<string, unknown>;
  },
  client: PrismaClientOrTx = prisma
) {
  await client.auditLog.create({
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

export async function writeRentalEvent(
  params: {
    rentalId: string;
    fromStatus?: string | null;
    toStatus: string;
    actor: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
  client: PrismaClientOrTx = prisma
) {
  await client.rentalEvent.create({
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

/**
 * 業務トランザクションが既にコミット済み(=状態変更は確定済み)の後で呼ぶための版。
 * 監査ログ書き込みの失敗を握りつぶし、確定済みの業務処理をAPIエラーとして
 * 呼び出し元に誤って返してしまわないようにする(失敗はconsole.errorにのみ出力)。
 *
 * トランザクション内(まだコミット前)から呼ぶ場合は使わないこと。その場合は
 * writeAuditLog(params, tx)を使い、失敗したら$transaction全体をロールバックさせる。
 */
export async function writeAuditLogBestEffort(...args: Parameters<typeof writeAuditLog>) {
  try {
    await writeAuditLog(...args);
  } catch (err) {
    console.error("writeAuditLog failed after commit (non-fatal, audit trail incomplete)", args[0], err);
  }
}

export async function writeRentalEventBestEffort(...args: Parameters<typeof writeRentalEvent>) {
  try {
    await writeRentalEvent(...args);
  } catch (err) {
    console.error("writeRentalEvent failed after commit (non-fatal, audit trail incomplete)", args[0], err);
  }
}
