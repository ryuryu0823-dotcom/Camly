-- 開発/検証用シードデータ。nasu room MINI Phase A想定。
-- 金額は Master Handoff v2 §7「現在のnasu room MINI実証案」に準拠。

INSERT INTO locations (id, "publicId", name, "nameEn", slug, address, "isPublished")
VALUES ('loc_nasu', 'loc_pub_8f2a1c', 'nasu room MINI', 'nasu room MINI', 'nasu-room-mini', '栃木県那須', false);

INSERT INTO boxes (id, "publicId", "locationId", label, mode, "isActive")
VALUES ('box_nasu_1', 'box_pub_3e9d7b', 'loc_nasu', 'nasu room MINI Box 1', 'PILOT_PHYSICAL_LOCK', true);

INSERT INTO box_capabilities (id, "boxId", key, value) VALUES
  ('cap_1', 'box_nasu_1', 'remote_unlock', 'false'),
  ('cap_2', 'box_nasu_1', 'charger_sense', 'false');

INSERT INTO devices (id, serial, model, tier, status, "purchasedAt", "purchasePriceJpy")
VALUES ('dev_rx100m3_1', 'SN-RX100M3-0001', 'SONY Cyber-shot DSC-RX100M3', 'STANDARD', 'AVAILABLE', now(), 72000);

INSERT INTO compartments (id, "publicId", "boxId", index, status, "currentDeviceId")
VALUES ('comp_nasu_1_1', 'comp_pub_1a2b3c', 'box_nasu_1', 1, 'AVAILABLE', 'dev_rx100m3_1');

INSERT INTO accessory_checklists (id, "deviceId", items)
VALUES ('acc_1', 'dev_rx100m3_1', '["strap","sd_card","sd_card_reader","case","ac_charger","carry_cable"]');

INSERT INTO pricing_rules (id, "locationId", tier, name, "isStayRule", "isActive")
VALUES ('pr_nasu_stay', 'loc_nasu', 'STANDARD', 'nasu room MINI pilot v1 (stay)', true, true);

-- §7: 3時間未満990円 / 12時間未満1,490円 / それ以降は時間に関わらず一律1,990円
-- (最終tierのuntilMinutesは実質無制限の値。additionalPer24hJpy=0で24時間超過分の追加課金を無効化)
INSERT INTO pricing_versions (id, "pricingRuleId", version, tiers, "additionalPer24hJpy", currency)
VALUES (
  'pv_nasu_stay_1',
  'pr_nasu_stay',
  1,
  '[{"untilMinutes":180,"priceJpy":990},{"untilMinutes":720,"priceJpy":1490},{"untilMinutes":999999,"priceJpy":1990}]',
  0,
  'JPY'
);

INSERT INTO care_plans (id, tier, "priceJpy", "isActive") VALUES
  ('care_none', 'NONE', 0, true),
  ('care_standard', 'STANDARD', 250, true);

INSERT INTO consent_versions (id, kind, version, "bodyUrl") VALUES
  ('cv_terms_1', 'terms', 'v1-draft', '/terms'),
  ('cv_care_1', 'care', 'v1-draft', '/care'),
  ('cv_privacy_1', 'privacy', 'v1-draft', '/privacy');

-- ローカル動作確認用の管理者。実ログイン機構は未実装のためpasswordHashはダミー
-- (本番投入前に必ず実際の認証・RBACミドルウェアに置き換えること)。
INSERT INTO admin_users (id, email, name, role, "passwordHash", "isActive")
VALUES ('admin_dev_local', 'dev-admin@example.com', '開発用テスト管理者', 'SUPER_ADMIN', 'dev-only-placeholder-not-a-real-hash', true);
