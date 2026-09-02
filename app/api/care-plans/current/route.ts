/**
 * GET /api/care-plans/current
 *
 * 貸出フロー入口(§6)で、有料のCareプラン(安心プラン)を提示するための情報を返す。
 * NONE(¥0)は明示的な選択肢として提示しないため除外する。
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const plan = await prisma.carePlan.findFirst({
    where: { tier: "STANDARD", isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!plan) {
    return NextResponse.json({ plan: null });
  }
  return NextResponse.json({
    plan: { id: plan.id, priceJpy: plan.priceJpy, liabilityCapJpy: plan.liabilityCapJpy },
  });
}
