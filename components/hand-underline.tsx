"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "rouge" | "ivory" | "encre";

interface HandUnderlineProps {
  children: React.ReactNode;
  variant?: Variant;
  /** Trait dessiné de manière permanente ou animé au viewport */
  animate?: boolean;
  /** Style du trait : `straight` plus fin et droit, `wavy` ondulé (défaut) */
  style?: "wavy" | "straight";
  className?: string;
}

const STROKE: Record<Variant, string> = {
  rouge: "#C8392F",
  ivory: "#F8F4E9",
  encre: "#1D3557",
};

/**
 * Signature Maxline : un trait au stylo qui souligne un mot.
 * Au scroll dans le viewport, le trait se TRACE de gauche à droite
 * — façon correcteur qui annote en passant.
 */
export function HandUnderline({
  children,
  variant = "rouge",
  animate = true,
  style = "wavy",
  className,
}: HandUnderlineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5, rootMargin: "0px 0px -80px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animate]);

  const stroke = STROKE[variant];
  const path =
    style === "wavy"
      ? "M2 6 Q 25 2, 50 5 T 98 4"
      : "M2 5 L98 4";

  return (
    <span
      ref={ref}
      className={cn("relative inline-block whitespace-pre", className)}
    >
      {children}
      <svg
        aria-hidden
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="absolute left-0 right-0 -bottom-1 w-full pointer-events-none"
        style={{ height: "0.42em" }}
      >
        <path
          d={path}
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinecap="round"
          fill="none"
          style={{
            strokeDasharray: 110,
            strokeDashoffset: visible ? 0 : 110,
            transition: "stroke-dashoffset 900ms cubic-bezier(0.19, 1, 0.22, 1)",
          }}
        />
      </svg>
    </span>
  );
}
