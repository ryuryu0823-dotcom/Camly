# 旧実装 (v0) — 参照用、削除禁止

この配下は、Camly検証を最初に立ち上げた際の素のVercel Functions実装です。
`Camly_Claude_Master_Handoff_v2.md` に基づく新実装(リポジトリルートのNext.jsアプリ)へ移行するにあたり、
**削除せず** `api/` から `legacy/vercel-functions-v0/api/` へ移動しました(git履歴は保持されています)。

- `api/checkout.js`: Stripe Checkout Session(¥990固定)作成。Vercel Node.js Functions形式。
- `api/success.js`: Checkout成功後、¥50,000の別PaymentIntentをmanual captureでオーソリし、固定暗証番号(2580)を表示。Cloudflare Workers形式のexportになっており、素のVercel Node.js Functionsとして正しく動くかは要確認(`LAUNCH_BLOCKERS.md`参照)。
- `api/api/success.js`: 開発初期の残骸。`checkout.js`のsuccess_urlからは参照されておらず、実質未使用。

**本番 `camly-plum.vercel.app` は現在 live mode で実運用中**のため、新実装への切替が完了し、Stripe live E2E確認が済むまでは、このディレクトリの内容をもって本番Vercelプロジェクトの参照を止めないこと。
