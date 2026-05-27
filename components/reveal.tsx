"use client";

import { type ReactNode } from "react";
import { useReveal } from "@/lib/use-reveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  direction?: "up" | "left" | "right";
}

/**
 * Wrapper qui anime ses enfants quand ils entrent dans le viewport.
 * Utilise des classes Tailwind + transitions CSS pour la performance.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  direction = "up",
}: RevealProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const Tag = as as "div";

  const transforms: Record<typeof direction, string> = {
    up: "translate-y-8",
    left: "-translate-x-8",
    right: "translate-x-8",
  };

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${transforms[direction]}`,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
