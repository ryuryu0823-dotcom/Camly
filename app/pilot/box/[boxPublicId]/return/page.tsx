/**
 * Box設置場所に掲示する「返却用」QRの入口(§4, §10)。
 *
 * 返却フロー本体(/app/rentals/[token]/return)はRentalごとに推測困難なtokenを
 * 使うため、利用者はメール等でリンクを受け取らない限り自力でたどり着けない
 * (現状メール送信は未実装)。このページはBoxのpublicIdだけを知っていれば、
 * そのBoxで今まさにレンタル中(RENTED/OVERDUE)のRentalを解決する。
 *
 * 即リダイレクトはせず、実際の使い方・利用イメージ写真(Instagram)への導線を
 * 一度見せてから返却フローへ進んでもらう(貸出側のintro画面と同じ狙い)。
 *
 * Phase A(1拠点1箱1台運用)を前提にした簡易実装。複数口が同時に稼働する
 * SMART_BOX運用に拡張する場合は、利用者本人確認(名前/電話下4桁等)を挟む必要がある。
 */
import { prisma } from "@/lib/db";
import InstagramBanner from "../../../../_components/InstagramBanner";

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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center gap-8">
        <p className="text-camly-inkMuted text-sm">
          現在このBoxでレンタル中のご利用がありません。
          <br />
          お心当たりがない場合は係員までお問い合わせください。
        </p>
        <div className="w-full max-w-xs">
          <InstagramBanner />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center gap-8">
      <div>
        <p className="text-camly-accent text-xs tracking-widest font-bold mb-3">返却の前に</p>
        <p className="text-camly-inkMuted text-sm leading-relaxed">
          使い方や実際の利用シーンは、
          <br />
          Instagramでも公開しています。
        </p>
      </div>
      <div className="w-full max-w-xs">
        <InstagramBanner />
      </div>
      <a
        href={`/app/rentals/${rental.token}/return`}
        className="w-full max-w-xs rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm"
      >
        返却手続きに進む
      </a>
    </main>
  );
}
