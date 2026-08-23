/**
 * 返却フローのステップ式ガイド撮影(§10)で使うステップ定義。
 * 顧客向け録画UI(app/app/rentals/[token]/return/page.tsx)と
 * サーバー側バリデーション・DB保存・管理画面表示(app/api/rentals/[token]/return/route.ts,
 * app/admin/rentals/[id]/page.tsx)の両方から参照する単一のソース。
 *
 * door_closed / charger_connected は現状「動画が撮れた=証跡あり」を人手確認の代替としているが、
 * 将来Boxのセンサー(box_capabilities.charger_sense / remote_unlock)が実用化されたら、
 * ReturnInspection.doorClosed/chargerConnectedの立て方をそちらに差し替える想定(§12.3)。
 */
export interface ReturnStep {
  key: string;
  label: string;
  instruction: string;
}

export const RETURN_STEPS: ReturnStep[] = [
  { key: "front", label: "本体正面", instruction: "カメラの正面を大きく映してください" },
  { key: "back", label: "本体背面", instruction: "カメラの背面を大きく映してください" },
  {
    key: "accessories",
    label: "付属品一式",
    instruction: "ストラップ・SDカード・SDカードリーダー・ケース・AC充電器・持ち運び用ケーブルを並べて映してください",
  },
  {
    key: "charger_connected",
    label: "充電ケーブル接続",
    instruction: "扉を閉める前に、内部固定ケーブルを接続した状態を映してください",
  },
  {
    key: "door_closed",
    label: "扉を閉めて鍵を戻した状態",
    instruction: "扉を閉め、鍵を元の場所に戻した状態を映してください",
  },
];

export const RETURN_STEP_KEYS = RETURN_STEPS.map((s) => s.key);
