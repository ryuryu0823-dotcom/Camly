/**
 * 返却アンケート回答一覧(管理画面)。
 * ReturnInspection.surveyAnswersを持つレンタルを新しい順に一覧表示する。
 * CSVエクスポートは /api/admin/surveys/export に委譲する。
 */
import { prisma } from "@/lib/db";
import { SURVEY_LABELS, orderSurveyKeys, formatSurveyValue, isNonEmptySurveyAnswers } from "@/lib/survey-labels";

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage() {
  const inspections = await prisma.returnInspection.findMany({
    include: {
      rental: {
        include: {
          customer: true,
          checkoutCompartment: { include: { box: { include: { location: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const responses = inspections.filter((i) => isNonEmptySurveyAnswers(i.surveyAnswers));

  const allKeys = new Set<string>();
  for (const r of responses) {
    Object.keys(r.surveyAnswers as Record<string, unknown>).forEach((k) => allKeys.add(k));
  }
  const keys = orderSurveyKeys(allKeys);

  return (
    <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">返却アンケート回答一覧</h1>
        <a
          href="/api/admin/surveys/export"
          className="rounded-full bg-camly-accent text-camly-black font-bold text-xs px-4 py-2.5"
        >
          CSVをダウンロード
        </a>
      </div>
      <p className="text-camly-inkMuted text-sm mb-8">
        回答数: {responses.length}件 / <a href="/admin" className="underline">貸出一覧に戻る</a>
      </p>

      {responses.length === 0 && (
        <p className="rounded-xl border border-camly-line px-4 py-8 text-center text-camly-inkMuted text-sm">
          まだ回答がありません
        </p>
      )}

      {/* スマホ: カードリスト(質問ごとの定義リスト形式) */}
      <div className="space-y-4 lg:hidden">
        {responses.map((r) => {
          const answers = r.surveyAnswers as Record<string, unknown>;
          return (
            <div key={r.id} className="rounded-xl border border-camly-line p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">{r.rental.checkoutCompartment.box.location.name}</span>
                <span className="text-xs text-camly-inkMuted">{r.createdAt.toISOString()}</span>
              </div>
              <p className="text-xs text-camly-inkMuted mb-3">{r.rental.customer?.name ?? "-"}</p>
              <dl className="space-y-2">
                {keys.map((k) => {
                  const value = formatSurveyValue(answers[k]);
                  if (!value) return null;
                  return (
                    <div key={k} className="text-xs">
                      <dt className="text-camly-inkMuted">{SURVEY_LABELS[k] ?? k}</dt>
                      <dd className="mt-0.5">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>

      {/* PC: テーブル(横スクロール) */}
      {responses.length > 0 && (
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-camly-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-camly-inkMuted border-b border-camly-line">
                <th className="px-3 py-3 whitespace-nowrap">回答日時</th>
                <th className="px-3 py-3 whitespace-nowrap">拠点</th>
                <th className="px-3 py-3 whitespace-nowrap">利用者</th>
                {keys.map((k) => (
                  <th key={k} className="px-3 py-3 whitespace-nowrap">
                    {SURVEY_LABELS[k] ?? k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => {
                const answers = r.surveyAnswers as Record<string, unknown>;
                return (
                  <tr key={r.id} className="border-b border-camly-line last:border-0 align-top">
                    <td className="px-3 py-3 whitespace-nowrap text-camly-inkMuted">{r.createdAt.toISOString()}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{r.rental.checkoutCompartment.box.location.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{r.rental.customer?.name ?? "-"}</td>
                    {keys.map((k) => (
                      <td key={k} className="px-3 py-3 max-w-[16rem]">
                        {formatSurveyValue(answers[k]) || "-"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
