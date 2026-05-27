import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full",
  {
    variants: {
      variant: {
        primary: "bg-primary-100 text-primary-800 border border-primary-200",
        success: "bg-success-500/10 text-success-600 border border-success-500/20",
        warning: "bg-warning-500/10 text-warning-600 border border-warning-500/20",
        error: "bg-error-500/10 text-error-600 border border-error-500/20",
        neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
        cream: "bg-cream-100 text-neutral-800 border border-cream-200",
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
