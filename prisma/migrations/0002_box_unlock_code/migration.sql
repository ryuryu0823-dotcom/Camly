-- Phase A物理キーボックスの暗証番号を、コードのハードコードではなく管理画面から設定可能なDB値にする。
-- 監査で判明した既存実装の問題(全利用者へ固定の"2580"を表示)への是正。

ALTER TABLE "boxes"
  ADD COLUMN "currentPhysicalUnlockCode" TEXT,
  ADD COLUMN "unlockCodeUpdatedAt" TIMESTAMPTZ;
