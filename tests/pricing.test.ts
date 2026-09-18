import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateUsagePrice,
  calculateTotalPrice,
  computeDurationMinutes,
  PricingError,
} from "../src/lib/pricing/engine";

// nasu room MINI pilot v1 (Master Handoff v2 §7)
const nasuVersion = {
  tiers: [
    { untilMinutes: 180, priceJpy: 990 },
    { untilMinutes: 720, priceJpy: 1490 },
    { untilMinutes: 1440, priceJpy: 1990 },
  ],
  additionalPer24hJpy: 1500,
};

test("3時間未満は990円", () => {
  assert.equal(calculateUsagePrice(0, nasuVersion).amountJpy, 990);
  assert.equal(calculateUsagePrice(179, nasuVersion).amountJpy, 990);
  assert.equal(calculateUsagePrice(180, nasuVersion).amountJpy, 990);
});

test("3時間超12時間未満は1490円", () => {
  assert.equal(calculateUsagePrice(181, nasuVersion).amountJpy, 1490);
  assert.equal(calculateUsagePrice(720, nasuVersion).amountJpy, 1490);
});

test("12時間超24時間までは1990円", () => {
  assert.equal(calculateUsagePrice(721, nasuVersion).amountJpy, 1990);
  assert.equal(calculateUsagePrice(1440, nasuVersion).amountJpy, 1990);
});

test("24時間超は24時間ごとに1500円加算", () => {
  assert.equal(calculateUsagePrice(1441, nasuVersion).amountJpy, 1990 + 1500); // 24h+1min -> 2日目突入
  assert.equal(calculateUsagePrice(1440 * 2, nasuVersion).amountJpy, 1990 + 1500); // ちょうど48h
  assert.equal(calculateUsagePrice(1440 * 2 + 1, nasuVersion).amountJpy, 1990 + 1500 * 2); // 48h+1min
});

test("マイナス時間はエラー", () => {
  assert.throws(() => calculateUsagePrice(-1, nasuVersion), PricingError);
});

test("Careプランを含めた合計計算", () => {
  const result = calculateTotalPrice(60, nasuVersion, { priceJpy: 250 });
  assert.equal(result.usageJpy, 990);
  assert.equal(result.careJpy, 250);
  assert.equal(result.totalJpy, 1240);
  assert.equal(result.breakdown.length, 2);
});

test("Careプランなしの合計計算", () => {
  const result = calculateTotalPrice(60, nasuVersion, null);
  assert.equal(result.totalJpy, 990);
  assert.equal(result.breakdown.length, 1);
});

test("tiersが昇順でない場合はエラー", () => {
  assert.throws(
    () =>
      calculateUsagePrice(10, {
        tiers: [
          { untilMinutes: 180, priceJpy: 990 },
          { untilMinutes: 100, priceJpy: 500 },
        ],
        additionalPer24hJpy: 1500,
      }),
    PricingError
  );
});

test("computeDurationMinutesは分単位に切り上げる", () => {
  const start = new Date("2026-09-01T10:00:00Z");
  const end = new Date("2026-09-01T10:00:30Z"); // 30秒後
  assert.equal(computeDurationMinutes(start, end), 1);
});

test("returnがstartより前だとエラー", () => {
  const start = new Date("2026-09-01T10:00:00Z");
  const end = new Date("2026-09-01T09:00:00Z");
  assert.throws(() => computeDurationMinutes(start, end), PricingError);
});
