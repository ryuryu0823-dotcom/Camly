import { test } from "node:test";
import assert from "node:assert/strict";
import ja from "../src/lib/i18n/dictionaries/ja";
import en from "../src/lib/i18n/dictionaries/en";
import { flattenKeys } from "../src/lib/i18n/index";

// Master Handoff v2 §16: 「英語切替時に日本語を残さない。全UI文言を辞書化し、CIで欠落を検出」
test("ja/en辞書のキー構成が完全一致する(欠落検出)", () => {
  const jaKeys = flattenKeys(ja).sort();
  const enKeys = flattenKeys(en).sort();

  const missingInEn = jaKeys.filter((k) => !enKeys.includes(k));
  const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));

  assert.deepEqual(missingInEn, [], `en辞書に欠落しているキー: ${missingInEn.join(", ")}`);
  assert.deepEqual(missingInJa, [], `ja辞書に欠落しているキー: ${missingInJa.join(", ")}`);
});

test("空文字列の翻訳値が無いこと", () => {
  const check = (dict: Record<string, unknown>, label: string) => {
    for (const key of flattenKeys(dict)) {
      const value = key.split(".").reduce((acc: any, k) => acc?.[k], dict);
      assert.notEqual(value, "", `${label}.${key} が空文字列`);
      assert.ok(value !== undefined, `${label}.${key} が未定義`);
    }
  };
  check(ja, "ja");
  check(en, "en");
});
