"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Loader2,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { GlassFilter } from "@/components/ui/liquid-radio";
import type { SidebarNavigationSnapshot } from "@/services/access-control/types";
import { cn } from "@/utils/cn";

type AppSidebarProps = {
  profile: {
    userName: string;
    organizationName: string;
    organizationLogoUrl: string | null;
  };
  navigation: SidebarNavigationSnapshot | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

type SidebarMenuItem = {
  key: string;
  href: string;
  label: string;
};

const FALLBACK_ITEMS: SidebarMenuItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "campanhas", href: "/campanhas", label: "Campanhas" },
  { key: "clientes", href: "/clientes", label: "Clientes" },
  { key: "empresas", href: "/empresas", label: "Empresas" },
  { key: "pedido", href: "/pedido", label: "Pedidos" },
  { key: "usuarios", href: "/usuarios", label: "Usuarios" },
  { key: "agenda", href: "/agenda", label: "Agenda" },
  { key: "expedicao", href: "/expedicao", label: "Expedicao" },
  { key: "solicitacao-portal", href: "/solicitacao-portal", label: "Solicitacoes" },
  { key: "mix-sementes", href: "/mix-sementes", label: "Mix de sementes" },
  { key: "verde-score", href: "/verde-score", label: "Verde Score" },
  { key: "invoice", href: "/invoice", label: "Invoice" },
];

const ICON_BY_PAGE_KEY = {
  dashboard: LayoutDashboard,
  campanhas: Megaphone,
  clientes: UsersRound,
  empresas: Building2,
  pedido: ClipboardList,
  usuarios: UserRound,
  agenda: CalendarDays,
  expedicao: Truck,
  "solicitacao-portal": ShieldCheck,
  "mix-sementes": Leaf,
  "verde-score": Gauge,
  invoice: ReceiptText,
  "gestao-acessos": KeyRound,
} as const;

type ModuleSwitchResponse = {
  ok?: boolean;
  error?: string;
  selected_module_id?: string;
  redirect_path?: string;
};

export function AppSidebar({ profile, navigation, collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [switchingModuleId, setSwitchingModuleId] = useState<string | null>(null);
  const moduleCardRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo<SidebarMenuItem[]>(() => {
    if (navigation?.menuPages && navigation.menuPages.length > 0) {
      return navigation.menuPages.map((page) => ({
        key: page.key,
        href: page.path,
        label: page.label,
      }));
    }
    return FALLBACK_ITEMS;
  }, [navigation]);

  const modules = navigation?.modules ?? [{ id: "__crm_default_module__", key: "crm", nome: "Verdetec CRM", sortOrder: 10 }];
  const selectedModuleId = navigation?.selectedModuleId ?? modules[0]?.id ?? "__crm_default_module__";
  const selectedModuleName = navigation?.selectedModuleName ?? modules[0]?.nome ?? "Verdetec CRM";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!moduleMenuOpen) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (moduleCardRef.current?.contains(target)) {
        return;
      }
      setModuleMenuOpen(false);
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [moduleMenuOpen]);

  const handleModuleChange = async (moduleId: string) => {
    if (!moduleId || moduleId === selectedModuleId || switchingModuleId) {
      setModuleMenuOpen(false);
      return;
    }

    try {
      setSwitchingModuleId(moduleId);
      const response = await fetch("/api/layout/modulo-ativo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module_id: moduleId,
        }),
      });

      const result = (await response.json().catch(() => null)) as ModuleSwitchResponse | null;
      if (!response.ok || !result?.ok) {
        setModuleMenuOpen(false);
        return;
      }

      setModuleMenuOpen(false);
      router.push(result.redirect_path ?? "/dashboard");
      router.refresh();
    } catch {
      setModuleMenuOpen(false);
    } finally {
      setSwitchingModuleId(null);
    }
  };

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
        ref={moduleCardRef}
        className={cn(
          "relative z-40 mx-1 mb-5 shrink-0 rounded-xl border border-white/35 bg-white/52 py-2 shadow-[0_8px_24px_rgba(15,80,80,0.12)] backdrop-blur-md",
          collapsed ? "justify-center px-2" : "gap-2.5 px-2.5",
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (modules.length <= 1 || switchingModuleId) {
              return;
            }
            setModuleMenuOpen((current) => !current);
          }}
          disabled={modules.length <= 1 || switchingModuleId !== null}
          className={cn(
            "flex w-full items-center rounded-lg",
            collapsed ? "justify-center" : "gap-2.5",
            modules.length <= 1 ? "cursor-default" : "hover:bg-white/55",
          )}
          aria-label={`Selecionar modulo. Ativo: ${selectedModuleName}`}
          title={selectedModuleName}
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
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold text-slate-900">{selectedModuleName}</p>
                <p className="truncate text-xs text-slate-500">{profile.userName}</p>
              </div>
              {switchingModuleId ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : modules.length > 1 ? (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-600 transition-transform",
                    moduleMenuOpen ? "rotate-180" : "",
                  )}
                />
              ) : null}
            </>
          ) : null}
        </button>

        {moduleMenuOpen && modules.length > 1 ? (
          <div className="absolute right-2 top-full left-2 z-20 mt-2 rounded-lg border border-white/45 bg-white/95 p-1 shadow-lg backdrop-blur-lg">
            <ul className="max-h-52 overflow-y-auto">
              {modules.map((moduleOption) => (
                <li key={moduleOption.id}>
                  <button
                    type="button"
                    onClick={() => void handleModuleChange(moduleOption.id)}
                    className={cn(
                      "w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      moduleOption.id === selectedModuleId
                        ? "bg-[rgba(15,80,80,0.12)] font-semibold text-[#0f5050]"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {moduleOption.nome}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <nav className="relative z-10 no-scrollbar flex-1 overflow-y-auto">
        <ul className="flex flex-col items-start gap-1.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICON_BY_PAGE_KEY[item.key as keyof typeof ICON_BY_PAGE_KEY] ?? LayoutGrid;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex h-11 items-center rounded-xl border border-transparent transition-[background-color,border-color,color,box-shadow]",
                    !collapsed ? "w-auto min-w-[9.5rem] gap-2 px-3" : "w-11 justify-center",
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
                  {!collapsed ? (
                    <span className={cn("text-sm font-medium", isActive ? "text-white" : "text-slate-700")}>
                      {item.label}
                    </span>
                  ) : null}

                  {collapsed ? (
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
          "relative mx-1 mt-3 shrink-0 rounded-xl border border-white/35 bg-white/52 py-2 shadow-[0_8px_24px_rgba(15,80,80,0.12)] backdrop-blur-md",
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
