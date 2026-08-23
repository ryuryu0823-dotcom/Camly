-- 12時間(720分)を超えたら、それ以降は時間に関わらず一律¥1,990にする。
-- 最終tierのuntilMinutesを実質無制限の大きな値にし、additionalPer24hJpyを0にすることで
-- 24時間超過分の追加課金(§7の階段加算)を無効化する(pricing engine自体は変更しない)。
UPDATE pricing_versions
SET tiers = '[{"untilMinutes":180,"priceJpy":990},{"untilMinutes":720,"priceJpy":1490},{"untilMinutes":999999,"priceJpy":1990}]',
    "additionalPer24hJpy" = 0
WHERE id = 'pv_nasu_stay_1';
