# Camly 差分表 & 移行計画 (Step 1 監査結果)

作成日: 2026-08-20
対象: `ryuryu0823-dotcom/Camly` (main, commit `93db7fb`)
最上位仕様: `Camly_Claude_Master_Handoff_v2.md`

---

## 1. リポジトリ現状サマリー

現在のリポジトリは **フレームワークなしの生Vercel Functions 3ファイルのみ** で構成されている。Next.js、DB、認証、管理画面、i18n、PWA、状態遷移、ボックス連携は一切存在しない。

```
README.md               # "Camly / Camly payment system" の2行のみ
api/checkout.js         # Stripe Checkout Session作成 (¥990固定商品)
api/success.js          # Checkout成功後の¥50,000オーソリ + 固定暗証番号(2580)表示HTML
api/api/success.js      # 使われていない重複ファイル(スタブ)。checkout.jsのsuccess_urlは/api/successを指しており、/api/api/successは到達経路がない
```

- `package.json` なし、`vercel.json` なし、TypeScriptなし、テストなし。
- `api/checkout.js` は Vercel Node.js Functions 形式 (`export default async function handler(req, res)`)。
- `api/success.js` と `api/api/success.js` は Cloudflare Workers形式 (`export default { async fetch(request) {...} }`)。**この2ファイルは現状の素のVercel Node.js Functionsとしては呼び出しシグネチャが不正な可能性が高い**(Vercelのデフォルト実行環境はNode.jsで `(req,res)` を期待する。Edge Runtimeにする場合は `export const config = { runtime: "edge" }` の宣言が必要だが存在しない)。実際に `/api/success` が本番で正しく動作しているか、Vercelダッシュボードでの実行ログ確認を推奨(このサンドボックスからは本番URLを叩いていない=実決済/実セッションを誤発生させないため)。
- Git履歴を辿ると `api/api/success.js` は当初の実装場所で、後に `api/success.js` へ内容がコピーされ、そちらだけ更新され続けた。`api/api/success.js` は開発が古いスタブのまま放置されている。**削除はせず**、移行計画で退避場所を提案する。

---

## 2. 差分表(現状 vs Master Handoff v2)

| # | 領域 | v2仕様の要求 | 現状 | 差分 | 深刻度 |
|---|---|---|---|---|---|
| 1 | フレームワーク | Next.js App Router / TypeScript / Tailwind、単一コードベースでLP・検証・本番・管理画面 | 素のVercel Functions 3本のみ。フロントエンド0 | 全面新規構築が必要(既存を壊さず併存させる方針) | 致命的 |
| 2 | データ層 | PostgreSQL + 型安全ORM、§14の全モデル(User/Location/Box/Compartment/Device/Rental/…) | DBなし。状態はStripeのメタデータのみ | ゼロから設計 | 致命的 |
| 3 | 情報設計/URL | `/`, `/locations`, `/pilot/box/[id]`, `/app/box/[id]`, `/app/rentals/[token]`, `/admin/*` 等 | 該当ページなし。QRの遷移先も存在しない | ゼロから構築 | 致命的 |
| 4 | 貸出フロー(§6) | 汎用QR→拠点/Box自動識別→本人情報・同意→¥50,000オーソリ→成功後のみHELD→暗証番号 or 解錠command | QRなし。誰でも同じURLから¥990即時決済→固定暗証番号2580が全員に表示。氏名/電話/宿泊予約名の入力欄なし。同意version保存なし | 二重貸出防止(row lock)も未実装。全面再設計 | 致命的(セキュリティ・事業リスク) |
| 5 | 決済アーキテクチャ(§8) | **単一の¥50,000 PaymentIntent(capture_method=manual)をオーソリし、返却成立後に利用料+Careだけをpartial captureする** | **¥990を`mode:"payment"`のCheckout Sessionで即時キャプチャ**し、**別のPaymentIntentとして¥50,000を独立にオーソリ**する二段構成。Partial capture導線が存在しない(returnフローごと無い) | 決済方式そのものが仕様と異なる。作り直しが必要。ただし「setup_future_usage=off_session」「idempotency-key」「capture_method=manual」等の実装知見は再利用可能 | 致命的 |
| 6 | Webhook | 署名検証・event ID一意制約・冪等処理・監査ログ必須 | Webhook実装なし | ゼロから構築 | 致命的 |
| 7 | 料金(§7) | DB管理のPricingRule/Version。3h/12h/24h/以降のTier。返却成立時刻から自動確定 | `price_1U3pWpHSN8DZz1rOYkxrlftK`のハードコード単一価格(¥990、事前決済)。**金額の参考値は現行nasu room MINI案の「3時間未満990円」と一致**しており再利用可 | Pricing engine化が必要。金額自体は矛盾なし | 高 |
| 8 | 解錠/暗証番号 | Box/Compartment単位、貸出ごとに一意、Phase Bは署名付き短寿命command | **全利用者に固定文字列「2580」を表示**。Box識別・在庫管理なし | セキュリティ上のクリティカルな欠陥。是正必須 | 致命的 |
| 9 | Camera個体 | Phase Aの機種は **SONY Cyber-shot DSC-RX100M3**(§2) | 現状の成功画面文言は **「RICOH GR IIIをお楽しみください」** とハードコード | 本書(v2)を最上位仕様として、コピーをRX100M3側へ修正する。GR III表記は旧情報として置き換える | 中(事実確認要) |
| 10 | 返却フロー(§10-11) | 5-10秒動画+収納写真1枚、AI一次判定(PASS/RETAKE/HUMAN_REVIEW)、扉ログ、返却申請時刻の確定 | **Googleフォームへの外部リンクのみ**(`forms.gle/...`)。動画/写真取得、AI判定、状態遷移、一切なし | ゼロから構築 | 致命的 |
| 11 | Camly Care(§9) | 250/350/500円のプラン選択、補償規定、事故申告フロー | 存在しない | ゼロから構築 | 高 |
| 12 | 管理画面(§15) | 拠点/Box/在庫CRUD、貸出一覧、返却承認、capture/cancel/返金、DamageCase、監査ログ、KPI funnel | 存在しない | ゼロから構築 | 致命的 |
| 13 | ボックス連携(§12) | BoxProvider interface、Simulator、署名付きcommand/event API | 存在しない(Phase Aは物理鍵なので直接連携なしだが、adapter抽象自体が無い) | ゼロから構築 | 高(Phase B必須) |
| 14 | 状態遷移(§13) | サーバー確定のRental状態機械、全イベントRentalEvent/AuditLogへ記録 | 状態という概念自体が存在しない(Stripeの決済成否のみ) | ゼロから構築 | 致命的 |
| 15 | i18n | 日英完全切替、辞書化、CI欠落検出 | 日本語ハードコードのみ | ゼロから構築 | 高 |
| 16 | セキュリティ/監査 | CSRF、rate limit、RBAC、暗証番号や鍵をログへ出さない、署名URL | 存在しない。暗証番号がHTTPレスポンスに平文表示(これは仕様上避けられないが、全員同一という点が問題) | 個別実装が必要 | 高 |
| 17 | ブランドLP(§16) | 黒/チャコール+オレンジ、高級感、`INSTRACTION`の誤字は再利用禁止、`¥990/stay`の旧ステッカー価格を全拠点共通価格にしない | LP自体が存在しない(旧ステッカー/誤字はコード内には見当たらないが、注意事項として引き継ぐ) | ゼロから構築 | 中 |
| 18 | 法定表示 | 特商法、利用規約、プライバシー等、確定情報がないまま公開しない | 存在しない。特商法表示なし | `LAUNCH_BLOCKERS.md`で管理、公開ブロック対象として明示 | 致命的(公開ブロッカー) |
| 19 | Stripeキーの状態(test/live) | test modeで完了後、明示的にlive切替 | 現行コードが本番(camly-plum.vercel.app)で実際に何のキーを使って稼働中か、このセッションからは判別不可 | **要確認**(下記オープン質問) | 致命的(安全確認) |

---

## 3. 再利用できる既存実装の知見

以下は設計として妥当なため、新実装に引き継ぐ。

- `payment_intent_data.setup_future_usage = "off_session"` + `customer_creation = "always"` によるカード保存パターン
- `capture_method = "manual"` によるオーソリのみ確保
- `Idempotency-Key` をCheckout Session IDに紐付けて二重オーソリを防止する発想 → 本実装ではRental/PaymentIntent単位のidempotency keyとして一般化
- 成功画面のダーク基調・カード型UIのトーン(§16のブランド方向性と矛盾しない)
- ¥990という金額そのもの(nasu room MINI「3時間未満」Tierと一致)

---

## 4. 移行計画(破壊的変更なし)

### 方針
- 既存の3ファイル(`api/checkout.js`, `api/success.js`, `api/api/success.js`)は **削除しない**。Next.js App Router化に伴いルーティング衝突を避けるため、`legacy/vercel-functions-v0/` へ `git mv` で退避し、README上で「旧実装・参照用、本番から新実装へ切替後に廃止予定」と明記する(削除ではなく移動+記録)。
- 新規実装は同一リポジトリ内、ルート直下に Next.js App Router 構成を追加する。
- 作業ブランチ: `feature/camly-v2-foundation`(作成済み)。mainへは影響を与えない。
- Vercelの現行本番(`camly-plum.vercel.app`)は、新実装のPreview Deploymentでの動作確認が完了するまで一切変更しない。

### フェーズ順序(Master Handoff §18に準拠)

1. **Step 1: 監査**(本ドキュメント) ✅
2. **Step 2: 基盤** — DB schema/migration/seed、認証/RBAC、Pricing engine、Rental state machine、AuditLog、i18n
3. **Step 3: 検証サイト(Phase A)** — nasu room MINI QR貸出、本人情報・同意、Stripe test オーソリ(単一¥50,000 PaymentIntent方式へ再設計)、物理鍵暗証番号表示(Rental単位で動的発行)、利用中/料金表示、返却動画・写真・アンケート、管理画面
4. **Step 4: ボックス連携(Phase B)** — BoxProvider interface、Simulator、command/event API、OEM adapter用OpenAPI雛形
5. **Step 5: Stripe本番化** — test E2E、live環境変数手順、100円実決済チェックリスト、¥50,000本番オーソリの公開前確認
6. **Step 6: ブランド仕上げ** — LP高品質化、SEO/OGP/analytics、PWA manifest

### 実行環境に関する制約(今回判明した事項)

このクラウド作業環境は **npm/pipの外部レジストリ(registry.npmjs.org, pypi.org等)へのアクセスがネットワークポリシーでブロックされている**(`403 host_not_allowed`)ことを確認した。そのため、このセッション内で `npm install` を伴うNext.js/Prisma等の実行(`next dev`, `next build`, `prisma migrate`)はできない。

対応方針:
- ソースコード一式(Next.jsアプリ、Prisma schema、API routes等)はこのセッションで作成する。
- DBスキーマは実行可能性を担保するため、ローカルPostgres(このサンドボックスに`postgresql-16`がインストール済み)に対して **生SQLマイグレーション** を実際に適用し、テーブル作成・制約・インデックスが通ることを確認する(Prisma CLIのnpm installが不要な検証方法)。
- 料金計算・状態遷移・BoxCommand署名検証など、外部パッケージに依存しないコアロジックは、Node.js標準機能のみで実装し、`node --test`等で実際に実行してテストする。
- Next.js自体のビルド(`next build`)は、npm registryにアクセスできる環境(井上さんのローカルPC、またはVercelのビルド環境)で実行していただく必要がある。README/CIチェックリストに手順を明記する。
- 成果物の受け渡し方法(GitHubへブランチをpushするか、zip/ファイル送付にするか)は井上さんの回答待ち(下記オープン質問)。

---

## 5. 公開前オープン質問(勝手に確定しない事項)

**A. 本番Stripeキーの状態(安全確認・最優先)**
現在 `camly-plum.vercel.app` で稼働しているのはStripeの **test mode** キーですか、それとも **live mode**(実カード課金)キーですか。実際にnasu room MINIで運用中の実決済であれば、移行中の扱いをより慎重にする必要があります。

**B. 成果物の受け渡し方法**
このクラウド環境からは `ryuryu0823-dotcom/Camly` への **push権限がありません**(現状read-onlyでclone)。以下のどちらが良いですか。
   - (b-1) 作業用のFine-grained PAT(このリポジトリのみ、Contents: Read and write)を一時的に発行して共有 → こちらでブランチをpushし、Pull Requestを作成する
   - (b-2) 完成したファイル一式をzip等でこの会話に送付し、井上さんご自身でpush/PR作成いただく

**C. カメラ機種表記**
本書(v2)を最上位仕様として、Phase Aの機種表記は **SONY Cyber-shot DSC-RX100M3** に統一します(現行コードの「RICOH GR III」表記は上書き対象とします)。この認識で問題なければそのまま進めます。誤りがあれば教えてください。

**D. `api/api/success.js` の扱い**
未使用の重複スタブと判断し、削除はせず `legacy/vercel-functions-v0/` へ移動する方針です。特に反対がなければこのまま進めます。

**E. §21記載の未決事項**(法人情報、問い合わせ窓口、最終料金、Care必須/任意、SLA、レベニューシェア、クラブ機種、OEM選定、本人確認強化、法的請求文言、動画AIベンダー、別拠点返却時期)は引き続き未確定のまま `LAUNCH_BLOCKERS.md` で管理し、コードはfeature flag/設定値として保持します。これらは今回のセッションでは確定させません。
