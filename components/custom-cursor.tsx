"use client";

import { useEffect, useState } from "react";

/**
 * Curseur custom Maxline — signature visuelle.
 * - Un point terracotta qui suit le curseur
 * - S'agrandit en cadre arrondi au hover sur les éléments interactifs
 * - Désactivé sur mobile / touch / reduced motion
 */
export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Désactiver sur touch / mobile / reduced-motion
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isTouch || reducedMotion) return;
    setEnabled(true);

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Détecter si on est au-dessus d'un élément interactif
      const target = e.target as HTMLElement;
      const interactive =
        target.closest("a, button, [role='button'], input, textarea, label") !==
        null;
      setIsPointer(interactive);
    };

    const handleLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Curseur principal — petit point terracotta */}
      <div
        aria-hidden
        className="fixed pointer-events-none z-[9999] hidden lg:block"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 200ms ease-out",
        }}
      >
        <div
          className="transition-all duration-200 ease-out"
          style={{
            width: isPointer ? 40 : 8,
            height: isPointer ? 40 : 8,
            borderRadius: isPointer ? 8 : 999,
            background: isPointer
              ? "transparent"
              : "rgba(196, 106, 69, 0.9)",
            border: isPointer ? "2px solid #C46A45" : "none",
            mixBlendMode: isPointer ? "normal" : "multiply",
          }}
        />
      </div>

    </>
  );
}
