"use client";

/**
 * 返却フロー(§4 `/app/rentals/[token]/return`, §10)。
 * RETURN_STEPS(src/lib/return-steps.ts)の順に、サイト内カメラで各項目を撮影しながら案内する。
 * ステップごとに kind: "photo" | "video" が決まっており、
 * - photo: ライブプレビューから1枚キャプチャして即アップロード
 * - video: 到着時に自動で録画開始し、利用者が「次へ」を押した時点で録画停止・アップロード
 * 録画時間を固定タイマーで区切らず、利用者の操作に委ねることで無駄に長い動画にならないようにしている。
 */
import { useEffect, useRef, useState } from "react";
import { RETURN_STEPS } from "@/lib/return-steps";

type StepResult = { storageKey: string; mimeType: string };

const RECORDER_MIME_CANDIDATES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const candidate of RECORDER_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return null;
}

const SATISFACTION_OPTIONS = ["1", "2", "3", "4", "5"];
const SCENE_OPTIONS = ["記念撮影", "SNS投稿用", "観光・散策の記録", "宿泊先での思い出", "その他"];
const PRICE_OPTIONS = ["安い", "ちょうどいい", "やや高い", "高い"];
const REUSE_OPTIONS = ["ぜひ利用したい", "機会があれば", "わからない", "利用しないと思う"];

interface SurveyState {
  satisfaction: string;
  scene: string;
  priceFeeling: string;
  reuseIntent: string;
  wantedLocations: string;
  comments: string;
}

const EMPTY_SURVEY: SurveyState = {
  satisfaction: "",
  scene: "",
  priceFeeling: "",
  reuseIntent: "",
  wantedLocations: "",
  comments: "",
};

export default function ReturnPage({ params }: { params: { token: string } }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [survey, setSurvey] = useState<SurveyState>(EMPTY_SURVEY);
  const [recording, setRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("video/webm");

  const step = RETURN_STEPS[stepIndex];
  const isReview = stepIndex >= RETURN_STEPS.length;

  useEffect(() => {
    if (isReview || !step) return;
    if (results[step.key]) return; // 撮影済み(戻ってきた場合)はカメラを起動し直さない
    startCamera(step.kind);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  function stopStream() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  /** カメラを起動する。video用ステップの場合のみ、起動と同時に録画も開始する。 */
  async function startCamera(kind: "photo" | "video") {
    setCameraError(null);
    setRecording(false);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);

      if (kind === "photo") return; // 静止画ステップは録画不要。プレビューだけで撮影ボタンを待つ。

      const mimeType = pickSupportedMimeType();
      if (!mimeType) {
        setCameraError("このブラウザは録画に対応していません。下のファイル選択から動画を選んでください。");
        return;
      }
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("camera start failed", err);
      setCameraError("カメラを起動できませんでした。ブラウザのカメラ許可を確認するか、下のファイル選択から選んでください。");
    }
  }

  async function uploadAndGetKey(blob: Blob, mimeType: string, stepKey: string, kind: "photo" | "video"): Promise<string> {
    const presignRes = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rentalToken: params.token,
        kind: kind === "photo" ? "RETURN_PHOTO" : "RETURN_VIDEO",
        contentType: mimeType,
        stepKey,
      }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) throw new Error(presign.error ?? "presign failed");

    const putRes = await fetch(presign.uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
    if (!putRes.ok) throw new Error("upload failed");
    return presign.storageKey;
  }

  /** ライブプレビューの現在のフレームをJPEGとして1枚キャプチャする。 */
  function capturePhotoBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) {
        resolve(null);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }

  async function handleNext() {
    if (!step) return;
    setUploading(true);
    setCameraError(null);
    try {
      let blob: Blob | null;
      let mimeType: string;
      if (step.kind === "photo") {
        blob = await capturePhotoBlob();
        mimeType = "image/jpeg";
        if (!blob) throw new Error("撮影に失敗しました。もう一度お試しください。");
      } else {
        blob = await stopRecordingAndCollect();
        mimeType = mimeTypeRef.current;
        if (!blob) throw new Error("録画データを取得できませんでした。撮り直してください。");
      }
      const storageKey = await uploadAndGetKey(blob, mimeType, step.key, step.kind);
      advanceAfterUpload(step.key, { storageKey, mimeType });
    } catch (err: any) {
      setCameraError(err.message ?? "アップロードに失敗しました。撮り直してください。");
    } finally {
      setUploading(false);
    }
  }

  function stopRecordingAndCollect(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mimeTypeRef.current }) : null);
        return;
      }
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }));
      };
      recorder.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    });
  }

  function handleRetake() {
    if (!step) return;
    stopStream();
    setResults((prev) => {
      const next = { ...prev };
      delete next[step.key];
      return next;
    });
    startCamera(step.kind);
  }

  /**
   * アップロード完了後、次に未撮影のステップへ進む(全て撮影済みならレビュー画面へ)。
   * 単純に stepIndex+1 にしないのは、レビュー画面から1ステップだけ撮り直した場合に
   * 既に撮影済みの後続ステップへ迷い込んでカメラが起動しない状態になるのを防ぐため。
   */
  function advanceAfterUpload(stepKey: string, uploaded: StepResult) {
    const updated = { ...results, [stepKey]: uploaded };
    setResults(updated);
    const nextIndex = RETURN_STEPS.findIndex((s) => !updated[s.key]);
    setStepIndex(nextIndex === -1 ? RETURN_STEPS.length : nextIndex);
  }

  function handleFileFallback(file: File) {
    if (!step) return;
    const storageKeyPromise = uploadAndGetKey(file, file.type, step.key, step.kind);
    setUploading(true);
    storageKeyPromise
      .then((storageKey) => advanceAfterUpload(step.key, { storageKey, mimeType: file.type }))
      .catch((err) => setCameraError(err.message ?? "アップロードに失敗しました"))
      .finally(() => setUploading(false));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // isReview画面に来た時点でadvanceAfterUploadにより全ステップ分results[key]が揃っている前提
      const steps = RETURN_STEPS.map((s) => {
        const uploaded = results[s.key];
        if (!uploaded) throw new Error(`${s.label}が未撮影です`);
        return { stepKey: s.key, storageKey: uploaded.storageKey, mimeType: uploaded.mimeType };
      });
      const surveyAnswers = Object.values(survey).some((v) => v) ? survey : undefined;
      const res = await fetch(`/api/rentals/${params.token}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, surveyAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "return submission failed");
      setResult(data.message);
    } catch (err: any) {
      setSubmitError(err.message ?? "エラーが発生しました");
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

  if (isReview) {
    return (
      <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">撮影内容の確認</h1>
        <p className="text-camly-inkMuted text-sm mb-8">すべての項目を撮影しました。内容を確認して送信してください。</p>

        <div className="space-y-3 mb-8">
          {RETURN_STEPS.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-lg border border-camly-line px-4 py-3 text-sm">
              <span>{s.label}</span>
              <span className="flex items-center gap-3">
                <span className="text-camly-accent font-bold">✓ 撮影済み</span>
                <button
                  type="button"
                  onClick={() => {
                    setResults((prev) => {
                      const next = { ...prev };
                      delete next[s.key];
                      return next;
                    });
                    setStepIndex(RETURN_STEPS.findIndex((x) => x.key === s.key));
                  }}
                  className="text-xs underline text-camly-inkMuted"
                >
                  撮り直す
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-camly-line p-4 mb-6 text-xs text-camly-inkMuted leading-relaxed">
          <p className="font-bold text-camly-ink mb-1">送信前にご確認ください</p>
          <p>
            SDカードのデータはお済みですか?カードリーダー等で転送する際に「削除しますか?」と表示されたら、
            次にお使いになる方のために削除にご協力ください。
          </p>
          <p className="mt-2">
            返却時点でSDカードにデータが残っていた場合の取扱い(閲覧・削除・消失を含む)について、当社は責任を負いかねます。大切なデータは必ず事前にご自身でバックアップしてください(
            <a href="/care" className="underline">
              補償規定
            </a>
            参照)。
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-1">あなたの声がCamlyを作ります</h2>
          <p className="text-camly-inkMuted text-xs mb-5">実証実験中につき、ご協力いただけると嬉しいです(すべて任意)。</p>

          <div className="space-y-5">
            <SurveyField label="今回のご利用、満足度は?">
              <div className="flex gap-2">
                {SATISFACTION_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.satisfaction === v}
                    onClick={() => setSurvey({ ...survey, satisfaction: v })}
                  />
                ))}
                <span className="text-xs text-camly-inkMuted self-center ml-1">(5が最高)</span>
              </div>
            </SurveyField>

            <SurveyField label="今回の利用シーンに近いものは?">
              <div className="flex flex-wrap gap-2">
                {SCENE_OPTIONS.map((v) => (
                  <PillButton key={v} label={v} selected={survey.scene === v} onClick={() => setSurvey({ ...survey, scene: v })} />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="料金(3時間¥990〜)は妥当だと感じましたか?">
              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.priceFeeling === v}
                    onClick={() => setSurvey({ ...survey, priceFeeling: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="また機会があればCamlyを利用したいですか?">
              <div className="flex flex-wrap gap-2">
                {REUSE_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.reuseIntent === v}
                    onClick={() => setSurvey({ ...survey, reuseIntent: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="こんな場所にもあったら使いたい、というご希望があれば">
              <textarea
                value={survey.wantedLocations}
                onChange={(e) => setSurvey({ ...survey, wantedLocations: e.target.value })}
                rows={2}
                placeholder="例: 空港、温泉旅館、キャンプ場 など"
                className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm outline-none focus:border-camly-accent resize-none"
              />
            </SurveyField>

            <SurveyField label="ご感想・気になった点・改善してほしい点など">
              <textarea
                value={survey.comments}
                onChange={(e) => setSurvey({ ...survey, comments: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm outline-none focus:border-camly-accent resize-none"
              />
            </SurveyField>
          </div>
        </section>

        {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
        >
          {submitting ? "送信中…" : "返却を申請する"}
        </button>
        <a
          href="https://camly.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full border border-camly-line text-camly-ink text-xs font-bold px-5 py-2.5 mt-6"
        >
          Camlyについて詳しく見る
          <span aria-hidden>→</span>
        </a>
      </main>
    );
  }

  if (!step) return null; // isReview分岐で処理済みのはずだが型上のフォールバック

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
      <p className="text-camly-accent text-xs tracking-widest font-bold mb-2">
        STEP {stepIndex + 1} / {RETURN_STEPS.length}
      </p>
      <h1 className="text-2xl font-bold mb-2">{step.label}</h1>
      <p className="text-camly-inkMuted text-sm mb-6">{step.instruction}</p>

      <div className="relative rounded-xl overflow-hidden bg-camly-charcoal border border-camly-line aspect-[3/4] mb-4">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {step.kind === "video" && recording && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            録画中
          </span>
        )}
      </div>

      {cameraError && (
        <div className="mb-4">
          <p className="text-red-400 text-sm mb-2">{cameraError}</p>
          <label className="block">
            <span className="block text-xs text-camly-inkMuted mb-1.5">
              代わりに{step.kind === "photo" ? "写真" : "動画"}ファイルを選択
            </span>
            <input
              type="file"
              accept={step.kind === "photo" ? "image/*" : "video/*"}
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileFallback(f);
              }}
              className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm"
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRetake}
          disabled={uploading}
          className="flex-1 rounded-full border border-camly-line text-camly-ink font-bold py-4 text-sm disabled:opacity-50"
        >
          撮り直す
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={uploading || (step.kind === "video" ? !recording : !cameraReady)}
          className="flex-[2] rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
        >
          {uploading ? "アップロード中…" : step.kind === "photo" ? "撮影して次へ" : "次へ"}
        </button>
      </div>
    </main>
  );
}

function SurveyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-camly-inkMuted mb-2">{label}</p>
      {children}
    </div>
  );
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
        selected ? "bg-camly-accent border-camly-accent text-camly-black" : "border-camly-line text-camly-ink"
      }`}
    >
      {label}
    </button>
  );
}
