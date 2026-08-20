/**
 * Pricing engine
 *
 * Master Handoff v2 §7 準拠。
 * - 料金はDB設定可能(PricingVersion.tiers)とし、ハードコードしない。
 * - 事前に料金プランを選ばせず、返却成立時刻から自動確定する。
 * - 金額はブラウザから受け取らず、サーバーでこの関数を使って再計算する(§8.1)。
 *
 * 外部パッケージに依存しない純粋関数として実装し、node --test で直接実行検証できるようにしている
 * (このセッションはnpmレジストリへアクセスできないため、フレームワーク非依存ロジックはここに集約する)。
 */

export interface PricingTier {
  /** この分数以内なら priceJpy を適用する(累積・24時間以内の階段料金) */
  untilMinutes: number;
  priceJpy: number;
}

export interface PricingVersionInput {
  tiers: PricingTier[];
  /** 24時間(1440分)を超えた分、24時間ごとに加算する円 */
  additionalPer24hJpy: number;
}

export interface CarePlanInput {
  priceJpy: number;
}

export interface PriceBreakdownLine {
  label: string;
  amountJpy: number;
}

export interface PriceCalculationResult {
  totalJpy: number;
  usageJpy: number;
  careJpy: number;
  durationMinutes: number;
  breakdown: PriceBreakdownLine[];
  appliedTierLabel: string;
}

export class PricingError extends Error {}

/**
 * 利用時間(分)から利用料を計算する。
 * tiersは untilMinutes昇順であることを前提とする(呼び出し前に検証する)。
 */
export function calculateUsagePrice(
  durationMinutes: number,
  version: PricingVersionInput
): { amountJpy: number; label: string; breakdown: PriceBreakdownLine[] } {
  if (durationMinutes < 0) {
    throw new PricingError("durationMinutes must be >= 0");
  }
  if (version.tiers.length === 0) {
    throw new PricingError("PricingVersion.tiers must not be empty");
  }

  // 管理画面から設定されるデータが不正(順序違反)な場合は、黙って直さずエラーにする。
  // 静かにソートして受理すると、意図しないTier適用に気づけないため。
  for (let i = 1; i < version.tiers.length; i++) {
    if (version.tiers[i].untilMinutes <= version.tiers[i - 1].untilMinutes) {
      throw new PricingError("tiers must be provided in strictly increasing untilMinutes order");
    }
  }
  const sorted = version.tiers;

  const lastTier = sorted[sorted.length - 1];
  const within24h = durationMinutes <= 1440;

  if (within24h) {
    for (const tier of sorted) {
      if (durationMinutes <= tier.untilMinutes) {
        return {
          amountJpy: tier.priceJpy,
          label: `<= ${tier.untilMinutes}min`,
          breakdown: [{ label: `usage tier <= ${tier.untilMinutes}min`, amountJpy: tier.priceJpy }],
        };
      }
    }
    // durationMinutesが最終tierを超えているがwithin24h=trueの場合(tiersが24hをカバーしていない設定ミス)
    return {
      amountJpy: lastTier.priceJpy,
      label: `<= ${lastTier.untilMinutes}min (fallback)`,
      breakdown: [{ label: `usage tier fallback <= ${lastTier.untilMinutes}min`, amountJpy: lastTier.priceJpy }],
    };
  }

  // 24時間超: 24時間ごとに additionalPer24hJpy を加算 (§7)
  const base24hPriceJpy = (() => {
    for (const tier of sorted) {
      if (1440 <= tier.untilMinutes) return tier.priceJpy;
    }
    return lastTier.priceJpy;
  })();

  const extraMinutes = durationMinutes - 1440;
  const extraDays = Math.ceil(extraMinutes / 1440); // 24時間ごとに切り上げ加算
  const extraJpy = extraDays * version.additionalPer24hJpy;

  return {
    amountJpy: base24hPriceJpy + extraJpy,
    label: `24h base + ${extraDays}x additional24h`,
    breakdown: [
      { label: "24h base", amountJpy: base24hPriceJpy },
      { label: `additional 24h x${extraDays}`, amountJpy: extraJpy },
    ],
  };
}

export function calculateTotalPrice(
  durationMinutes: number,
  version: PricingVersionInput,
  carePlan: CarePlanInput | null
): PriceCalculationResult {
  const usage = calculateUsagePrice(durationMinutes, version);
  const careJpy = carePlan?.priceJpy ?? 0;
  const breakdown = [...usage.breakdown];
  if (careJpy > 0) {
    breakdown.push({ label: "Camly Care", amountJpy: careJpy });
  }
  return {
    totalJpy: usage.amountJpy + careJpy,
    usageJpy: usage.amountJpy,
    careJpy,
    durationMinutes,
    breakdown,
    appliedTierLabel: usage.label,
  };
}

/** 分単位の利用時間を計算する(貸出開始時刻→返却申請時刻)。切り上げ。 */
export function computeDurationMinutes(rentalStartedAt: Date, returnRequestedAt: Date): number {
  const ms = returnRequestedAt.getTime() - rentalStartedAt.getTime();
  if (ms < 0) throw new PricingError("returnRequestedAt must be after rentalStartedAt");
  return Math.ceil(ms / 60000);
}
