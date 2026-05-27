import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full",
  {
    variants: {
      variant: {
        primary: "bg-rouge-500 text-ivory-50 font-mono uppercase tracking-widest",
        cobalt: "bg-encre-500 text-ivory-50 font-mono uppercase tracking-widest",
        ink: "bg-ink-900 text-ivory-50 font-mono uppercase tracking-widest",
        outline: "bg-transparent text-rouge-500 border border-rouge-500 font-mono uppercase tracking-widest",
        success: "bg-success-500/10 text-success-600 border border-success-500/20",
        warning: "bg-warning-500/10 text-warning-600 border border-warning-500/20",
        error: "bg-error-500/10 text-error-600 border border-error-500/20",
        neutral: "bg-ivory-100 text-ink-700 border border-ivory-200",
        cream: "bg-ivory-100 text-ink-800 border border-ivory-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
