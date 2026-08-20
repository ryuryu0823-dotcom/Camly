/**
 * POST /api/dev/box-simulator
 *
 * Box Simulatorのシナリオ注入用エンドポイント(§12.5「管理画面または開発ツールから再現する」)。
 * 本番公開前提のエンドポイントではないため、開発/検証環境以外では必ず無効化すること
 * (NODE_ENV !== "production" のみ動作。本番では404を返す)。
 */
import { NextRequest, NextResponse } from "next/server";
import { boxSimulator } from "@/lib/box/simulator-singleton";

interface ActionBody {
  action:
    | "registerBox"
    | "setOnline"
    | "setUnlockBehavior"
    | "setDoorAjar"
    | "simulatePowerLoss"
    | "simulatePowerRestored"
    | "getStatus"
    | "getEventLog"
    | "getCompartmentState";
  boxId: string;
  compartmentIds?: string[];
  capabilities?: Record<string, string>;
  online?: boolean;
  behavior?: "success" | "fail" | "timeout";
  compartmentId?: string;
  ajar?: boolean;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available in production" }, { status: 404 });
  }

  const body = (await req.json()) as ActionBody;

  try {
    switch (body.action) {
      case "registerBox":
        boxSimulator.registerBox(body.boxId, body.compartmentIds ?? [], body.capabilities ?? {});
        return NextResponse.json({ ok: true });
      case "setOnline":
        boxSimulator.setOnline(body.boxId, body.online ?? true);
        return NextResponse.json({ ok: true });
      case "setUnlockBehavior":
        boxSimulator.setUnlockBehavior(body.boxId, body.behavior ?? "success");
        return NextResponse.json({ ok: true });
      case "setDoorAjar":
        boxSimulator.setDoorAjar(body.boxId, body.compartmentId!, body.ajar ?? true);
        return NextResponse.json({ ok: true });
      case "simulatePowerLoss":
        boxSimulator.simulatePowerLoss(body.boxId);
        return NextResponse.json({ ok: true });
      case "simulatePowerRestored":
        boxSimulator.simulatePowerRestored(body.boxId);
        return NextResponse.json({ ok: true });
      case "getStatus":
        return NextResponse.json(await boxSimulator.getStatus(body.boxId));
      case "getEventLog":
        return NextResponse.json(boxSimulator.getEventLog(body.boxId));
      case "getCompartmentState":
        return NextResponse.json(boxSimulator.getCompartmentState(body.boxId, body.compartmentId!));
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
