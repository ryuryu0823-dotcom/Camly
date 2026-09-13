"use client";

import { useEffect } from "react";

/**
 * ギャラリーの横スクロール帯を継ぎ目なくループさせるため、
 * マウント時に一度だけ子要素を複製する(CSSのtranslateX(-50%)→0%アニメーションと対で機能)。
 * data-loopedで多重複製(React Strict Modeの二重実行)を防ぐ。
 */
export default function GalleryLoop({ trackId }: { trackId: string }) {
  useEffect(() => {
    const track = document.getElementById(trackId);
    if (track && track.dataset.looped !== "true") {
      track.insertAdjacentHTML("beforeend", track.innerHTML);
      track.dataset.looped = "true";
    }
  }, [trackId]);

  return null;
}
