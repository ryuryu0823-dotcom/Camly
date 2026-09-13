"use client";

/**
 * 初期不良申請フロー(§4, §9)。
 * 決済完了画面・返却QR入口の下部にある「初期不良があった場合はこちら」からいつでも入れる、
 * 通常の返却フロー(RETURN_STEPS)とは独立した軽量な入口。
 * 症状動画を1本撮影し、テキストで症状を説明して送信するだけの単純な2ステップ。
 */
import { useEffect, useRef, useState } from "react";

const RECORDER_MIME_CANDIDATES = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp8", "video/webm", "video/mp4"];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const candidate of RECORDER_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return null;
}

type VideoResult = { storageKey: string; mimeType: string };

export default function DefectReportPage({ params }: { params: { token: string } }) {
  const [description, setDescription] = useState("");
  const [recording, setRecording] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("video/webm");

  useEffect(() => {
    if (videoResult) return;
    startCamera();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setCameraError(null);
    setRecording(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

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

  function stopRecordingAndCollect(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mimeTypeRef.current }) : null);
        return;
      }
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeTypeRef.current }));
      recorder.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    });
  }

  async function uploadAndGetKey(blob: Blob, mimeType: string): Promise<string> {
    const presignRes = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rentalToken: params.token, kind: "DAMAGE_EVIDENCE", contentType: mimeType }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) throw new Error(presign.error ?? "presign failed");
    const putRes = await fetch(presign.uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
    if (!putRes.ok) throw new Error("upload failed");
    return presign.storageKey;
  }

  async function handleStopAndUpload() {
    setUploading(true);
    setCameraError(null);
    try {
      const blob = await stopRecordingAndCollect();
      if (!blob) throw new Error("録画データを取得できませんでした。撮り直してください。");
      const mimeType = mimeTypeRef.current;
      const storageKey = await uploadAndGetKey(blob, mimeType);
      setVideoResult({ storageKey, mimeType });
    } catch (err: any) {
      setCameraError(err.message ?? "アップロードに失敗しました。撮り直してください。");
    } finally {
      setUploading(false);
    }
  }

  function handleRetake() {
    setVideoResult(null);
    setTimeout(startCamera, 0);
  }

  function handleFileFallback(file: File) {
    setUploading(true);
    uploadAndGetKey(file, file.type)
      .then((storageKey) => setVideoResult({ storageKey, mimeType: file.type }))
      .catch((err) => setCameraError(err.message ?? "アップロードに失敗しました"))
      .finally(() => setUploading(false));
  }

  async function handleSubmit() {
    if (!videoResult) {
      setSubmitError("症状が分かる動画を撮影してください。");
      return;
    }
    if (!description.trim()) {
      setSubmitError("症状を入力してください。");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/rentals/${params.token}/defect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey: videoResult.storageKey, mimeType: videoResult.mimeType, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");
      setDone(data.message);
    } catch (err: any) {
      setSubmitError(err.message ?? "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-camly-accent text-xs tracking-widest font-bold mb-3">受付完了</p>
          <p className="text-lg font-bold">{done}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-lg mx-auto">
      <p className="text-camly-accent text-xs tracking-widest font-bold mb-2">初期不良のご申請</p>
      <h1 className="text-2xl font-bold mb-2">症状を動画で撮影してください</h1>
      <p className="text-camly-inkMuted text-sm mb-6">
        破損している箇所や、電源が入らない・正常に動作しないなどの症状が分かるように撮影してください。
      </p>

      {!videoResult ? (
        <>
          <div className="relative rounded-xl overflow-hidden bg-camly-charcoal border border-camly-line aspect-[3/4] mb-4">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {recording && (
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
                <span className="block text-xs text-camly-inkMuted mb-1.5">代わりに動画ファイルを選択</span>
                <input
                  type="file"
                  accept="video/*"
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

          <button
            type="button"
            onClick={handleStopAndUpload}
            disabled={uploading || !recording}
            className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
          >
            {uploading ? "アップロード中…" : "撮影を終えて次へ"}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-camly-line p-4 mb-4 text-sm flex items-center justify-between">
            <span className="text-camly-accent font-bold">✓ 動画を撮影済み</span>
            <button type="button" onClick={handleRetake} className="text-xs underline text-camly-inkMuted">
              撮り直す
            </button>
          </div>

          <label className="block mb-6">
            <span className="block text-xs text-camly-inkMuted mb-1.5">症状を教えてください</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="例: 電源を入れても画面がつかない、レンズ部分に割れがある など"
              className="w-full rounded-lg bg-camly-charcoal border border-camly-line px-4 py-3 text-sm outline-none focus:border-camly-accent resize-none"
            />
          </label>

          {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-full bg-camly-accent text-camly-black font-bold py-4 text-sm disabled:opacity-50"
          >
            {submitting ? "送信中…" : "初期不良を申請する"}
          </button>
        </>
      )}
    </main>
  );
}
