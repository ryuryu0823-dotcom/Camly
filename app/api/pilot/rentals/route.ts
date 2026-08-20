/**
 * POST /api/pilot/rentals
 *
 * Phase A貸出フロー(§6)の開始点。
 * - box publicIdから拠点/Boxを解決する。
 * - AVAILABLEなCompartment+Deviceをトランザクション内でRESERVEDにし、二重貸出を防ぐ
 *   (compartments.currentDeviceId のUNIQUE制約が最終防衛線。§14で検証済み)。
 * - 金額はここでは確定しない。決済(Stripe Checkout Session mode=setup)でカードを保存し、
 *   webhook/checkout-completeで¥50,000オーソリを作成してから状態を進める(§8.1)。
 * - 同意versionを保存する(§6 step5)。
 *
 * 注意: このファイルは @prisma/client 等npm依存パッケージを前提としており、
 * npm installできないこのサンドボックスでは実行できない(README参照)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRentalToken } from "@/lib/ids";
import { writeRentalEvent, writeAuditLog } from "@/lib/audit";
import { assertValidTransition } from "@/lib/state-machine/rental";
import { createSetupCheckoutSession } from "@/lib/stripe/client";

interface CreateRentalBody {
  boxPublicId: string;
  name: string;
  email: string;
  phone: string;
  stayReservationName?: string;
  carePlanId?: string;
  consentVersionIds: string[]; // terms/care/privacyのConsentVersion.id
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateRentalBody;

  if (!body.boxPublicId || !body.name || !body.email || !body.phone) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }
  if (!body.consentVersionIds || body.consentVersionIds.length === 0) {
    return NextResponse.json({ error: "consent is required" }, { status: 400 });
  }

  const box = await prisma.box.findUnique({
    where: { publicId: body.boxPublicId },
    include: { location: true },
  });
  if (!box || !box.isActive) {
    return NextResponse.json({ error: "box not found or inactive" }, { status: 404 });
  }

  // 有効なPricingVersionを解決する(拠点別、なければ全拠点共通)。
  const pricingRule = await prisma.pricingRule.findFirst({
    where: { OR: [{ locationId: box.locationId }, { locationId: null }], isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!pricingRule) {
    return NextResponse.json({ error: "no active pricing rule for this location" }, { status: 500 });
  }
  const pricingVersion = await prisma.pricingVersion.findFirst({
    where: { pricingRuleId: pricingRule.id, effectiveTo: null },
    orderBy: { version: "desc" },
  });
  if (!pricingVersion) {
    return NextResponse.json({ error: "no active pricing version" }, { status: 500 });
  }

  // Stripe設定が無い状態でcompartmentを予約してしまうと解放漏れの元になるため、先にチェックする。
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  try {
    const rental = await prisma.$transaction(async (tx) => {
      // AVAILABLEな compartment+device を1件だけロックして確保する。
      // row lockはPrismaの$queryRaw + FOR UPDATEで実現する(Prisma標準APIにはSELECT FOR UPDATEが無いため)。
      const available: { id: string; currentDeviceId: string | null }[] = await tx.$queryRaw`
        SELECT id, "currentDeviceId" FROM compartments
        WHERE "boxId" = ${box.id} AND status = 'AVAILABLE' AND "currentDeviceId" IS NOT NULL
        ORDER BY index ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      if (available.length === 0) {
        throw new Error("NO_AVAILABLE_COMPARTMENT");
      }
      const compartment = available[0];
      const deviceId = compartment.currentDeviceId!;

      await tx.compartment.update({
        where: { id: compartment.id },
        data: { status: "RESERVED" },
      });
      await tx.device.update({ where: { id: deviceId }, data: { status: "RENTED" } });

      const customer = await tx.customer.upsert({
        where: { email: body.email },
        update: { name: body.name, phone: body.phone },
        create: { name: body.name, email: body.email, phone: body.phone },
      });

      const rental = await tx.rental.create({
        data: {
          token: generateRentalToken(),
          status: "HELD",
          customerId: customer.id,
          stayReservationName: body.stayReservationName,
          deviceId,
          checkoutCompartmentId: compartment.id,
          pricingVersionId: pricingVersion.id,
          carePlanId: body.carePlanId,
          consentVersionIds: body.consentVersionIds,
          heldAt: new Date(),
        },
      });

      assertValidTransition("AVAILABLE", "HELD");
      await writeRentalEvent({
        rentalId: rental.id,
        fromStatus: "AVAILABLE",
        toStatus: "HELD",
        actor: "customer",
        reason: "rental_initiated",
      });
      await writeAuditLog({
        actorType: "customer",
        action: "rental.create",
        targetType: "rental",
        targetId: rental.id,
        metadata: { boxPublicId: body.boxPublicId },
      });

      return rental;
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Stripe呼び出しはDBトランザクションの外(fetchをtx内で行うとコネクションを長時間ロックするため)。
    // 失敗した場合は、確保済みのcompartment/deviceを明示的に解放する補償処理を行う(解放漏れ防止)。
    try {
      const session = await createSetupCheckoutSession(
        { secretKey: stripeSecretKey },
        {
          rentalId: rental.id,
          successUrl: `${appUrl}/api/pilot/rentals/${rental.id}/checkout-complete?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/pilot/box/${body.boxPublicId}`,
          customerEmail: body.email,
        }
      );
      return NextResponse.json({ rentalId: rental.id, token: rental.token, checkoutUrl: session.url });
    } catch (stripeErr) {
      await releaseReservation(rental.id, "stripe_checkout_session_creation_failed");
      console.error("stripe checkout session creation failed, reservation released", stripeErr);
      return NextResponse.json({ error: "payment session creation failed" }, { status: 502 });
    }
  } catch (err: any) {
    if (err?.message === "NO_AVAILABLE_COMPARTMENT") {
      return NextResponse.json({ error: "no camera currently available at this box" }, { status: 409 });
    }
    console.error("rental creation failed", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

/** HELD状態のRentalを補償的にキャンセルし、compartment/deviceをAVAILABLEへ戻す。 */
async function releaseReservation(rentalId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({ where: { id: rentalId } });
    if (!rental || rental.status !== "HELD") return; // 既に先へ進んでいたら触らない
    assertValidTransition("HELD", "CANCELED");
    await tx.rental.update({ where: { id: rentalId }, data: { status: "CANCELED" } });
    await tx.compartment.update({ where: { id: rental.checkoutCompartmentId }, data: { status: "AVAILABLE" } });
    await tx.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });
  });
  await writeRentalEvent({ rentalId, fromStatus: "HELD", toStatus: "CANCELED", actor: "system", reason });
  await writeAuditLog({ actorType: "system", action: "rental.auto_cancel", targetType: "rental", targetId: rentalId, reasonText: reason });
}
