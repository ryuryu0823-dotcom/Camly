/**
 * Prisma Client singleton.
 * Next.jsのdev環境でのホットリロード時に複数コネクションが張られるのを防ぐ定番パターン。
 *
 * 注意: このファイルは @prisma/client(npm install必須)に依存する。
 * このリポジトリの一部のロジック(src/lib/pricing, src/lib/state-machine, src/lib/box, src/lib/stripe)は
 * あえてこのファイルに依存しない純粋関数として実装しており、npm installなしでも node --test 相当で検証できる。
 * DBアクセスを伴うAPI route層は、npm install後にのみ実行・型チェックできる。
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
