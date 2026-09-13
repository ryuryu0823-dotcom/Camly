/**
 * 返却写真のAI一次判定(§10, §21)。
 *
 * npm SDK(@anthropic-ai/sdk)に依存せず、他のクライアント(src/lib/stripe/client.ts)と
 * 同じ方針でMessages APIを直接fetchする。
 *
 * 重要: これはあくまで管理者向けの「参考所見」であり、最終判断は必ず人が行う
 * (承認・請求アクションはこの結果を見て管理者が選ぶ既存のUIのまま、自動化しない)。
 * 対象は静止画ステップのみ(動画ステップ「起動確認」はAPIの画像解析対象外のため、常に人による確認とする)。
 */
import { RETURN_STEPS } from "@/lib/return-steps";

export interface ReturnPhotoInput {
  stepKey: string;
  label: string;
  imageBase64: string;
  mediaType: string;
}

export interface ReturnReviewItem {
  stepKey: string;
  label: string;
  ok: boolean;
  note: string;
}

export interface ReturnReviewResult {
  overall: "PASS" | "HUMAN_REVIEW";
  items: ReturnReviewItem[];
  summary: string;
}

const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export class AiReviewError extends Error {}

export async function reviewReturnPhotos(apiKey: string, photos: ReturnPhotoInput[]): Promise<ReturnReviewResult> {
  const stepLabelByKey = new Map(RETURN_STEPS.map((s) => [s.key, s.label]));

  const instructions = `あなたはカメラレンタルサービスCamlyの返却確認アシスタントです。
利用者が返却時に撮影した写真を確認し、それぞれについて「本体・付属品が揃っており、明らかな破損が無いか」を判定してください。

対象ステップ: ${photos.map((p) => `${p.stepKey}(${p.label})`).join(", ")}

次のJSON形式のみを出力してください。前後に説明文やmarkdownのコードブロックは付けないでください。
{
  "overall": "PASS" または "HUMAN_REVIEW",
  "items": [
    { "stepKey": "...", "ok": true または false, "note": "簡潔な所見(日本語、1文)" }
  ],
  "summary": "管理者向けの一言まとめ(日本語)"
}

判定基準:
- 写真に該当のもの(本体正面/背面、付属品一式、充電ケーブル接続、扉施錠状態等)が写っており、明らかな破損・欠品・異常が無ければ ok:true
- 写りが不明瞭、破損の疑いがある、付属品が足りなさそうに見える等、判断がつかない場合は ok:false とし、noteに理由を書く
- どれか1つでもok:falseがあれば、overallは"HUMAN_REVIEW"とする。すべてok:trueなら"PASS"とする
- 断定はせず、あくまで人間の管理者が最終確認するための参考所見として書く`;

  const content: any[] = [{ type: "text", text: instructions }];
  for (const photo of photos) {
    content.push({ type: "text", text: `--- ${photo.label} (stepKey: ${photo.stepKey}) ---` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: photo.mediaType, data: photo.imageBase64 },
    });
  }

  const res = await fetch(ANTHROPIC_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new AiReviewError(json?.error?.message ?? `Anthropic API error (${res.status})`);
  }

  const text = json?.content?.find((b: any) => b.type === "text")?.text ?? "";
  let parsed: any;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new AiReviewError(`AI応答をJSONとして解釈できませんでした: ${text.slice(0, 200)}`);
  }

  const items: ReturnReviewItem[] = (parsed.items ?? []).map((item: any) => ({
    stepKey: item.stepKey,
    label: stepLabelByKey.get(item.stepKey) ?? item.stepKey,
    ok: Boolean(item.ok),
    note: String(item.note ?? ""),
  }));

  return {
    overall: parsed.overall === "PASS" ? "PASS" : "HUMAN_REVIEW",
    items,
    summary: String(parsed.summary ?? ""),
  };
}
