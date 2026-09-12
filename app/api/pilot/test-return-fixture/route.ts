/**
 * TEMPORARY TEST-ONLY ROUTE — Stripeを一切経由せず、返却フロー(/app/rentals/[token]/return)を
 * 画面上で確認するためだけにRentalをRENTED状態で直接作成する。
 *
 * 本番(camly-plum.vercel.app)は別実装(legacy/vercel-functions-v0)が動いているため、この
 * ルートが本番に影響することはない。念のためVERCEL_ENV===production では常に403にしている。
 *
 * このファイルは動作確認後にrevertする前提の一時的なコード(通常の機能追加ではない)。
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRentalToken } from "@/lib/ids";

const TEST_SECRET = "bSJ_hd5bb5D_M5bV7ZeoFeQkGXBkRoe-";

function checkAuth(req: NextRequest) {
  if (process.env.VERCEL_ENV === "production") return false;
  return req.headers.get("x-test-secret") === TEST_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const boxPublicId = req.nextUrl.searchParams.get("boxPublicId") ?? "box_pub_3e9d7b";
  const box = await prisma.box.findUnique({
    where: { publicId: boxPublicId },
    include: { compartments: true },
  });
  if (!box) return NextResponse.json({ error: "box not found" }, { status: 404 });
  const activeRental = await prisma.rental.findFirst({
    where: { checkoutCompartmentId: { in: box.compartments.map((c) => c.id) }, status: { in: ["RENTED", "OVERDUE"] } },
  });
  return NextResponse.json({
    boxId: box.id,
    locationId: box.locationId,
    isActive: box.isActive,
    compartments: box.compartments,
    activeRental,
  });
}

/** 過去のテストで解放し忘れたcompartment/deviceを、アクティブなRentalが無いことを確認した上でAVAILABLEへ戻す。 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const compartmentId: string | undefined = body.compartmentId;
  if (!compartmentId) return NextResponse.json({ error: "compartmentId is required" }, { status: 400 });

  const activeRental = await prisma.rental.findFirst({
    where: { checkoutCompartmentId: compartmentId, status: { in: ["RENTED", "OVERDUE"] } },
  });
  if (activeRental) {
    return NextResponse.json({ error: "active rental exists, refusing to reset", rentalId: activeRental.id }, { status: 409 });
  }

  const compartment = await prisma.compartment.findUnique({ where: { id: compartmentId } });
  if (!compartment) return NextResponse.json({ error: "compartment not found" }, { status: 404 });

  await prisma.compartment.update({ where: { id: compartmentId }, data: { status: "AVAILABLE" } });
  if (compartment.currentDeviceId) {
    await prisma.device.update({ where: { id: compartment.currentDeviceId }, data: { status: "AVAILABLE" } });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const boxPublicId: string = body.boxPublicId ?? "box_pub_3e9d7b";

  const box = await prisma.box.findUnique({
    where: { publicId: boxPublicId },
    include: { compartments: true },
  });
  if (!box) return NextResponse.json({ error: "box not found" }, { status: 404 });

  const compartment = box.compartments.find((c) => c.status === "AVAILABLE" && c.currentDeviceId);
  if (!compartment || !compartment.currentDeviceId) {
    return NextResponse.json({ error: "no available compartment/device on this box" }, { status: 409 });
  }

  const pricingRule = await prisma.pricingRule.findFirst({
    where: { OR: [{ locationId: box.locationId }, { locationId: null }], isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!pricingRule) return NextResponse.json({ error: "no active pricing rule" }, { status: 500 });

  const pricingVersion = await prisma.pricingVersion.findFirst({
    where: { pricingRuleId: pricingRule.id, effectiveTo: null },
    orderBy: { version: "desc" },
  });
  if (!pricingVersion) return NextResponse.json({ error: "no active pricing version" }, { status: 500 });

  const customer = await prisma.customer.create({
    data: {
      name: "テスト太郎(返却UI確認用)",
      email: `test-return-${Date.now()}@example.invalid`,
      phone: "00000000000",
    },
  });

  const now = new Date();
  const rental = await prisma.$transaction(async (tx) => {
    const created = await tx.rental.create({
      data: {
        token: generateRentalToken(),
        status: "RENTED",
        customerId: customer.id,
        deviceId: compartment.currentDeviceId!,
        checkoutCompartmentId: compartment.id,
        pricingVersionId: pricingVersion.id,
        consentVersionIds: [],
        heldAt: now,
        paymentAuthorizedAt: now,
        unlockRequestedAt: now,
        doorOpenedAt: now,
        rentalStartedAt: now,
      },
    });
    await tx.compartment.update({ where: { id: compartment.id }, data: { status: "OCCUPIED" } });
    await tx.device.update({ where: { id: compartment.currentDeviceId! }, data: { status: "RENTED" } });
    return created;
  });

  const appUrl = req.nextUrl.origin;
  return NextResponse.json({
    rentalId: rental.id,
    token: rental.token,
    returnEntryUrl: `${appUrl}/pilot/box/${boxPublicId}/return`,
    returnDirectUrl: `${appUrl}/app/rentals/${rental.token}/return`,
  });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rentalId = req.nextUrl.searchParams.get("rentalId");
  if (!rentalId) return NextResponse.json({ error: "rentalId is required" }, { status: 400 });

  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental) return NextResponse.json({ error: "rental not found" }, { status: 404 });

  await prisma.mediaAsset.deleteMany({ where: { rentalId } });
  await prisma.returnInspection.deleteMany({ where: { rentalId } });
  await prisma.rentalEvent.deleteMany({ where: { rentalId } });
  await prisma.payment.deleteMany({ where: { rentalId } });
  await prisma.damageCase.deleteMany({ where: { rentalId } });

  await prisma.compartment.update({ where: { id: rental.checkoutCompartmentId }, data: { status: "AVAILABLE" } });
  await prisma.device.update({ where: { id: rental.deviceId }, data: { status: "AVAILABLE" } });

  await prisma.rental.delete({ where: { id: rentalId } });
  if (rental.customerId) {
    await prisma.customer.delete({ where: { id: rental.customerId } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
