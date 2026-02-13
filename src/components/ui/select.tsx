import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-[var(--brand-border)] bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Select.displayName = "Select";
