/**
 * BoxProvider interface
 *
 * Master Handoff v2 §5, §12.5 準拠。
 * 実機OEM完成前にSimulatorで検証サイト・決済・状態遷移を完成させるためのadapter抽象。
 * Phase Aの物理鍵運用ではBoxProviderを呼ばない(暗証番号表示のみ)。Phase Bでこのinterfaceを介してBoxと通信する。
 */

export type BoxCommandType = "UNLOCK" | "LOCK" | "STATUS_REQUEST" | "REBOOT" | "OTA_UPDATE";

export interface SendCommandRequest {
  boxId: string;
  compartmentId: string | null;
  type: BoxCommandType;
  /** コマンドの有効期限(秒)。§12.3: 短寿命。 */
  ttlSeconds: number;
  reason?: string;
  issuedByAdminId?: string;
}

export interface SendCommandResult {
  commandId: string;
  nonce: string;
  signature: string;
  expiresAt: Date;
  /** Providerが同期的に把握できる直後の状態。実機は非同期でcommand_resultイベントが別途届く。 */
  status: "SENT" | "FAILED";
  error?: string;
}

export type BoxEventType =
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

export interface BoxEventPayload {
  boxId: string;
  compartmentId: string | null;
  eventType: BoxEventType;
  eventId: string;
  deviceTimestamp: Date;
  firmwareVersion?: string;
  sequenceNumber: number;
  payload?: Record<string, unknown>;
}

export interface IngestEventResult {
  applied: boolean;
  reason?: string;
}

export interface BoxStatus {
  boxId: string;
  online: boolean;
  lastHeartbeatAt: Date | null;
  compartments: {
    compartmentId: string;
    doorClosed: boolean;
    locked: boolean;
    chargerConnected: boolean | null; // null = 対応機種でない(capability無し)
  }[];
}

/**
 * すべてのBox実装(Simulator, 将来のOEM adapter)が満たすべきinterface。
 * §12.2: ハード側の能力差はcapabilityとして取得し、呼び出し側(アプリ)が対応する。
 */
export interface BoxProvider {
  readonly kind: string;

  sendCommand(req: SendCommandRequest): Promise<SendCommandResult>;

  getStatus(boxId: string): Promise<BoxStatus>;

  /** Box側からのイベント受信をProvider経由で統一的に処理する(テスト/Simulator用のフック) */
  ingestEvent(event: BoxEventPayload): Promise<IngestEventResult>;

  getCapabilities(boxId: string): Promise<Record<string, string>>;
}
