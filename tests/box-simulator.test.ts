import { test } from "node:test";
import assert from "node:assert/strict";
import { BoxSimulatorProvider } from "../src/lib/box/simulator-provider";
import { verifyIncomingCommand, BoxCommandPayload } from "../src/lib/box/command-signing";

function makeSim() {
  const sim = new BoxSimulatorProvider("test-secret");
  sim.registerBox("box_1", ["comp_1", "comp_2"], { charger_sense: "true" });
  return sim;
}

test("オンライン時の解錠成功で扉が開く", async () => {
  const sim = makeSim();
  const result = await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });
  assert.equal(result.status, "SENT");
  const state = sim.getCompartmentState("box_1", "comp_1");
  assert.equal(state.doorClosed, false);
  assert.equal(state.locked, false);
});

test("オフライン時はコマンドがFAILEDになる(box_offline)", async () => {
  const sim = makeSim();
  sim.setOnline("box_1", false);
  const result = await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });
  assert.equal(result.status, "FAILED");
  assert.equal(result.error, "box_offline");
});

test("解錠失敗(unlock_denied)が再現できる", async () => {
  const sim = makeSim();
  sim.setUnlockBehavior("box_1", "fail");
  const result = await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });
  assert.equal(result.status, "FAILED");
  assert.equal(result.error, "unlock_denied");
  // 失敗時は扉が開いていないこと
  const state = sim.getCompartmentState("box_1", "comp_1");
  assert.equal(state.doorClosed, true);
});

test("解錠タイムアウトが再現できる(SENTのままdoor_openedが発火しない)", async () => {
  const sim = makeSim();
  sim.setUnlockBehavior("box_1", "timeout");
  const result = await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });
  assert.equal(result.status, "SENT");
  const state = sim.getCompartmentState("box_1", "comp_1");
  assert.equal(state.doorClosed, true); // 開いていない = 呼び出し側でタイムアウト検知が必要
});

test("誤収納口は影響しない(comp_1を解錠してもcomp_2は変化しない)", async () => {
  const sim = makeSim();
  await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });
  const other = sim.getCompartmentState("box_1", "comp_2");
  assert.equal(other.doorClosed, true);
  assert.equal(other.locked, true);
});

test("半開き状態を注入できる", () => {
  const sim = makeSim();
  sim.setDoorAjar("box_1", "comp_1", true);
  const state = sim.getCompartmentState("box_1", "comp_1");
  assert.equal(state.doorAjar, true);
  assert.equal(state.doorClosed, false);
});

test("充電接続/未接続イベント", async () => {
  const sim = makeSim();
  await sim.ingestEvent({
    boxId: "box_1",
    compartmentId: "comp_1",
    eventType: "CHARGER_CONNECTED",
    eventId: "evt_charger_1",
    deviceTimestamp: new Date(),
    sequenceNumber: 1,
  });
  assert.equal(sim.getCompartmentState("box_1", "comp_1").chargerConnected, true);

  await sim.ingestEvent({
    boxId: "box_1",
    compartmentId: "comp_1",
    eventType: "CHARGING_STOPPED",
    eventId: "evt_charger_2",
    deviceTimestamp: new Date(),
    sequenceNumber: 2,
  });
  assert.equal(sim.getCompartmentState("box_1", "comp_1").chargerConnected, false);
});

test("イベント重複(同一eventId)は2回目が無視される", async () => {
  const sim = makeSim();
  const evt = {
    boxId: "box_1",
    compartmentId: "comp_1",
    eventType: "DOOR_CLOSED" as const,
    eventId: "evt_dup_1",
    deviceTimestamp: new Date(),
    sequenceNumber: 1,
  };
  const first = await sim.ingestEvent(evt);
  const second = await sim.ingestEvent(evt);
  assert.equal(first.applied, true);
  assert.equal(second.applied, false);
  assert.equal(second.reason, "duplicate_event_id");
  // ログには2件とも残る(監査目的)
  assert.equal(sim.getEventLog("box_1").length, 2);
});

test("順序逆転: 新しいsequenceの後に古いsequenceが届いても状態は巻き戻らない", async () => {
  const sim = makeSim();
  // 先にdoor_opened(seq=2)、door_closed(seq=1)が遅延して後から届くケース
  await sim.ingestEvent({
    boxId: "box_1",
    compartmentId: "comp_1",
    eventType: "DOOR_OPENED",
    eventId: "evt_open_seq2",
    deviceTimestamp: new Date(),
    sequenceNumber: 2,
  });
  assert.equal(sim.getCompartmentState("box_1", "comp_1").doorClosed, false);

  const late = await sim.ingestEvent({
    boxId: "box_1",
    compartmentId: "comp_1",
    eventType: "DOOR_CLOSED",
    eventId: "evt_close_seq1_delayed",
    deviceTimestamp: new Date(),
    sequenceNumber: 1, // 古いseq
  });
  assert.equal(late.applied, false);
  assert.equal(late.reason, "out_of_order_ignored_for_state");
  // 状態は開いたまま(古いイベントで巻き戻らない)
  assert.equal(sim.getCompartmentState("box_1", "comp_1").doorClosed, false);
  // ただしログには残る
  assert.equal(sim.getEventLog("box_1").length, 2);
});

test("停電/復帰", async () => {
  const sim = makeSim();
  sim.simulatePowerLoss("box_1");
  assert.equal((await sim.getStatus("box_1")).online, false);

  sim.simulatePowerRestored("box_1");
  const status = await sim.getStatus("box_1");
  assert.equal(status.online, true);
  assert.ok(status.lastHeartbeatAt !== null);
});

test("コマンド署名はSimulatorが返すsignature/nonce/expiresAtで検証可能", async () => {
  const sim = makeSim();
  const result = await sim.sendCommand({ boxId: "box_1", compartmentId: "comp_1", type: "UNLOCK", ttlSeconds: 30 });

  // Simulatorはcommandの中身を直接返さないため、同じ入力で再構成してverifyIncomingCommandを試す
  // (実運用ではBox側がcommand本体を受信して検証する。ここでは署名生成/検証の往復を確認する。)
  const payload: BoxCommandPayload = {
    commandId: "sim_cmd_1",
    boxId: "box_1",
    compartmentId: "comp_1",
    type: "UNLOCK",
    nonce: result.nonce,
    expiresAt: result.expiresAt.toISOString(),
  };
  const verify = verifyIncomingCommand(payload, result.signature, "test-secret", new Date(), new Set());
  assert.equal(verify.ok, true);
});

test("期限切れcommandは拒否される", () => {
  const payload: BoxCommandPayload = {
    commandId: "cmd_x",
    boxId: "box_1",
    compartmentId: "comp_1",
    type: "UNLOCK",
    nonce: "nonce_x",
    expiresAt: new Date(Date.now() - 1000).toISOString(), // 過去
  };
  const secret = "test-secret";
  const { signCommand } = require("../src/lib/box/command-signing");
  const sig = signCommand(payload, secret);
  const verify = verifyIncomingCommand(payload, sig, secret, new Date(), new Set());
  assert.equal(verify.ok, false);
  if (!verify.ok) assert.equal(verify.reason, "expired");
});

test("replay(同一nonceの再送)は拒否される", () => {
  const payload: BoxCommandPayload = {
    commandId: "cmd_y",
    boxId: "box_1",
    compartmentId: "comp_1",
    type: "UNLOCK",
    nonce: "nonce_y",
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  };
  const secret = "test-secret";
  const { signCommand } = require("../src/lib/box/command-signing");
  const sig = signCommand(payload, secret);
  const seen = new Set(["nonce_y"]);
  const verify = verifyIncomingCommand(payload, sig, secret, new Date(), seen);
  assert.equal(verify.ok, false);
  if (!verify.ok) assert.equal(verify.reason, "replay_detected");
});

test("署名不一致は拒否される", () => {
  const payload: BoxCommandPayload = {
    commandId: "cmd_z",
    boxId: "box_1",
    compartmentId: "comp_1",
    type: "UNLOCK",
    nonce: "nonce_z",
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  };
  const verify = verifyIncomingCommand(payload, "deadbeef".repeat(8), "test-secret", new Date(), new Set());
  assert.equal(verify.ok, false);
  if (!verify.ok) assert.equal(verify.reason, "invalid_signature");
});
