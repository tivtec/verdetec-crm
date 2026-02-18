import { cn } from "@/utils/cn";

type LoadingSpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  spinnerClassName?: string;
  labelClassName?: string;
};

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-4",
} as const;

export function LoadingSpinner({
  label,
  size = "md",
  className,
  spinnerClassName,
  labelClassName,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("inline-flex items-center justify-center gap-2", className)} role="status" aria-live="polite">
      <span
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent text-[#1f4f52]",
          sizeMap[size],
          spinnerClassName,
        )}
        aria-hidden="true"
      />
      {label ? <span className={cn("text-sm text-[#466568]", labelClassName)}>{label}</span> : null}
    </div>
  );
}

