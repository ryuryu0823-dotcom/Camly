/**
 * 返却アンケート(app/app/rentals/[token]/return/page.tsx)の回答キーの日本語ラベルと表示順。
 * 管理画面の一覧表示(app/admin/surveys/page.tsx)とCSVエクスポート(app/api/admin/surveys/export/route.ts)
 * の両方から参照する単一のソース。アンケート項目が変わった場合はここだけ更新すればよい。
 *
 * surveyAnswersはJsonカラムのため、過去のアンケート改定前の回答(旧キー)が混在していても
 * 表示・エクスポートから漏れないよう、未知のキーもラベルなしでそのまま出す設計にしている。
 */
export const SURVEY_LABELS: Record<string, string> = {
  satisfaction: "満足度",
  companions: "同行者",
  companionsOther: "同行者(その他)",
  ageGroup: "年代",
  mainReason: "利用した一番の理由",
  mainReasonOther: "利用理由(その他)",
  decisionSpeed: "利用を決めるまでの検討度合い",
  priceFeeling: "料金についての感想",
  reuseIntent: "また利用したいか",
  desiredLocations: "今後Camlyがあったら利用したい場所",
  desiredLocationsOther: "利用したい場所(その他)",
  venueAttractiveness: "施設選びへの影響度",
  desiredCameraTypes: "借りてみたいカメラの種類",
  desiredCameraModel: "具体的な機種名",
  npsScore: "友人・家族への推奨度(0-10)",
  comments: "良かった点・改善してほしい点",
  // 過去のアンケート改定前の項目(互換表示用)
  scene: "利用シーン(旧項目)",
  discoveryChannel: "認知経路(旧項目)",
  visitorType: "来訪目的(旧項目)",
  wantedLocations: "希望設置場所(旧項目)",
};

export const SURVEY_KEY_ORDER = [
  "satisfaction",
  "companions",
  "companionsOther",
  "ageGroup",
  "mainReason",
  "mainReasonOther",
  "decisionSpeed",
  "priceFeeling",
  "reuseIntent",
  "desiredLocations",
  "desiredLocationsOther",
  "venueAttractiveness",
  "desiredCameraTypes",
  "desiredCameraModel",
  "npsScore",
  "comments",
];

/** 実際に出現したキー集合を、既知の項目順→未知のキー(アルファベット順)の順に並べる。 */
export function orderSurveyKeys(allKeys: Set<string>): string[] {
  const known = SURVEY_KEY_ORDER.filter((k) => allKeys.has(k));
  const rest = [...allKeys].filter((k) => !SURVEY_KEY_ORDER.includes(k)).sort();
  return [...known, ...rest];
}

export function formatSurveyValue(v: unknown): string {
  if (v == null || v === "") return "";
  if (Array.isArray(v)) return v.join("、");
  return String(v);
}

export function isNonEmptySurveyAnswers(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length > 0;
}
