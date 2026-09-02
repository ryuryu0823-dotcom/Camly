-- Camly initial schema
-- Master Handoff v2 §14 準拠。時刻はUTC(timestamptz)保存、金額は整数円。
-- このファイルは prisma/schema.prisma と同期させること。
-- (npm registryにアクセスできない検証環境のため、`prisma migrate dev` の代わりに
--  生SQLとして作成し、ローカルPostgresに直接適用してテストしている。)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPS', 'SUPPORT', 'READ_ONLY');
CREATE TYPE "BoxMode" AS ENUM ('PILOT_PHYSICAL_LOCK', 'SMART_BOX');
CREATE TYPE "CompartmentStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'OUT_OF_SERVICE');
CREATE TYPE "DeviceTier" AS ENUM ('STANDARD', 'PREMIUM', 'PRO_SIGNATURE');
CREATE TYPE "DeviceStatus" AS ENUM ('AVAILABLE', 'RENTED', 'RETURN_PENDING', 'MAINTENANCE', 'RETIRED');
CREATE TYPE "CarePlanTier" AS ENUM ('NONE', 'STANDARD', 'PREMIUM', 'PRO');
CREATE TYPE "RentalStatus" AS ENUM (
  'AVAILABLE','HELD','PAYMENT_AUTHORIZED','UNLOCK_REQUESTED','DOOR_OPEN','RENTED',
  'RETURN_VIDEO_PENDING','AI_REVIEW','RETURN_DOOR_OPEN','CHARGE_REQUIRED',
  'RETURNED_PENDING_REVIEW','COMPLETED',
  'PAYMENT_FAILED','AUTH_EXPIRES_SOON','OVERDUE','AI_REVIEW_REQUIRED','DAMAGE_REVIEW',
  'BOX_OFFLINE','DOOR_JAMMED','CHARGER_NOT_CONNECTED','REFUND_REQUIRED','CANCELED'
);
CREATE TYPE "PaymentEventType" AS ENUM ('AUTHORIZED','PARTIAL_CAPTURED','FULL_CAPTURED','CANCELED','REFUNDED','ADDITIONAL_CHARGE','FAILED');
CREATE TYPE "AiReviewResult" AS ENUM ('PASS','RETAKE','HUMAN_REVIEW');
CREATE TYPE "MediaAssetKind" AS ENUM ('RETURN_VIDEO','RETURN_PHOTO','DAMAGE_EVIDENCE');
CREATE TYPE "DamageCaseStatus" AS ENUM ('REPORTED','EVIDENCE_REVIEW','ESTIMATE_PENDING','CUSTOMER_NOTIFIED','DISPUTED','ADMIN_APPROVED','CHARGED','CLOSED_NO_CHARGE');
CREATE TYPE "BoxCommandType" AS ENUM ('UNLOCK','LOCK','STATUS_REQUEST','REBOOT','OTA_UPDATE');
CREATE TYPE "BoxCommandStatus" AS ENUM ('PENDING','SENT','ACKNOWLEDGED','SUCCEEDED','FAILED','EXPIRED');
CREATE TYPE "BoxEventType" AS ENUM ('HEARTBEAT','DOOR_OPENED','DOOR_CLOSED','LOCK_STATE_CHANGED','CHARGER_CONNECTED','CHARGING_STARTED','CHARGING_STOPPED','TAMPER_DETECTED','TEMPERATURE_ALERT','COMMAND_RESULT','POWER_RESTORED');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE "admin_users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "customers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "stripeCustomerId" TEXT UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "customers_email_idx" ON "customers" ("email");
CREATE INDEX "customers_phone_idx" ON "customers" ("phone");

CREATE TABLE "locations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "publicId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "nameEn" TEXT,
  "slug" TEXT NOT NULL UNIQUE,
  "address" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "heroImageUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "boxes" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "publicId" TEXT NOT NULL UNIQUE,
  "locationId" TEXT NOT NULL REFERENCES "locations"("id"),
  "label" TEXT NOT NULL,
  "mode" "BoxMode" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastHeartbeatAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "box_capabilities" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "boxId" TEXT NOT NULL REFERENCES "boxes"("id"),
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("boxId", "key")
);

CREATE TABLE "devices" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "serial" TEXT NOT NULL UNIQUE,
  "model" TEXT NOT NULL,
  "tier" "DeviceTier" NOT NULL,
  "status" "DeviceStatus" NOT NULL DEFAULT 'AVAILABLE',
  "purchasedAt" TIMESTAMPTZ,
  "purchasePriceJpy" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "compartments" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "publicId" TEXT NOT NULL UNIQUE,
  "boxId" TEXT NOT NULL REFERENCES "boxes"("id"),
  "index" INTEGER NOT NULL,
  "status" "CompartmentStatus" NOT NULL DEFAULT 'AVAILABLE',
  "currentDeviceId" TEXT UNIQUE REFERENCES "devices"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("boxId", "index")
);

CREATE TABLE "device_assignment_history" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "deviceId" TEXT NOT NULL REFERENCES "devices"("id"),
  "boxId" TEXT,
  "compartmentId" TEXT,
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "unassignedAt" TIMESTAMPTZ,
  "reason" TEXT
);

CREATE TABLE "accessory_checklists" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "deviceId" TEXT NOT NULL UNIQUE REFERENCES "devices"("id"),
  "items" JSONB NOT NULL
);

CREATE TABLE "pricing_rules" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "locationId" TEXT REFERENCES "locations"("id"),
  "tier" "DeviceTier" NOT NULL,
  "name" TEXT NOT NULL,
  "isStayRule" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "pricing_versions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "pricingRuleId" TEXT NOT NULL REFERENCES "pricing_rules"("id"),
  "version" INTEGER NOT NULL,
  "effectiveFrom" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "effectiveTo" TIMESTAMPTZ,
  "tiers" JSONB NOT NULL,
  "additionalPer24hJpy" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "createdBy" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("pricingRuleId", "version")
);

CREATE TABLE "care_plans" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tier" "CarePlanTier" NOT NULL,
  "priceJpy" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "consent_versions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kind" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "bodyUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("kind", "version")
);

CREATE TABLE "rentals" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "token" TEXT NOT NULL UNIQUE,
  "status" "RentalStatus" NOT NULL DEFAULT 'AVAILABLE',
  "customerId" TEXT REFERENCES "customers"("id"),
  "stayReservationName" TEXT,
  "deviceId" TEXT NOT NULL REFERENCES "devices"("id"),
  "checkoutCompartmentId" TEXT NOT NULL REFERENCES "compartments"("id"),
  "returnCompartmentId" TEXT REFERENCES "compartments"("id"),
  "pricingVersionId" TEXT NOT NULL REFERENCES "pricing_versions"("id"),
  "carePlanId" TEXT REFERENCES "care_plans"("id"),
  "consentVersionIds" TEXT[] NOT NULL DEFAULT '{}',
  "paymentIntentId" TEXT UNIQUE,
  "authorizedAmountJpy" INTEGER,
  "captureBefore" TIMESTAMPTZ,
  "heldAt" TIMESTAMPTZ,
  "paymentAuthorizedAt" TIMESTAMPTZ,
  "unlockRequestedAt" TIMESTAMPTZ,
  "doorOpenedAt" TIMESTAMPTZ,
  "rentalStartedAt" TIMESTAMPTZ,
  "returnRequestedAt" TIMESTAMPTZ,
  "returnCompletedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "finalAmountJpy" INTEGER,
  "finalAmountBreakdown" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "rentals_status_idx" ON "rentals" ("status");

-- Rental <-> ConsentVersion 多対多
CREATE TABLE "_rental_consent_versions" (
  "rentalId" TEXT NOT NULL REFERENCES "rentals"("id"),
  "consentVersionId" TEXT NOT NULL REFERENCES "consent_versions"("id"),
  PRIMARY KEY ("rentalId", "consentVersionId")
);

CREATE TABLE "rental_events" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rentalId" TEXT NOT NULL REFERENCES "rentals"("id"),
  "fromStatus" "RentalStatus",
  "toStatus" "RentalStatus" NOT NULL,
  "reason" TEXT,
  "actor" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "rental_events_rentalId_idx" ON "rental_events" ("rentalId");

CREATE TABLE "payments" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rentalId" TEXT NOT NULL REFERENCES "rentals"("id"),
  "stripePaymentIntentId" TEXT NOT NULL,
  "eventType" "PaymentEventType" NOT NULL,
  "amountJpy" INTEGER NOT NULL,
  "stripeEventId" TEXT UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "payments_rentalId_idx" ON "payments" ("rentalId");

CREATE TABLE "return_inspections" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rentalId" TEXT NOT NULL UNIQUE REFERENCES "rentals"("id"),
  "videoAssetId" TEXT,
  "photoAssetId" TEXT,
  "aiResult" "AiReviewResult",
  "aiNotes" TEXT,
  "checklist" JSONB NOT NULL,
  "doorClosed" BOOLEAN NOT NULL DEFAULT false,
  "chargerConnected" BOOLEAN NOT NULL DEFAULT false,
  "surveyAnswers" JSONB,
  "reviewedByAdminId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "media_assets" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rentalId" TEXT NOT NULL REFERENCES "rentals"("id"),
  "kind" "MediaAssetKind" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER,
  "retainUntil" TIMESTAMPTZ NOT NULL,
  "legalHold" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "media_assets_rentalId_idx" ON "media_assets" ("rentalId");

CREATE TABLE "damage_cases" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "rentalId" TEXT NOT NULL REFERENCES "rentals"("id"),
  "status" "DamageCaseStatus" NOT NULL DEFAULT 'REPORTED',
  "reportedBy" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "estimateJpy" INTEGER,
  "customerResponse" TEXT,
  "approvedByAdminId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "damage_cases_rentalId_idx" ON "damage_cases" ("rentalId");

CREATE TABLE "box_commands" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "boxId" TEXT NOT NULL REFERENCES "boxes"("id"),
  "compartmentId" TEXT,
  "type" "BoxCommandType" NOT NULL,
  "status" "BoxCommandStatus" NOT NULL DEFAULT 'PENDING',
  "nonce" TEXT NOT NULL UNIQUE,
  "signature" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "issuedByAdminId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resultAt" TIMESTAMPTZ,
  "resultPayload" JSONB
);
CREATE INDEX "box_commands_boxId_idx" ON "box_commands" ("boxId");

CREATE TABLE "box_events" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "boxId" TEXT NOT NULL REFERENCES "boxes"("id"),
  "compartmentId" TEXT,
  "eventType" "BoxEventType" NOT NULL,
  "eventId" TEXT NOT NULL UNIQUE,
  "deviceTimestamp" TIMESTAMPTZ NOT NULL,
  "firmwareVersion" TEXT,
  "sequenceNumber" INTEGER NOT NULL,
  "payload" JSONB,
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "box_events_boxId_sequenceNumber_idx" ON "box_events" ("boxId", "sequenceNumber");

CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT REFERENCES "admin_users"("id"),
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "reasonText" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" ("action");
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" ("targetType", "targetId");
