"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import type { SidebarNavigationSnapshot } from "@/services/access-control/types";
import { cn } from "@/utils/cn";

type AppShellClientProps = {
  children: React.ReactNode;
  profile: {
    userName: string;
    organizationName: string;
    organizationLogoUrl: string | null;
  };
  navigation: SidebarNavigationSnapshot | null;
};

export function AppShellClient({ children, profile, navigation }: AppShellClientProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDashboardFullscreen =
    pathname === "/dashboard" && searchParams.get("fullscreen") === "1";
  const showSidebar = !isDashboardFullscreen;

  return (
    <div className="h-dvh bg-[var(--brand-surface)]">
      {showSidebar ? (
        <AppSidebar
          profile={profile}
          navigation={navigation}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      ) : null}
      <div
        className={cn(
          "h-dvh w-full transition-[padding] duration-200",
          showSidebar ? (isSidebarCollapsed ? "lg:pl-20" : "lg:pl-56") : "pl-0",
        )}
      >
        <main className={cn("flex h-full flex-col overflow-hidden", isDashboardFullscreen && "bg-[#eef0f2]")}>
          {children}
        </main>
      </div>
    </div>
  );
}
