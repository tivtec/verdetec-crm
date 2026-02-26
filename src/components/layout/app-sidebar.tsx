"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Leaf,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { GlassFilter } from "@/components/ui/liquid-radio";
import { cn } from "@/utils/cn";

type AppSidebarProps = {
  profile: {
    userName: string;
    organizationName: string;
    organizationLogoUrl: string | null;
  };
  allowedPaths: string[] | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/clientes", label: "Clientes", icon: UsersRound },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/pedido", label: "Pedidos", icon: ClipboardList },
  { href: "/usuarios", label: "Usuarios", icon: UserRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/expedicao", label: "Expedicao", icon: Truck },
  { href: "/solicitacao-portal", label: "Solicitacoes", icon: ShieldCheck },
  { href: "/mix-sementes", label: "Mix de sementes", icon: Leaf },
  { href: "/verde-score", label: "Verde Score", icon: Gauge },
  { href: "/invoice", label: "Invoice", icon: ReceiptText },
  { href: "/gestao-acessos", label: "Gestao de acessos", icon: KeyRound },
] as const;

const INLINE_LABEL_PATHS = new Set([
  "/dashboard",
  "/campanhas",
  "/clientes",
  "/empresas",
  "/pedido",
  "/usuarios",
  "/agenda",
  "/expedicao",
  "/solicitacao-portal",
  "/mix-sementes",
  "/verde-score",
  "/invoice",
  "/gestao-acessos",
]);

export function AppSidebar({ profile, allowedPaths, collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedSet = allowedPaths ? new Set(allowedPaths) : null;
  const visibleItems = allowedSet
    ? items.filter((item) => allowedSet.has(item.href))
    : items.filter((item) => item.href !== "/gestao-acessos");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden h-dvh flex-col overflow-hidden border-r border-white/35 bg-[rgba(118,167,157,0.42)] py-4 backdrop-blur-xl transition-[width,padding] duration-200 lg:flex",
        collapsed ? "w-20 px-2" : "w-56 px-3",
      )}
    >
      <GlassFilter />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/12 to-transparent" />
      <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-40" style={{ filter: 'url("#radio-glass")' }} />
      <div className="pointer-events-none absolute -top-12 -left-12 h-44 w-44 rounded-full bg-white/30 blur-2xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-52 w-40 rounded-tl-[80px] bg-[#4e8f82]/25 blur-2xl" />

      <div className={cn("mb-3 flex", collapsed ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/45 bg-white/58 text-slate-600 shadow-[0_4px_18px_rgba(15,80,80,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md transition-colors hover:bg-white/72 hover:text-slate-800"
          aria-label={collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
          title={collapsed ? "Expandir" : "Minimizar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "relative mx-1 mb-5 flex shrink-0 items-center rounded-xl border border-white/35 bg-white/52 py-2 shadow-[0_8px_24px_rgba(15,80,80,0.12)] backdrop-blur-md",
          collapsed ? "justify-center px-2" : "gap-2.5 px-2.5",
        )}
      >
        <div className="shrink-0 rounded-md border border-white/60 bg-white/80 p-1 shadow-sm">
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
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-900">Verdetec CRM</p>
            <p className="truncate text-xs text-slate-500">{profile.userName}</p>
          </div>
        ) : null}
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto">
        <ul className="flex flex-col items-start gap-1.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showInlineLabel = INLINE_LABEL_PATHS.has(item.href) && !collapsed;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex h-11 items-center rounded-xl border border-transparent transition-[background-color,border-color,color,box-shadow]",
                    showInlineLabel ? "w-auto min-w-[9.5rem] gap-2 px-3" : "w-11 justify-center",
                    isActive
                      ? "border-white/45 bg-[rgba(15,80,80,0.82)] text-white shadow-[0_8px_20px_rgba(15,80,80,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : "text-slate-700 hover:border-white/40 hover:bg-white/60 hover:text-slate-900 hover:shadow-[0_6px_16px_rgba(15,80,80,0.13)]",
                  )}
                  aria-label={item.label}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      isActive ? "text-white" : "text-slate-600 group-hover:text-slate-800",
                    )}
                  />
                  {showInlineLabel ? (
                    <span className={cn("text-sm font-medium", isActive ? "text-white" : "text-slate-700")}>
                      {item.label}
                    </span>
                  ) : null}

                  {!showInlineLabel ? (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "mx-1 mt-3 shrink-0 rounded-xl border border-white/35 bg-white/52 py-2 shadow-[0_8px_24px_rgba(15,80,80,0.12)] backdrop-blur-md",
          collapsed ? "px-2" : "px-2.5",
        )}
      >
        {!collapsed ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ambiente</p>
            <p className="mt-1 whitespace-normal break-words text-sm leading-snug font-medium text-slate-900">
              {profile.organizationName}
            </p>
          </>
        ) : null}
        <LogoutButton
          className={cn("w-full justify-center", collapsed ? "mt-0" : "mt-3")}
          variant="secondary"
          size="sm"
          label={collapsed ? "" : "Sair"}
        />
      </div>
    </aside>
  );
}
