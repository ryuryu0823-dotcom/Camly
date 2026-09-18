import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidTransition,
  assertValidTransition,
  InvalidTransitionError,
  getAllowedNextStates,
  isTerminalState,
  RentalStatus,
} from "../src/lib/state-machine/rental";

test("ハッピーパスは全て許可される", () => {
  const path: RentalStatus[] = [
    "AVAILABLE",
    "HELD",
    "PAYMENT_AUTHORIZED",
    "UNLOCK_REQUESTED",
    "DOOR_OPEN",
    "RENTED",
    "RETURN_VIDEO_PENDING",
    "AI_REVIEW",
    "RETURN_DOOR_OPEN",
    "CHARGE_REQUIRED",
    "RETURNED_PENDING_REVIEW",
    "COMPLETED",
  ];
  for (let i = 1; i < path.length; i++) {
    assert.equal(isValidTransition(path[i - 1]!, path[i]!), true, `${path[i - 1]} -> ${path[i]}`);
  }
});

test("状態を飛び越える遷移(決済前にRENTEDへ)は拒否される", () => {
  assert.equal(isValidTransition("HELD", "RENTED"), false);
  assert.equal(isValidTransition("AVAILABLE", "RENTED"), false);
});

test("逆行(RENTEDからHELDへ戻る)は拒否される", () => {
  assert.equal(isValidTransition("RENTED", "HELD"), false);
});

test("assertValidTransitionは不正な遷移でInvalidTransitionErrorを投げる", () => {
  assert.throws(() => assertValidTransition("AVAILABLE", "COMPLETED"), InvalidTransitionError);
});

test("オーソリ期限切れ系の例外遷移", () => {
  assert.equal(isValidTransition("RENTED", "AUTH_EXPIRES_SOON"), true);
  assert.equal(isValidTransition("AUTH_EXPIRES_SOON", "REFUND_REQUIRED"), true);
  assert.equal(isValidTransition("AUTH_EXPIRES_SOON", "RENTED"), true);
});

test("Box offline/復旧の例外遷移", () => {
  assert.equal(isValidTransition("UNLOCK_REQUESTED", "BOX_OFFLINE"), true);
  assert.equal(isValidTransition("BOX_OFFLINE", "UNLOCK_REQUESTED"), true);
});

test("AI_REVIEW_REQUIREDからの差し戻し/先進みの両方が許可される", () => {
  assert.equal(isValidTransition("AI_REVIEW_REQUIRED", "RETURN_VIDEO_PENDING"), true);
  assert.equal(isValidTransition("AI_REVIEW_REQUIRED", "RETURN_DOOR_OPEN"), true);
});

test("getAllowedNextStatesはHELDから複数の遷移先を返す", () => {
  const next = getAllowedNextStates("HELD");
  assert.ok(next.includes("PAYMENT_AUTHORIZED"));
  assert.ok(next.includes("PAYMENT_FAILED"));
  assert.ok(next.includes("CANCELED"));
});

test("COMPLETEDとCANCELEDは終端状態", () => {
  assert.equal(isTerminalState("COMPLETED"), true);
  assert.equal(isTerminalState("CANCELED"), true);
  assert.equal(isTerminalState("RENTED"), false);
});

test("終端状態からの遷移は存在しない", () => {
  assert.equal(getAllowedNextStates("COMPLETED").length, 0);
  assert.equal(getAllowedNextStates("CANCELED").length, 0);
});
