-- customers.email はコード側(app/api/pilot/rentals/route.ts)で
-- prisma.customer.upsert({ where: { email } }) に使われており、
-- Prismaの仕様上ユニーク制約が無いとupsertが失敗する(PrismaClientValidationError)。
-- 既存の@@index([email])をUNIQUE制約に置き換える。

DROP INDEX IF EXISTS "customers_email_idx";
ALTER TABLE "customers" ADD CONSTRAINT "customers_email_key" UNIQUE ("email");
