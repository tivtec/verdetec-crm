import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CrmLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--brand-surface)] px-4">
      <div className="rounded-2xl border border-[var(--brand-border)] bg-white/95 px-6 py-5 shadow-sm">
        <LoadingSpinner size="lg" label="Carregando lista..." />
      </div>
    </div>
  );
}

