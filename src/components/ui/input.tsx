import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
