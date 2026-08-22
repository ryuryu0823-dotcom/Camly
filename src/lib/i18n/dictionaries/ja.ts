/**
 * 日本語辞書。§16: 全UI文言を辞書化し、英語切替時に日本語を残さないためのCI検証対象。
 * キー構成は en.ts と完全一致させること(tests/i18n.test.ts が欠落を検出する)。
 */
const ja = {
  brand: {
    tagline: "あらゆる場所に、新しい可能性を。",
    taglineEn: "Make every place more possible.",
    ctaRentCamera: "カメラを借りる",
    ctaHostLocation: "Camlyを設置する",
  },
  common: {
    loading: "読み込み中…",
    error: "エラーが発生しました",
    back: "戻る",
    next: "次へ",
    cancel: "キャンセル",
    confirm: "確認",
  },
  pilot: {
    title: "カメラをレンタルする",
    nameLabel: "お名前",
    emailLabel: "メールアドレス",
    phoneLabel: "電話番号",
    stayReservationLabel: "宿泊予約名",
    consentNotice: "利用規約・補償規定・プライバシーポリシーに同意のうえお進みください。",
    termsLink: "利用規約",
    careLink: "補償規定",
    privacyLink: "プライバシーポリシー",
    depositNotice: "決済時に¥50,000のカード利用枠を一時的に確保します(保証枠)。正常返却後、利用料以外は請求しません。",
    submitButton: "同意して決済へ進む",
  },
  rentalActive: {
    title: "利用中",
    elapsedLabel: "経過時間",
    currentPriceLabel: "現在の料金目安",
    nextPriceChangeLabel: "次に料金が上がる時刻",
    returnButton: "返却する",
    unlockCodeLabel: "キーボックス暗証番号",
  },
  return: {
    title: "返却手続き",
    videoInstruction: "5〜10秒の連続動画を撮影してください(前面→背面→電源ON→レンズ展開→液晶点灯)",
    photoInstruction: "本体・付属品・ケーブル接続が一枚で分かる収納写真を撮影してください",
    checklistTitle: "返却チェック項目",
    submitButton: "返却を申請する",
    pendingNotice: "返却申請を受け付けました。現物確認後にご案内します。",
  },
  survey: {
    title: "簡単なアンケート(1分以内)",
    reasonLabel: "借りた理由・利用場面",
    satisfactionLabel: "満足度",
    skipButton: "スキップ",
  },
  admin: {
    dashboardTitle: "管理画面",
    rentalsTitle: "貸出一覧",
    boxesTitle: "拠点・Box",
    damageCasesTitle: "破損申告",
  },
} as const;

export default ja;
