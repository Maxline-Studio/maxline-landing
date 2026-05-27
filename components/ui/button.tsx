import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2",
    "font-semibold whitespace-nowrap",
    "rounded-md transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary-400 text-neutral-900 hover:bg-primary-300 active:bg-primary-500",
        secondary:
          "bg-transparent border border-neutral-800 text-neutral-900 hover:bg-neutral-900 hover:text-cream-50 active:bg-neutral-800",
        ghost:
          "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
        destructive:
          "bg-error-500 text-white hover:bg-error-600 active:bg-error-600",
        link:
          "bg-transparent text-primary-700 underline-offset-4 hover:underline px-0 h-auto",
        cobalt:
          "bg-cobalt-500 text-cream-50 hover:bg-cobalt-600 active:bg-cobalt-700",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
