-- Phase Aの暗証番号を"一度だけ表示"するための記録カラム(§6 step8)。
ALTER TABLE "rentals" ADD COLUMN "unlockCodeRevealedAt" TIMESTAMPTZ;
