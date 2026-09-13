/**
 * Box Simulator
 *
 * Master Handoff v2 §12.5 準拠。実機OEM完成前に、以下を再現するSimulatorを提供する。
 *   - オンライン／オフライン
 *   - 解錠成功／失敗／タイムアウト
 *   - 扉開閉、半開き、誤収納口イベント
 *   - 充電接続／未接続
 *   - イベント重複、遅延、順序逆転
 *   - 停電／復帰
 *   - 返却成立／要確認
 *
 * インメモリ実装。node:crypto以外の外部パッケージに依存しない。
 * 管理画面/開発ツールからの呼び出しを想定し、シナリオ注入用のcontrolメソッドを公開する。
 */
import {
  BoxProvider,
  SendCommandRequest,
  SendCommandResult,
  BoxStatus,
  BoxEventPayload,
  BoxCommandType,
  IngestEventResult,
} from "./provider";
import { signCommand, generateNonce, BoxCommandPayload } from "./command-signing";

export type UnlockBehavior = "success" | "fail" | "timeout";

interface CompartmentSimState {
  doorClosed: boolean;
  doorAjar: boolean; // 半開き
  locked: boolean;
  chargerConnected: boolean | null;
}

interface BoxSimState {
  online: boolean;
  lastHeartbeatAt: Date | null;
  unlockBehavior: UnlockBehavior;
  capabilities: Record<string, string>;
  compartments: Map<string, CompartmentSimState>;
  // イベント重複/順序逆転耐性の検証用
  seenEventIds: Set<string>;
  highestAppliedSequence: number;
  eventLog: BoxEventPayload[]; // 受信順(到着順)の生ログ。監査用に全件保持。
}

export class BoxSimulatorProvider implements BoxProvider {
  readonly kind = "simulator";
  private readonly secret: string;
  private boxes = new Map<string, BoxSimState>();
  private commandCounter = 0;

  constructor(secret = "dev-simulator-secret-change-me") {
    this.secret = secret;
  }

  // --- テスト/管理画面からのシナリオ注入 -----------------------------------

  registerBox(boxId: string, compartmentIds: string[], capabilities: Record<string, string> = {}) {
    const compartments = new Map<string, CompartmentSimState>();
    for (const cId of compartmentIds) {
      compartments.set(cId, { doorClosed: true, doorAjar: false, locked: true, chargerConnected: capabilities["charger_sense"] === "true" ? false : null });
    }
    this.boxes.set(boxId, {
      online: true,
      lastHeartbeatAt: new Date(),
      unlockBehavior: "success",
      capabilities,
      compartments,
      seenEventIds: new Set(),
      highestAppliedSequence: 0,
      eventLog: [],
    });
  }

  setOnline(boxId: string, online: boolean) {
    this.getBoxOrThrow(boxId).online = online;
  }

  setUnlockBehavior(boxId: string, behavior: UnlockBehavior) {
    this.getBoxOrThrow(boxId).unlockBehavior = behavior;
  }

  setDoorAjar(boxId: string, compartmentId: string, ajar: boolean) {
    const comp = this.getCompartmentOrThrow(boxId, compartmentId);
    comp.doorAjar = ajar;
    if (ajar) comp.doorClosed = false;
  }

  simulatePowerLoss(boxId: string) {
    const box = this.getBoxOrThrow(boxId);
    box.online = false;
  }

  simulatePowerRestored(boxId: string) {
    const box = this.getBoxOrThrow(boxId);
    box.online = true;
    box.lastHeartbeatAt = new Date();
  }

  getEventLog(boxId: string): BoxEventPayload[] {
    return [...this.getBoxOrThrow(boxId).eventLog];
  }

  getCompartmentState(boxId: string, compartmentId: string): CompartmentSimState {
    return { ...this.getCompartmentOrThrow(boxId, compartmentId) };
  }

  // --- BoxProvider 実装 ------------------------------------------------------

  async sendCommand(req: SendCommandRequest): Promise<SendCommandResult> {
    const box = this.getBoxOrThrow(req.boxId);
    const commandId = `sim_cmd_${++this.commandCounter}`;
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + req.ttlSeconds * 1000);

    const payload: BoxCommandPayload = {
      commandId,
      boxId: req.boxId,
      compartmentId: req.compartmentId,
      type: req.type,
      nonce,
      expiresAt: expiresAt.toISOString(),
    };
    const signature = signCommand(payload, this.secret);

    if (!box.online) {
      return { commandId, nonce, signature, expiresAt, status: "FAILED", error: "box_offline" };
    }

    if (req.type === "UNLOCK" && req.compartmentId) {
      const behavior = box.unlockBehavior;
      if (behavior === "fail") {
        return { commandId, nonce, signature, expiresAt, status: "FAILED", error: "unlock_denied" };
      }
      if (behavior === "timeout") {
        // タイムアウト: SENTとして返すが、door_openedイベントは発火させない(呼び出し側でタイムアウト検知する)
        return { commandId, nonce, signature, expiresAt, status: "SENT" };
      }
      // success: 解錠成功として即座に内部状態を更新し、door_openedイベントをイベントログに積む
      const comp = this.getCompartmentOrThrow(req.boxId, req.compartmentId);
      comp.locked = false;
      comp.doorClosed = false;
      await this.ingestEvent({
        boxId: req.boxId,
        compartmentId: req.compartmentId,
        eventType: "DOOR_OPENED",
        eventId: `sim_evt_${commandId}_door_opened`,
        deviceTimestamp: new Date(),
        sequenceNumber: this.nextSequence(box),
      });
    }

    if (req.type === "LOCK" && req.compartmentId) {
      const comp = this.getCompartmentOrThrow(req.boxId, req.compartmentId);
      comp.locked = true;
    }

    return { commandId, nonce, signature, expiresAt, status: "SENT" };
  }

  async getStatus(boxId: string): Promise<BoxStatus> {
    const box = this.getBoxOrThrow(boxId);
    return {
      boxId,
      online: box.online,
      lastHeartbeatAt: box.lastHeartbeatAt,
      compartments: Array.from(box.compartments.entries()).map(([compartmentId, s]) => ({
        compartmentId,
        doorClosed: s.doorClosed,
        locked: s.locked,
        chargerConnected: s.chargerConnected,
      })),
    };
  }

  async getCapabilities(boxId: string): Promise<Record<string, string>> {
    return { ...this.getBoxOrThrow(boxId).capabilities };
  }

  /**
   * Box→Backendイベントの取り込み。§12.4準拠:
   * - eventIdで重複排除(通信断中の再送に耐える)
   * - sequenceNumberが逆行するイベントは「記録はするが状態には反映しない」(順序逆転耐性)
   */
  async ingestEvent(event: BoxEventPayload): Promise<IngestEventResult> {
    const box = this.getBoxOrThrow(event.boxId);
    box.eventLog.push(event);

    if (box.seenEventIds.has(event.eventId)) {
      return { applied: false, reason: "duplicate_event_id" };
    }
    box.seenEventIds.add(event.eventId);

    if (event.sequenceNumber <= box.highestAppliedSequence) {
      // 遅延到着した古いイベント。監査ログには残すが、現在状態は書き換えない。
      return { applied: false, reason: "out_of_order_ignored_for_state" };
    }
    box.highestAppliedSequence = event.sequenceNumber;

    if (event.compartmentId) {
      const comp = box.compartments.get(event.compartmentId);
      if (comp) {
        switch (event.eventType) {
          case "DOOR_OPENED":
            comp.doorClosed = false;
            break;
          case "DOOR_CLOSED":
            comp.doorClosed = true;
            comp.doorAjar = false;
            break;
          case "LOCK_STATE_CHANGED":
            comp.locked = Boolean(event.payload?.locked);
            break;
          case "CHARGER_CONNECTED":
            comp.chargerConnected = true;
            break;
          case "CHARGING_STOPPED":
            comp.chargerConnected = false;
            break;
        }
      }
    }

    if (event.eventType === "HEARTBEAT" || event.eventType === "POWER_RESTORED") {
      box.lastHeartbeatAt = event.deviceTimestamp;
      box.online = true;
    }

    return { applied: true, reason: "ok" };
  }

  private nextSequence(box: BoxSimState): number {
    return box.highestAppliedSequence + 1;
  }

  private getBoxOrThrow(boxId: string): BoxSimState {
    const box = this.boxes.get(boxId);
    if (!box) throw new Error(`Simulator: unknown boxId ${boxId}`);
    return box;
  }

  private getCompartmentOrThrow(boxId: string, compartmentId: string): CompartmentSimState {
    const box = this.getBoxOrThrow(boxId);
    const comp = box.compartments.get(compartmentId);
    if (!comp) throw new Error(`Simulator: unknown compartmentId ${compartmentId} on box ${boxId}`);
    return comp;
  }
}
