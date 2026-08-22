# Camly

「撮りたい瞬間が生まれる場所」に設置する無人カメラレンタル。Master Handoff v2 (`Camly_Claude_Master_Handoff_v2.md`) を最上位仕様として実装している。

ブランドLP・検証サイト(Phase A)・将来の本番Webアプリ・管理画面を単一のNext.jsコードベースに持つ。市販ボックス実証(Phase A)とスマートボックス連携(Phase B)は `BoxProvider` interfaceで切り替える。

---

## 現状(2026-08-20時点)

このセッションはnpm/pipの外部レジストリへアクセスできないサンドボックス環境で作業したため、**`npm install`を伴うコマンド(`next dev`, `next build`, `prisma migrate` 等)はこのセッション内では未実行**。以下は実際に検証できた/できていないものの内訳。

### 実行して検証済み

- **DBスキーマ**: `prisma/migrations/*/migration.sql` をローカルPostgresに実際に適用し、23テーブル・制約(二重貸出防止のUNIQUE制約含む)を確認済み。
- **コアロジック(41+5件の自動テストが実際にpassしている)**:
  - `src/lib/pricing/engine.ts` — 料金計算(§7)
  - `src/lib/state-machine/rental.ts` — Rental状態遷移(§13)
  - `src/lib/box/*` — BoxCommand署名検証、Box Simulator(§12.5の全シナリオ)
  - `src/lib/stripe/webhook.ts` — Stripe Webhook署名検証(§8.1)
  - `src/lib/storage/s3-presign.ts` — S3互換ストレージの署名付きURL生成(§17)
  - `src/lib/i18n/*` — 日英辞書のキー整合性チェック(§16)

これらは `npm install` 不要(Node.js標準機能のみ)で `tsx --test tests/**/*.test.ts` により実行できる。

### コードは書いたが、このセッションでは未実行(npm install必須)

- Next.js App Routerのページ・API routes一式(`app/`)。`@prisma/client`, `next`等に依存するため、npm installできる環境(井上さんのローカル、またはVercelのビルド)で `npm install && npm run build` を実行して初めて検証できる。
- Stripeとの実際の通信(test mode APIキーが無いため、このセッションでは1件も実際のStripe APIを呼んでいない)。

---

## セットアップ

```bash
npm install
cp .env.example .env.local  # 値を埋める
npm run prisma:generate     # @prisma/client の型生成
npm run db:migrate          # prisma/migrations/*/migration.sql を順番に適用(冪等)。
                             # 初回はシードデータ(prisma/seed.sql)も自動投入される(scripts/migrate.cjs)
npm run dev
```

### テスト

```bash
npm run test        # tsx --test tests/**/*.test.ts (npm install後。tsxさえあれば動く)
npm run typecheck   # tsc --noEmit
npm run lint         # next lint
npm run build        # next build
```

---

## ディレクトリ構成

```
app/                      Next.js App Router (ページ + API routes)
  page.tsx                 ブランドLP (/)
  pilot/box/[boxPublicId]   Phase A貸出フロー入口
  app/rentals/[token]       利用中画面
  app/rentals/[token]/return 返却フロー
  admin/                    管理画面(認証未実装、TODO)
  api/pilot/rentals/*       貸出開始・決済確定
  api/rentals/[token]/*     利用中ステータス・返却申請
  api/admin/rentals/*       管理者による返却承認・partial capture
  api/stripe/webhook        Stripe Webhook受信
  api/box/commands, events  Phase B: Backend⇄Box通信
  api/dev/box-simulator     Box Simulator操作(開発専用、production では404)
  terms/, privacy/, care/, legal/, faq/, support/  法定・規約ページ(すべてDRAFT、未公開)

src/lib/
  pricing/engine.ts         料金計算エンジン(§7)
  state-machine/rental.ts   Rental状態遷移(§13)
  box/                      BoxProvider interface, Box Simulator, コマンド署名
  stripe/                   Stripe client(生fetch, npm `stripe`パッケージ不使用), Webhook署名検証
  storage/s3-presign.ts     S3互換ストレージ署名付きURL
  i18n/                     日英辞書
  db.ts, audit.ts, ids.ts   Prisma client, 監査ログ, ID生成

prisma/
  schema.prisma             データモデル(§14)
  migrations/                生SQLマイグレーション(番号順に適用)
  seed.sql                   開発用シード

tests/                       node:test で実行するユニットテスト
docs/
  GAP_ANALYSIS_AND_MIGRATION_PLAN.md   Step1監査結果
  openapi/box-integration.yaml         Phase B Box通信APIのOpenAPI仕様

legacy/vercel-functions-v0/  旧実装(削除せず退避。参照用)
```

---

## Box連携: Phase A → Phase B の切り替え

`.env` の `BOX_PROVIDER_MODE` で切り替える。

- `simulator`(デフォルト): `src/lib/box/simulator-provider.ts` を使用。実機なしでUNLOCK成功/失敗/タイムアウト、扉半開き、充電有無、イベント重複・順序逆転、停電/復帰を再現できる。
- `oem_adapter`: 未実装。OEM選定後、`BoxProvider` interface(`src/lib/box/provider.ts`)を実装して追加する。

Phase Aの物理鍵運用ではBoxProviderを一切呼ばない(`Box.currentPhysicalUnlockCode` を管理画面から設定し、決済成功後に一度だけ表示する)。

---

## Stripe決済アーキテクチャ

既存実装(`legacy/vercel-functions-v0`)は¥990を即時課金 + 別の¥50,000オーソリという二段構成だったが、
Master Handoff v2 §8.1 に合わせて **単一の¥50,000オーソリ(capture_method=manual)→返却後に利用料だけpartial capture** という方式に再設計した。

1. `POST /api/pilot/rentals` — Rentalを作成し、Stripe Checkout Session(`mode=setup`)でカードを保存(この時点で課金なし)
2. `GET /api/pilot/rentals/:id/checkout-complete` — 保存したカードで¥50,000をオーソリ。成功時のみRentalをPAYMENT_AUTHORIZEDへ進める
3. `POST /api/rentals/:token/return` — 返却申請。返却成立時刻から利用料を自動計算し、AI_REVIEW_REQUIREDへ(AIベンダー未確定のため常に人手確認へ回す)
4. `POST /api/admin/rentals/:id/approve-return` — 管理者確認後、利用料だけpartial capture。残枠は自動解放

live mode化の条件は `LAUNCH_BLOCKERS.md` を参照。

---

## 既知の未実装・TODO

- 管理画面の認証/RBAC(`app/admin/page.tsx`に認証ガードが無い。本番投入前に必須)
- DamageCase(破損申告)フローのAPI/UI
- 返却動画のAI一次判定(ベンダー未確定。現状は常にHUMAN_REVIEW)
- メール通知
- PWA manifestはあるが、アイコン画像(`icon-192.png`, `icon-512.png`)は未作成
- Box実機の認証方式(`/api/box/events`, `/api/box/commands`に現状デバイス認証が無い)

これらはコードのコメント内にもTODOとして残している。
