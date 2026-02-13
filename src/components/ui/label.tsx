import type { LabelHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn("mb-1 block text-sm font-medium text-slate-700", className)} {...props} />;
}
