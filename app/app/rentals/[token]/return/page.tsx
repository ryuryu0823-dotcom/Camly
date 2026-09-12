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

// 返却アンケート(全12問、投資家向け需要分析・出店/商品構成の意思決定に使う設計)。
// Q1,2,3,4,5,6,7,9は5択前後の単一選択、Q8,10は複数選択、Q11は0-10のNPS、Q12のみ自由記述任意。
// 選択式中心にすることで、必須項目が多くても回答時間は1分半〜2分程度に収まる想定。
const SATISFACTION_OPTIONS = ["とても満足", "満足", "どちらともいえない", "不満", "とても不満"];
const COMPANION_OPTIONS = ["一人", "パートナー", "友人", "家族", "その他"];
const AGE_OPTIONS = ["18歳未満", "18〜24歳", "25〜34歳", "35〜44歳", "45〜54歳", "55歳以上", "回答しない"];
const MAIN_REASON_OPTIONS = [
  "スマートフォンよりきれいな写真を撮りたかった",
  "旅行の思い出を特別な写真で残したかった",
  "カメラを持っていなかった／持ってくるのを忘れた",
  "宿泊先にあり、気軽に試せた",
  "購入前にカメラを試してみたかった",
  "同行者が利用したいと言った",
  "その他",
];
const DECISION_SPEED_OPTIONS = [
  "ほとんど迷わず利用した",
  "少し迷ったが、すぐに利用した",
  "料金や利用方法を確認してから利用した",
  "同行者と相談して利用した",
  "かなり迷った",
];
const PRICE_OPTIONS = ["とても安い", "やや安い", "適正", "やや高い", "とても高い"];
const REUSE_OPTIONS = ["必ず利用したい", "利用したい", "どちらともいえない", "あまり利用したくない", "利用したくない"];
// 「利用したい場所はない」は他の選択肢と同時選択できない(排他)。
const DESIRED_LOCATION_NONE = "利用したい場所はない";
const DESIRED_LOCATION_OPTIONS = [
  "ホテル・旅館",
  "一棟貸し・民泊",
  "観光施設・展望台",
  "テーマパーク",
  "着物レンタル店",
  "クラブ・ライブ会場",
  "結婚式場・イベント会場",
  "空港・駅",
  "カフェ・レストラン",
  "その他",
  DESIRED_LOCATION_NONE,
];
const VENUE_ATTRACTIVENESS_OPTIONS = [
  "選ぶ大きな理由になる",
  "選ぶ理由の一つになる",
  "少し魅力を感じる",
  "あまり影響しない",
  "まったく影響しない",
];
// 「特にこだわりはない」以外を1つでも選んだ場合のみ、具体的な機種名の自由記述欄を出す
// (先に種類を選んでもらい、分かる人だけ機種名を書ける形にする)。
const DESIRED_CAMERA_NONE = "特にこだわりはない";
const DESIRED_CAMERA_OPTIONS = [
  "レトロな写りのコンパクトデジタルカメラ",
  "高画質なコンパクトデジタルカメラ",
  "ミラーレス一眼カメラ",
  "アクションカメラ",
  "チェキなどのインスタントカメラ",
  "フィルムカメラ",
  DESIRED_CAMERA_NONE,
  "その他・具体的な機種がある",
];
const NPS_SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i);

interface SurveyState {
  satisfaction: string;
  companions: string;
  ageGroup: string;
  mainReason: string;
  decisionSpeed: string;
  priceFeeling: string;
  reuseIntent: string;
  desiredLocations: string[];
  venueAttractiveness: string;
  desiredCameraTypes: string[];
  desiredCameraModel: string;
  npsScore: number | null;
  comments: string;
}

const EMPTY_SURVEY: SurveyState = {
  satisfaction: "",
  companions: "",
  ageGroup: "",
  mainReason: "",
  decisionSpeed: "",
  priceFeeling: "",
  reuseIntent: "",
  desiredLocations: [],
  venueAttractiveness: "",
  desiredCameraTypes: [],
  desiredCameraModel: "",
  npsScore: null,
  comments: "",
};

/** Q8: 「利用したい場所はない」は他の選択肢と排他にする。 */
function toggleDesiredLocation(current: string[], value: string): string[] {
  if (value === DESIRED_LOCATION_NONE) {
    return current.includes(DESIRED_LOCATION_NONE) ? [] : [DESIRED_LOCATION_NONE];
  }
  const withoutNone = current.filter((v) => v !== DESIRED_LOCATION_NONE);
  return withoutNone.includes(value) ? withoutNone.filter((v) => v !== value) : [...withoutNone, value];
}

function toggleInArray(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function getMissingRequiredSurveyFields(s: SurveyState): string[] {
  const missing: string[] = [];
  if (!s.satisfaction) missing.push("満足度");
  if (!s.companions) missing.push("同行者");
  if (!s.ageGroup) missing.push("年代");
  if (!s.mainReason) missing.push("利用した一番の理由");
  if (!s.decisionSpeed) missing.push("利用を決めるまでの検討度合い");
  if (!s.priceFeeling) missing.push("料金について");
  if (!s.reuseIntent) missing.push("また利用したいか");
  if (s.desiredLocations.length === 0) missing.push("Camlyがあったら利用したい場所");
  if (!s.venueAttractiveness) missing.push("施設選びへの影響度");
  if (s.desiredCameraTypes.length === 0) missing.push("借りてみたいカメラの種類");
  if (s.npsScore === null) missing.push("友人・家族への推奨度");
  return missing;
}

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
    const missing = getMissingRequiredSurveyFields(survey);
    if (missing.length > 0) {
      setSubmitError(`アンケートの必須項目が未回答です: ${missing.join("、")}`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // isReview画面に来た時点でadvanceAfterUploadにより全ステップ分results[key]が揃っている前提
      const steps = RETURN_STEPS.map((s) => {
        const uploaded = results[s.key];
        if (!uploaded) throw new Error(`${s.label}が未撮影です`);
        return { stepKey: s.key, storageKey: uploaded.storageKey, mimeType: uploaded.mimeType };
      });
      const surveyAnswers = survey;
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
          <p className="text-camly-inkMuted text-xs mb-5">
            今後の出店・商品づくりの参考にします。★は必須、残り1問(最後)のみ任意です。
          </p>

          <div className="space-y-5">
            <SurveyField label="Camlyの利用体験全体に、どのくらい満足しましたか?" required>
              <div className="flex flex-wrap gap-2">
                {SATISFACTION_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.satisfaction === v}
                    onClick={() => setSurvey({ ...survey, satisfaction: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="今回はどなたと宿泊しましたか?" required>
              <div className="flex flex-wrap gap-2">
                {COMPANION_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.companions === v}
                    onClick={() => setSurvey({ ...survey, companions: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="年代を教えてください" required>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.ageGroup === v}
                    onClick={() => setSurvey({ ...survey, ageGroup: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="今回、Camlyを利用した一番の理由を教えてください" required>
              <div className="flex flex-wrap gap-2">
                {MAIN_REASON_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.mainReason === v}
                    onClick={() => setSurvey({ ...survey, mainReason: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="Camlyを見つけてから、利用を決めるまでどのくらい迷いましたか?" required>
              <div className="flex flex-wrap gap-2">
                {DECISION_SPEED_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.decisionSpeed === v}
                    onClick={() => setSurvey({ ...survey, decisionSpeed: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="今回の料金について、どのように感じましたか?" required>
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

            <SurveyField label="同じように宿泊先や観光施設にCamlyがあれば、また利用したいですか?" required>
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

            <SurveyField label="今後、どこにCamlyがあったら利用したいですか?(複数選択可)" required>
              <div className="flex flex-wrap gap-2">
                {DESIRED_LOCATION_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.desiredLocations.includes(v)}
                    onClick={() => setSurvey({ ...survey, desiredLocations: toggleDesiredLocation(survey.desiredLocations, v) })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="Camlyが設置されていることは、宿泊先や施設を選ぶ際の魅力になりますか?" required>
              <div className="flex flex-wrap gap-2">
                {VENUE_ATTRACTIVENESS_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.venueAttractiveness === v}
                    onClick={() => setSurvey({ ...survey, venueAttractiveness: v })}
                  />
                ))}
              </div>
            </SurveyField>

            <SurveyField label="今後、Camlyで借りてみたいカメラはありますか?(複数選択可)" required>
              <div className="flex flex-wrap gap-2">
                {DESIRED_CAMERA_OPTIONS.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    selected={survey.desiredCameraTypes.includes(v)}
                    onClick={() => setSurvey({ ...survey, desiredCameraTypes: toggleInArray(survey.desiredCameraTypes, v) })}
                  />
                ))}
              </div>
              {survey.desiredCameraTypes.some((v) => v !== DESIRED_CAMERA_NONE) && (
                <input
                  type="text"
                  value={survey.desiredCameraModel}
                  onChange={(e) => setSurvey({ ...survey, desiredCameraModel: e.target.value })}
                  placeholder="任意: 具体的な機種名があれば(例: RICOH GR、Kodak FZ55、FUJIFILM X100シリーズ など)"
                  className="w-full mt-2 rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm outline-none focus:border-camly-accent"
                />
              )}
            </SurveyField>

            <SurveyField label="Camlyを友人や家族に勧めたいと思いますか?" required>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {NPS_SCORE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSurvey({ ...survey, npsScore: n })}
                    className={`w-9 h-9 shrink-0 rounded-full border text-xs font-bold transition-colors ${
                      survey.npsScore === n ? "bg-camly-accent border-camly-accent text-camly-black" : "border-camly-line text-camly-ink"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-camly-inkMuted">
                <span>0=まったく勧めたくない</span>
                <span>10=ぜひ勧めたい</span>
              </div>
            </SurveyField>

            <SurveyField label="Camlyについて、良かった点や改善してほしい点があれば教えてください(任意)">
              <textarea
                value={survey.comments}
                onChange={(e) => setSurvey({ ...survey, comments: e.target.value })}
                rows={3}
                placeholder="例: 利用方法、写真の仕上がり、料金、カメラの種類、返却方法など"
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

function SurveyField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-camly-inkMuted mb-2">
        {label}
        {required && <span className="text-camly-accent font-bold"> ★</span>}
      </p>
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
