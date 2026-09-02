-- 返却フロー刷新: ステップ式ガイド撮影(正面/背面/付属品一式/扉/充電ケーブル)。
-- どのステップの動画かをMediaAsset側で識別できるようにする。
ALTER TABLE "media_assets" ADD COLUMN "stepKey" TEXT;
