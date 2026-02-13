import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[120px] w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
