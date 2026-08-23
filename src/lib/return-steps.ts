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
  /** "photo": 静止画1枚。"video": 短い動画(利用者が「次へ」を押すまで録画)。 */
  kind: "photo" | "video";
}

export const RETURN_STEPS: ReturnStep[] = [
  { key: "front", label: "本体正面", instruction: "カメラの正面が分かるように撮影してください", kind: "photo" },
  { key: "back", label: "本体背面", instruction: "カメラの背面が分かるように撮影してください", kind: "photo" },
  {
    key: "accessories",
    label: "付属品一式",
    instruction: "ストラップ・SDカード・SDカードリーダー・ケース・AC充電器・持ち運び用ケーブルを並べて撮影してください",
    kind: "photo",
  },
  {
    key: "power_on_check",
    label: "起動確認",
    instruction: "カメラの電源を入れて、正常に起動し画面が点灯する様子を映してください",
    kind: "video",
  },
  {
    key: "charger_connected",
    label: "充電ケーブル接続",
    instruction: "扉を閉める前に、内部固定ケーブルを接続した状態を撮影してください",
    kind: "photo",
  },
  {
    key: "door_closed",
    label: "扉を閉めて鍵を戻した状態",
    instruction: "扉を閉め、鍵を元の場所に戻した状態を撮影してください",
    kind: "photo",
  },
];

export const RETURN_STEP_KEYS = RETURN_STEPS.map((s) => s.key);
