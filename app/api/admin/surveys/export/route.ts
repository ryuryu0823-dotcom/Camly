/**
 * GET /api/admin/surveys/export
 * 返却アンケートの全回答をCSVとしてダウンロードする。
 * Excelでの文字化けを避けるため、UTF-8 BOM付きで返す。
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderSurveyKeys, formatSurveyValue, isNonEmptySurveyAnswers, SURVEY_LABELS } from "@/lib/survey-labels";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
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

  const header = ["回答日時", "拠点", "利用者名", "メールアドレス", ...keys.map((k) => SURVEY_LABELS[k] ?? k)];
  const rows: string[][] = [header];

  for (const r of responses) {
    const answers = r.surveyAnswers as Record<string, unknown>;
    rows.push([
      r.createdAt.toISOString(),
      r.rental.checkoutCompartment.box.location.name,
      r.rental.customer?.name ?? "",
      r.rental.customer?.email ?? "",
      ...keys.map((k) => formatSurveyValue(answers[k])),
    ]);
  }

  const csvBody = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\r\n");
  const csv = "﻿" + csvBody;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="camly-survey-responses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
