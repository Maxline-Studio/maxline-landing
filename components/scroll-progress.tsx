"use client";

import { useEffect, useState } from "react";

/**
 * Barre de progression fine en haut absolu de la page.
 * Lime, glowy, motion signature Maxline.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      const p = Math.max(0, Math.min(100, (window.scrollY / docHeight) * 100));
      setProgress(p);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] bg-rouge-500 z-[100] pointer-events-none"
      style={{
        width: `${progress}%`,
        transition: "width 80ms linear",
      }}
      aria-hidden
    />
  );
}
