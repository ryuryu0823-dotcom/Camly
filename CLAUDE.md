# Camly — 引き継ぎメモ (Claude Code用)

このファイルはClaude Codeがこのリポジトリで作業を始める際に自動で読み込む。前回(Cowork/クラウドセッション)の続きをここに引き継ぐ。

## プロジェクト概要

Camlyは無人カメラレンタルサービス。`Camly_Claude_Master_Handoff_v2.md`が最上位仕様。
本番は現在 `camly-plum.vercel.app` (nasu room MINI設置) で稼働中、**Stripeはlive mode(実運用中)**。

**重要: 本番(`main`ブランチ、production Vercel)には絶対に触れないこと。** 今作業しているのは
`feature/camly-v2-foundation` ブランチで、GitHub上にPR #1として提出済み・未マージ
(https://github.com/ryuryu0823-dotcom/Camly/pull/1)。

## 現在の状態

- リポジトリ: `~/Downloads/Camly-work` (このフォルダ)
- ブランチ: `feature/camly-v2-foundation`、origin/同ブランチと同期済み(最新コミット `212724f`)
- `npm install` 済み、PostgreSQL(Homebrew, postgresql@16)インストール・起動済み
- DB: `camly_dev` に3つのマイグレーション(0001_init, 0002_box_unlock_code, 0003_unlock_code_reveal)を適用済み、`prisma/seed.sql`でシード投入済み
- `.env.local` 作成済み(gitignore対象、リポジトリには含まれない)。Stripeは **test mode** キーを設定済み

## 今まさに詰まっている問題

`npm run dev` でアプリ自体は起動し、ブラウザで `http://localhost:3000/pilot/box/box_pub_3e9d7b` を開くとLPやフォームは正常に表示される。しかし、Prismaを使うAPI route (`app/api/consent-versions/current/route.ts`) を呼ぶと必ず以下のエラーになる:

```
PrismaClientInitializationError:
Invalid `prisma.consentVersion.findFirst()` invocation:

User `` was denied access on the database `camly_dev.public`
```

**切り分け済みの事実:**
1. `psql "postgresql://inoueryuunosuke:camlydev@localhost:5432/camly_dev" -c "SELECT 1;"` は **成功する**(DB自体・認証情報・pg_hba.confは正常)。
2. `pg_hba.conf` は host接続(127.0.0.1/32, ::1/128)含めすべて `trust`。
3. ポート5432・3000とも重複プロセスなし(単一のPostgres、単一のnext-server)。
4. `.env.local` の `DATABASE_URL` は `postgresql://inoueryuunosuke:camlydev@localhost:5432/camly_dev` で正しく設定されている。
5. `sed`でDATABASE_URLを更新→`npm run dev`を完全に再起動(Ctrl+C→再実行)した後も **同じエラーが再現する**。
6. エラーメッセージの `User `` `(ユーザー名が空)` は、Prisma側の表示バグの可能性がある(実際の認証情報とは無関係かもしれない)。

**次にやるべきこと(未実施):**
このリポジトリ直下に `test-db.js` という診断用スクリプトを置いてある。Next.jsを経由せず、Prisma Client単体で同じクエリを実行して問題を切り分ける意図で作成した。

```bash
node test-db.js
```

これを実行し、出力される `DATABASE_URL env seen by node:` の行と、その後のフルエラーオブジェクトを確認すること。ここから、
- Prisma Clientが本当に正しいDATABASE_URLを見ているか
- Prismaのクエリエンジンバイナリが正常にダウンロード・実行できているか(ネットワーク制限された環境でnpm installした形跡はないので、通常は問題ないはず)
- pg_hba.confのtrust設定と実際のPrisma接続の間で何かプロトコルレベルの不一致がないか

を確認し、原因を特定して修正すること。

## 目標

まず`npm run dev`でこのアプリがローカルで一通り動く(貸出フロー入口→Stripe Checkout test modeへの遷移まで)ことを確認する。それができたら、次はVercelのプレビュー環境へのデプロイ、Stripe test modeでのE2E確認へ進む予定。

## 参考ドキュメント

- `docs/GAP_ANALYSIS_AND_MIGRATION_PLAN.md` — 監査結果・移行計画
- `LAUNCH_BLOCKERS.md` — 本番公開前に必須の未決事項一覧(法務・Stripe・OEM/ODM・設置先など)
- `docs/MORNING_REPORT_2026-08-20.md` — 前回セッションの実装サマリー
- `README.md` — セットアップ手順、実装済み/未実装の一覧

## 環境情報

- macOS、Node v20.14.0 (Homebrew管理外、既存インストール)
- Homebrew: `/usr/local` 配下 (Intel Mac想定のパス)
- PostgreSQL 16 (Homebrew, `brew services start postgresql@16`で起動)
- `gh` CLI認証済み(GitHub操作はこれで可能)
