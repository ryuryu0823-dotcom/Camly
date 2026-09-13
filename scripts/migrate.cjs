#!/usr/bin/env node
/**
 * DBマイグレーション適用スクリプト(冪等)。
 *
 * これまでの `npm run db:migrate`(psql + 生SQLをfor文で全件流すだけ)は、
 * 既に適用済みのマイグレーションを再実行して "already exists" エラーで落ちる問題があった
 * (ローカルでは毎回手動で新規ファイルだけ選んで流すことで回避していた)。
 *
 * Vercelのビルド環境には psql が無いため、@prisma/client(既存依存)経由でSQLを実行し、
 * 適用済みかどうかを _camly_migrations テーブルで管理することで、
 * 「どの環境でも `node scripts/migrate.cjs` を打つだけで安全に最新化できる」ようにする。
 * ローカルでも `npm run db:migrate` はこのスクリプトを使う(psql依存を撤去)。
 */
const { PrismaClient } = require("@prisma/client");
const { readdirSync, readFileSync } = require("node:fs");
const path = require("node:path");

const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
const seedPath = path.join(__dirname, "..", "prisma", "seed.sql");

const prisma = new PrismaClient();

function splitStatements(sql) {
  // 全行コメント(-- ...)だけを取り除いてから;で分割する。
  // 行の先頭が--でなければコメント扱いしない(このリポジトリのSQLは全行コメントのみで
  // コード末尾への行内コメントは使っていない前提)。
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runSqlFile(filePath) {
  const sql = readFileSync(filePath, "utf8");
  for (const statement of splitStatements(sql)) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _camly_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const appliedRows = await prisma.$queryRawUnsafe(`SELECT name FROM _camly_migrations`);
  const applied = new Set(appliedRows.map((r) => r.name));

  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    if (applied.has(dir)) {
      console.log(`skip (already applied): ${dir}`);
      continue;
    }
    console.log(`applying: ${dir}`);
    await runSqlFile(path.join(migrationsDir, dir, "migration.sql"));
    await prisma.$executeRawUnsafe(`INSERT INTO _camly_migrations (name) VALUES ($1)`, dir);
  }

  const [{ count }] = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS count FROM locations`);
  if (count === 0) {
    console.log("seeding initial data (prisma/seed.sql)...");
    await runSqlFile(seedPath);
  } else {
    console.log(`seed skipped (locations already has ${count} row(s))`);
  }

  console.log("migrate done.");
}

main()
  .catch((err) => {
    console.error("migrate failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
