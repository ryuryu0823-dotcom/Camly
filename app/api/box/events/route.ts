/**
 * POST /api/box/events
 *
 * Box→Backend のイベント受信(§12.4)。通信断中はBox側でqueueし再送する前提のため、
 * サーバーは重複(event_id)と順序逆転(sequence_number)に耐える必要がある。
 *
 * 認証: 実機OEMのデバイス認証方式(デバイス証明書 / APIキー等)は未選定(LAUNCH_BLOCKERS.md参照)。
 * このルートは現状、Box個体の認証を行っていない。Phase B実機接続前に必ず認証を追加すること。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface BoxEventBody {
  boxId: string;
  compartmentId?: string;
  eventType:
    | "HEARTBEAT"
    | "DOOR_OPENED"
    | "DOOR_CLOSED"
    | "LOCK_STATE_CHANGED"
    | "CHARGER_CONNECTED"
    | "CHARGING_STARTED"
    | "CHARGING_STOPPED"
    | "TAMPER_DETECTED"
    | "TEMPERATURE_ALERT"
    | "COMMAND_RESULT"
    | "POWER_RESTORED";
  eventId: string;
  deviceTimestamp: string; // ISO8601
  firmwareVersion?: string;
  sequenceNumber: number;
  payload?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BoxEventBody;
  if (!body.boxId || !body.eventId || body.sequenceNumber == null) {
    return NextResponse.json({ error: "boxId, eventId, sequenceNumber are required" }, { status: 400 });
  }

  // 重複排除: eventIdはDBのUNIQUE制約で保護されている。既存なら重複としてAck。
  const existing = await prisma.boxEvent.findUnique({ where: { eventId: body.eventId } });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.boxEvent.create({
    data: {
      boxId: body.boxId,
      compartmentId: body.compartmentId,
      eventType: body.eventType,
      eventId: body.eventId,
      deviceTimestamp: new Date(body.deviceTimestamp),
      firmwareVersion: body.firmwareVersion,
      sequenceNumber: body.sequenceNumber,
      payload: body.payload as any,
    },
  });

  // 順序逆転耐性: このBoxで現在記録されている最大sequenceNumberより新しい場合のみ、
  // Compartment/Boxの派生状態を更新する(古いイベントで状態を巻き戻さない。simulator-provider.tsと同じ方針)。
  const latest = await prisma.boxEvent.findFirst({
    where: { boxId: body.boxId },
    orderBy: { sequenceNumber: "desc" },
    take: 1,
  });
  const isNewest = !latest || latest.sequenceNumber === body.sequenceNumber; // 今回createした行が最大なら適用

  if (isNewest) {
    if (body.eventType === "HEARTBEAT" || body.eventType === "POWER_RESTORED") {
      await prisma.box.update({ where: { id: body.boxId }, data: { lastHeartbeatAt: body.deviceTimestamp ? new Date(body.deviceTimestamp) : new Date() } });
    }
    if (body.compartmentId && (body.eventType === "DOOR_OPENED" || body.eventType === "DOOR_CLOSED")) {
      // Compartment.statusそのものは貸出状態(Rental)が主導するため、扉状態は別途BoxEventの最新値から
      // 管理画面が参照する設計とし、ここではCompartmentテーブルへの直接書き込みは行わない
      // (二重の真実の源(source of truth)を作らないため)。
    }
  }

  return NextResponse.json({ received: true, appliedToState: isNewest });
}
