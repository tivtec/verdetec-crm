import { GlassFilter } from "@/components/ui/liquid-radio";
import { cn } from "@/utils/cn";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section className={cn("min-h-0 flex-1 overflow-y-auto p-4 lg:p-8", className)}>
      <div className="relative min-h-full overflow-hidden rounded-2xl border border-white/50 bg-[rgba(238,240,242,0.48)] shadow-[0_20px_46px_rgba(15,80,80,0.2),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl">
        <GlassFilter />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/58 via-white/18 to-transparent" />
        <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-55" style={{ filter: 'url("#radio-glass")' }} />
        <div className="pointer-events-none absolute -top-10 left-5 h-24 w-52 rounded-full bg-white/55 blur-xl" />
        <div className="pointer-events-none absolute right-4 bottom-0 h-28 w-64 rounded-full bg-[#6ca89a]/40 blur-2xl" />

        <div className="relative z-10 p-3 sm:p-4 lg:p-5">{children}</div>
      </div>
    </section>
  );
}
