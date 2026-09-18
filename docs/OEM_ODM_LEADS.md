# OEM/ODM候補リスト(未検証・一次スクリーニング用)

作成日: 2026-08-20。Web検索で見つかった候補を一次的にリストしたものであり、価格・量産能力・品質・PSE/技適対応可否は一切確認していない。あくまで「朝一番に問い合わせを始めるための候補」として提供する。実際の選定はMOQ、単価、開発期間、対応言語、実績を精査したうえで行うこと。

## スマートロッカー筐体そのもの(海外・中国系)

- **Shenzhen Kunton Intelligent Storage Technology** — 産業用ベンディング/ロッカー機器メーカー([made-in-china](https://eb106cc2fc163df2.en.made-in-china.com/))
- **ZHILAI (智来)** — スマート収納ロッカーソリューション、中国+ベトナム展開([smartelocker.com](https://www.smartelocker.com/))
- **Haloo** — スマートロッカー型ベンディングマシン([haloo-vending.com](https://www.haloo-vending.com/smart-locker-vending-machine.html))
- **eboxlock** — 電子錠モジュール単体のOEM/ODM(筐体は別、電子錠だけ調達する場合の候補。§12.2「既製部品流用」に合致)([eboxlock.en.made-in-china.com](https://eboxlock.en.made-in-china.com/product/zZqGUcguhPhk/China-OEM-ODM-Keyless-Cabinet-Lock-for-Automatic-Smart-Storage-Lockers-with-CE.html))
- 上記以外にもAlibaba/made-in-china上に多数の「smart locker vending machine」サプライヤーが存在する([一覧](https://www.made-in-china.com/manufacturers/locker-vending-machine.html))

## 国内メーカー(スピード重視・小ロット相談向け)

- **株式会社アルファロッカー** — 国内最大手のコインロッカー専門メーカー([alpha-locker.com](https://alpha-locker.com/))
- **リヨーユウGC** — ICロッカー・貴重品ロッカーの企画製造直販([ryoyu-gc.jp](https://www.ryoyu-gc.jp/))
- **デジタルソリューションズ(Fjtex)** — 非対面式受け渡しスマートロッカーシステム([fjtex.co.jp](https://www.fjtex.co.jp/digital/product/smartlocker.php))
- **株式会社FUJI** — ロッカー関連製品([fuji.co.jp](https://www.fuji.co.jp/items/quist))

国内メーカーは量産単価では中国系に劣る可能性が高いが、5台程度の小ロット試作・国内対応力・PSE/技適対応の相談しやすさで先に当たる価値がある。

## 問い合わせ時に確認すべきこと(Master Handoff v2 §12.2, §12.3準拠)

- 5口モジュールを基本単位とし、通信・電源・主制御基板を共有できる設計に対応可能か
- 汎用収納(RX100M3、Kodak PIXPRO等)に対応する交換式インサート/可動緩衝材の製作可否
- 電子錠+扉センサー+内部固定充電ケーブル+状態LEDを各口に持たせられるか
- Wi-Fi必須、LTEオプション対応
- Backend→Boxのコマンドを署名付きHTTP/MQTT等で受けられるか(`docs/openapi/box-integration.yaml`参照。実際の通信方式はベンダーとすり合わせる)
- 試作45〜70万円、10台35万円以下、50台25万円以下、100台20万円以下という参考レンジ感に対する反応(§12.2)
- VE量産目標: FOB 5口410米ドル以下/10口660米ドル以下、日本着5口8万円以下/10口13万円以下(§12.2)
- PSE(USB AC充電器)、技適(Wi-Fi/LTEモジュール)対応実績

## 注意

このリストは実在の検索結果に基づくが、**Camlyの要件を満たせるかは未検証**。価格・実績・対応力は必ず個別に確認すること。
