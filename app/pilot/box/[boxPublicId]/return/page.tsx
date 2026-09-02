/**
 * Box設置場所に掲示する「返却用」QRの入口(§4, §10)。
 *
 * 返却フロー本体(/app/rentals/[token]/return)はRentalごとに推測困難なtokenを
 * 使うため、利用者はメール等でリンクを受け取らない限り自力でたどり着けない
 * (現状メール送信は未実装)。このページはBoxのpublicIdだけを知っていれば、
 * そのBoxで今まさにレンタル中(RENTED/OVERDUE)のRentalを解決して転送する。
 *
 * Phase A(1拠点1箱1台運用)を前提にした簡易実装。複数口が同時に稼働する
 * SMART_BOX運用に拡張する場合は、利用者本人確認(名前/電話下4桁等)を挟む必要がある。
 */
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BoxReturnEntryPage({ params }: { params: { boxPublicId: string } }) {
  const box = await prisma.box.findUnique({
    where: { publicId: params.boxPublicId },
    include: { compartments: true },
  });

  if (!box) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-camly-inkMuted text-sm">Boxが見つかりません。</p>
      </main>
    );
  }

  const compartmentIds = box.compartments.map((c) => c.id);
  const rental = await prisma.rental.findFirst({
    where: { checkoutCompartmentId: { in: compartmentIds }, status: { in: ["RENTED", "OVERDUE"] } },
    orderBy: { rentalStartedAt: "desc" },
  });

  if (!rental) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-camly-inkMuted text-sm">
          現在このBoxでレンタル中のご利用がありません。
          <br />
          お心当たりがない場合は係員までお問い合わせください。
        </p>
      </main>
    );
  }

  redirect(`/app/rentals/${rental.token}/return`);
}
