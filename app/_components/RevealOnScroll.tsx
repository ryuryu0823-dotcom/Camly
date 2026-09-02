"use client";

import { useEffect } from "react";

/**
 * [data-reveal]要素をスクロール入場時にフェードインさせる。
 * Artifact版の末尾<script>と同じIntersectionObserverロジックをフックに移植したもの。
 *
 * [data-reveal]要素はCSS側でデフォルトopacity:1(=常に表示)にしてあり、
 * このコンポーネントがマウントできて初めて"reveal-armed"クラスを付けてフェード演出を有効化する。
 * こうしておかないと、サーバーレスのコールドスタートやJSの読み込みが遅れた瞬間に
 * コンテンツが(演出目的のopacity:0のまま)ずっと非表示になってしまう問題が起きるため。
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      return;
    }
    items.forEach((el) => el.classList.add("reveal-armed"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
