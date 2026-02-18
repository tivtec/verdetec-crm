"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Leaf,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/utils/cn";

type AppSidebarProps = {
  profile: {
    userName: string;
    organizationName: string;
    organizationLogoUrl: string | null;
  };
  allowedPaths: string[] | null;
};

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/clientes", label: "Clientes", icon: UsersRound },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/pedido", label: "Pedidos", icon: ClipboardList },
  { href: "/usuarios", label: "Usuarios", icon: UserRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/solicitacao-portal", label: "Solicitacoes", icon: ShieldCheck },
  { href: "/mix-sementes", label: "Mix de sementes", icon: Leaf },
  { href: "/verde-score", label: "Verde Score", icon: Gauge },
  { href: "/invoice", label: "Invoice", icon: ReceiptText },
  { href: "/gestao-acessos", label: "Gestao de acessos", icon: KeyRound },
] as const;

export function AppSidebar({ profile, allowedPaths }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedSet = allowedPaths ? new Set(allowedPaths) : null;
  const visibleItems = allowedSet
    ? items.filter((item) => allowedSet.has(item.href))
    : items.filter((item) => item.href !== "/gestao-acessos");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-56 flex-col border-r border-[var(--brand-border)] bg-[var(--brand-primary-soft)] px-3 py-4 lg:flex">
      <div className="mx-1 mb-5 flex shrink-0 items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 shadow-sm">
        <div className="shrink-0 rounded-md border border-[var(--brand-border)] bg-white p-1">
          {profile.organizationLogoUrl ? (
            <img
              src={profile.organizationLogoUrl}
              alt={`Logo ${profile.organizationName}`}
              className="h-7 w-7 rounded object-contain"
              loading="lazy"
            />
          ) : (
            <Image
              src="/brand/Icon.png"
              alt="Verdetec"
              width={28}
              height={28}
              style={{ width: "auto", height: "auto" }}
            />
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-900">Verdetec CRM</p>
          <p className="truncate text-xs text-slate-500">{profile.userName}</p>
        </div>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto">
        <ul className="flex flex-col items-start gap-1.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-slate-700 hover:bg-white hover:text-slate-900",
                  )}
                  aria-label={item.label}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      isActive ? "text-white" : "text-slate-600 group-hover:text-slate-800",
                    )}
                  />

                  <span className="pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-1 mt-3 shrink-0 rounded-xl border border-[var(--brand-border)] bg-white px-2.5 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ambiente</p>
        <p className="mt-1 whitespace-normal break-words text-sm leading-snug font-medium text-slate-900">
          {profile.organizationName}
        </p>
        <LogoutButton
          className="mt-3 w-full justify-center"
          variant="secondary"
          size="sm"
          label="Sair"
        />
      </div>
    </aside>
  );
}
