"use client";

import { Suspense, useState } from "react";
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
  return (
    <Suspense fallback={<AppShellFrame profile={profile} navigation={navigation}>{children}</AppShellFrame>}>
      <AppShellClientContent profile={profile} navigation={navigation}>
        {children}
      </AppShellClientContent>
    </Suspense>
  );
}

type AppShellFrameProps = AppShellClientProps & {
  showSidebar?: boolean;
};

function AppShellFrame({ children, profile, navigation, showSidebar = true }: AppShellFrameProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

function AppShellClientContent({ children, profile, navigation }: AppShellClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDashboardFullscreen =
    pathname === "/dashboard" && searchParams.get("fullscreen") === "1";

  return <AppShellFrame profile={profile} navigation={navigation} showSidebar={!isDashboardFullscreen}>{children}</AppShellFrame>;
}
