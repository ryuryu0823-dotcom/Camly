-- 安心プラン(Care加入時、破損時の利用者負担上限)を扱うためのカラム追加。
ALTER TABLE "care_plans" ADD COLUMN "liabilityCapJpy" INTEGER;

-- 既存のSTANDARDプランを「安心プラン」(+¥200、破損時請求上限¥3,000)として再定義する。
UPDATE care_plans SET "priceJpy" = 200, "liabilityCapJpy" = 3000 WHERE tier = 'STANDARD';
