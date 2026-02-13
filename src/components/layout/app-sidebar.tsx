"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { cn } from "@/utils/cn";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: UsersRound },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/pedido", label: "Pedidos", icon: ClipboardList },
  { href: "/usuarios", label: "Usuários", icon: UserRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/solicitacao-portal", label: "Portal", icon: ShieldCheck },
  { href: "/invoice", label: "Invoice", icon: ReceiptText },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-[var(--brand-border)] bg-[var(--brand-primary-soft)] px-4 py-5 lg:flex">
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
        <Image src="/brand/Icon.png" alt="Verdetec" width={36} height={36} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Verdetec CRM</p>
          <p className="text-xs text-slate-500">Conecta</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-slate-700 hover:bg-white hover:text-slate-900",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--brand-border)] bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ambiente</p>
        <p className="mt-1 text-sm font-medium text-slate-900">Empresa Demo</p>
        <p className="text-xs text-slate-500">Vertical Hidrossemeadura</p>
      </div>
    </aside>
  );
}
