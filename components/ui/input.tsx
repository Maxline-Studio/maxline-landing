import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          "w-full h-11 px-3 text-base",
          "bg-white border rounded-md",
          "placeholder:text-neutral-400",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1",
          "disabled:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed",
          error
            ? "border-error-500 focus-visible:border-error-500"
            : "border-neutral-300 focus-visible:border-primary-500",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
