/**
 * Rental state machine
 *
 * Master Handoff v2 §13 準拠。
 * 状態遷移はサーバーのみが実行し、すべてRentalEventとAuditLogに残す(呼び出し側の責務)。
 * ここでは「許可された遷移かどうか」だけを判定する純粋関数を提供する。
 */

export type RentalStatus =
  | "AVAILABLE"
  | "HELD"
  | "PAYMENT_AUTHORIZED"
  | "UNLOCK_REQUESTED"
  | "DOOR_OPEN"
  | "RENTED"
  | "RETURN_VIDEO_PENDING"
  | "AI_REVIEW"
  | "RETURN_DOOR_OPEN"
  | "CHARGE_REQUIRED"
  | "RETURNED_PENDING_REVIEW"
  | "COMPLETED"
  // 例外系
  | "PAYMENT_FAILED"
  | "AUTH_EXPIRES_SOON"
  | "OVERDUE"
  | "AI_REVIEW_REQUIRED"
  | "DAMAGE_REVIEW"
  | "BOX_OFFLINE"
  | "DOOR_JAMMED"
  | "CHARGER_NOT_CONNECTED"
  | "REFUND_REQUIRED"
  | "CANCELED";

/**
 * 基本の直線的な流れ(§13)。
 * AVAILABLE -> HELD -> PAYMENT_AUTHORIZED -> UNLOCK_REQUESTED -> DOOR_OPEN -> RENTED
 *   -> RETURN_VIDEO_PENDING -> AI_REVIEW -> RETURN_DOOR_OPEN -> CHARGE_REQUIRED
 *   -> RETURNED_PENDING_REVIEW -> COMPLETED
 *
 * 例外系はいずれも「そのときの主要状態」から遷移しうるので、個別にfrom集合を定義する。
 */
const HAPPY_PATH: [RentalStatus, RentalStatus][] = [
  ["AVAILABLE", "HELD"],
  ["HELD", "PAYMENT_AUTHORIZED"],
  ["PAYMENT_AUTHORIZED", "UNLOCK_REQUESTED"],
  ["UNLOCK_REQUESTED", "DOOR_OPEN"],
  ["DOOR_OPEN", "RENTED"],
  ["RENTED", "RETURN_VIDEO_PENDING"],
  ["RETURN_VIDEO_PENDING", "AI_REVIEW"],
  ["AI_REVIEW", "RETURN_DOOR_OPEN"],
  ["RETURN_DOOR_OPEN", "CHARGE_REQUIRED"],
  ["CHARGE_REQUIRED", "RETURNED_PENDING_REVIEW"],
  ["RETURNED_PENDING_REVIEW", "COMPLETED"],
];

// 例外系遷移。 [from, to][] の形式。fromは配列で複数状態から遷移可能。
const EXCEPTION_TRANSITIONS: [RentalStatus[], RentalStatus][] = [
  // 決済失敗/キャンセル
  [["HELD"], "PAYMENT_FAILED"],
  [["PAYMENT_FAILED"], "CANCELED"],
  [["HELD", "PAYMENT_AUTHORIZED"], "CANCELED"],

  // オーソリ期限
  [["PAYMENT_AUTHORIZED", "UNLOCK_REQUESTED", "DOOR_OPEN", "RENTED"], "AUTH_EXPIRES_SOON"],
  [["AUTH_EXPIRES_SOON"], "REFUND_REQUIRED"],
  [["AUTH_EXPIRES_SOON"], "RENTED"], // 再オーソリ/延長成功時に復帰

  // Box/扉トラブル
  [["UNLOCK_REQUESTED"], "BOX_OFFLINE"],
  [["UNLOCK_REQUESTED"], "DOOR_JAMMED"],
  [["BOX_OFFLINE"], "UNLOCK_REQUESTED"], // 復旧後リトライ
  [["DOOR_JAMMED"], "UNLOCK_REQUESTED"],

  [["RETURN_VIDEO_PENDING"], "RETURN_DOOR_OPEN"], // Phase B: 動画不要でも扉解錠が先行するケース
  [["RETURN_DOOR_OPEN"], "CHARGER_NOT_CONNECTED"],
  [["CHARGER_NOT_CONNECTED"], "RETURN_DOOR_OPEN"],
  [["RETURN_DOOR_OPEN"], "BOX_OFFLINE"],
  [["BOX_OFFLINE"], "RETURN_DOOR_OPEN"],

  // 未返却/延滞
  [["RENTED"], "OVERDUE"],
  [["OVERDUE"], "RETURN_VIDEO_PENDING"], // 遅延後に返却開始

  // AI判定
  [["AI_REVIEW"], "AI_REVIEW_REQUIRED"],
  [["AI_REVIEW_REQUIRED"], "RETURN_VIDEO_PENDING"], // 撮り直し要求で差し戻し
  [["AI_REVIEW_REQUIRED"], "RETURN_DOOR_OPEN"], // 人手確認OKで先へ

  // 破損・返金
  [["CHARGE_REQUIRED", "RETURNED_PENDING_REVIEW"], "DAMAGE_REVIEW"],
  [["DAMAGE_REVIEW"], "RETURNED_PENDING_REVIEW"],
  [["RETURNED_PENDING_REVIEW"], "REFUND_REQUIRED"],
  [["REFUND_REQUIRED"], "COMPLETED"],
];

function buildTransitionMap(): Map<RentalStatus, Set<RentalStatus>> {
  const map = new Map<RentalStatus, Set<RentalStatus>>();
  const add = (from: RentalStatus, to: RentalStatus) => {
    if (!map.has(from)) map.set(from, new Set());
    map.get(from)!.add(to);
  };
  for (const [from, to] of HAPPY_PATH) add(from, to);
  for (const [froms, to] of EXCEPTION_TRANSITIONS) {
    for (const from of froms) add(from, to);
  }
  return map;
}

const TRANSITION_MAP = buildTransitionMap();

export class InvalidTransitionError extends Error {
  constructor(from: RentalStatus, to: RentalStatus) {
    super(`Invalid rental status transition: ${from} -> ${to}`);
  }
}

export function isValidTransition(from: RentalStatus, to: RentalStatus): boolean {
  return TRANSITION_MAP.get(from)?.has(to) ?? false;
}

/** 遷移を検証する。不正なら例外を投げる。呼び出し側でRentalEvent/AuditLog書き込みとセットで使う。 */
export function assertValidTransition(from: RentalStatus, to: RentalStatus): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function getAllowedNextStates(from: RentalStatus): RentalStatus[] {
  return Array.from(TRANSITION_MAP.get(from) ?? []);
}

/** 終端状態(それ以上遷移しない想定の状態)かどうか。CANCELED/COMPLETEDのみ。 */
export function isTerminalState(status: RentalStatus): boolean {
  return status === "COMPLETED" || status === "CANCELED";
}
