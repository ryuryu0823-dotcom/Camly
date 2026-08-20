"use client";

/**
 * 返却フロー(§4 `/app/rentals/[token]/return`, §10)。
 * 5-10秒の動画+収納写真1枚+チェック項目を送信する。
 *
 * 実装メモ: 今回は <input capture> によるネイティブカメラ起動を使う簡易版。
 * ブラウザ内蔵のMediaRecorderで撮影ガイド(前面→背面→電源ON→レンズ展開→液晶点灯)を
 * ステップ表示しながら録画するリッチ版はStep6以降のアップグレード候補。
 */
import { useState } from "react";

const CHECKLIST_ITEMS: [string, string][] = [
  ["camera_body", "カメラ本体"],
  ["battery", "バッテリー"],
  ["sd_card", "SDカード"],
  ["sd_card_reader", "SDカードリーダー"],
  ["strap", "ストラップ"],
  ["case", "ケース"],
  ["ac_charger", "小型AC充電器"],
  ["carry_cable", "持ち運び用ケーブル"],
  ["no_visible_damage_or_reported", "目立つ破損なし、または事故申告済み"],
];

export default function ReturnPage({ params }: { params: { token: string } }) {
  const [video, setVideo] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [doorClosed, setDoorClosed] = useState(false);
  const [chargerConnected, setChargerConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadAndGetKey(file: File, kind: "RETURN_VIDEO" | "RETURN_PHOTO"): Promise<string> {
    const presignRes = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rentalToken: params.token, kind, contentType: file.type }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) throw new Error(presign.error ?? "presign failed");

    const putRes = await fetch(presign.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!putRes.ok) throw new Error("upload failed");
    return presign.storageKey;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!video || !photo) {
      setError("動画と写真の両方が必要です。");
      return;
    }
    const missing = CHECKLIST_ITEMS.filter(([key]) => !checklist[key]);
    if (missing.length > 0) {
      setError(`未チェックの項目があります: ${missing.map(([, label]) => label).join("、")}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const [videoAssetKey, photoAssetKey] = await Promise.all([
        uploadAndGetKey(video, "RETURN_VIDEO"),
        uploadAndGetKey(photo, "RETURN_PHOTO"),
      ]);

      const res = await fetch(`/api/rentals/${params.token}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoAssetKey, photoAssetKey, checklist, doorClosed, chargerConnected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "return submission failed");
      setResult(data.message);
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-camly-accent text-xs tracking-widest font-bold mb-3">受付完了</p>
          <p className="text-lg font-bold">{result}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">返却手続き</h1>
      <p className="text-camly-inkMuted text-sm mb-8">
        前面→背面→電源ON→レンズ展開→液晶点灯の順に、5〜10秒の連続動画を撮影してください。
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FileField label="返却動画(5〜10秒)" accept="video/*" onChange={setVideo} />
        <FileField label="収納写真(本体・付属品・ケーブル接続が分かる1枚)" accept="image/*" onChange={setPhoto} />

        <div>
          <p className="text-xs text-camly-inkMuted mb-3">返却チェック項目</p>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checklist[key] ?? false}
                  onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={doorClosed} onChange={(e) => setDoorClosed(e.target.checked)} />
              扉を閉めた
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={chargerConnected} onChange={(e) => setChargerConnected(e.target.checked)} />
              内部固定ケーブルを接続した
            </label>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
        >
          {submitting ? "アップロード中…" : "返却を申請する"}
        </button>
      </form>
    </main>
  );
}

function FileField({ label, accept, onChange }: { label: string; accept: string; onChange: (f: File) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-camly-inkMuted mb-1.5">{label}</span>
      <input
        type="file"
        accept={accept}
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
        className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm"
      />
    </label>
  );
}
