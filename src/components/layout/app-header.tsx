import { Bell, Search } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Input } from "@/components/ui/input";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showUtilities?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  showUtilities = true,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--brand-border)] bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>

        {showUtilities ? (
          <div className="flex items-center gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Buscar..." className="pl-9" />
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--brand-border)] text-slate-600 hover:bg-slate-50"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="self-end lg:hidden">
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
