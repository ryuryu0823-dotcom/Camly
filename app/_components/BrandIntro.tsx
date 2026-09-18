"use client";

import { useEffect, useState } from "react";

const VISIBLE_MS = 1800;
const FADE_MS = 600;

/**
 * サイトを開いた瞬間に画面いっぱいに表示されるロゴのスプラッシュ演出。
 * 一定時間表示したあと自動でフェードアウトし、下にある実際のホーム画面(ヘッダー・hero)を見せる。
 * クリック/タップで即座にスキップできる。prefers-reduced-motionの場合は表示せずすぐ消す。
 */
export default function BrandIntro() {
  const [hiding, setHiding] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setMounted(false);
      return;
    }
    const showTimer = setTimeout(() => setHiding(true), VISIBLE_MS);
    const removeTimer = setTimeout(() => setMounted(false), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`brand-intro${hiding ? " is-hiding" : ""}`}
      aria-hidden="true"
      onClick={() => setHiding(true)}
      onTransitionEnd={() => hiding && setMounted(false)}
    >
      <img className="logo" src="/camly-logo.png" alt="" />
      <p className="tagline">
        Capture your moment,
        <br />
        anywhere.
      </p>
    </div>
  );
}
