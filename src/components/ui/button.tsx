import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const variantClasses = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-strong)] border-transparent",
  secondary:
    "bg-white text-[var(--brand-ink)] hover:bg-slate-100 border-[var(--brand-border)]",
  ghost: "bg-transparent text-[var(--brand-ink)] hover:bg-slate-100 border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
} as const;

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
