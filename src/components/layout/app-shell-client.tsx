"use client";

import { useState } from "react";

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

  return (
    <div className="h-dvh bg-[var(--brand-surface)]">
      <AppSidebar
        profile={profile}
        navigation={navigation}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div
        className={cn(
          "h-dvh w-full transition-[padding] duration-200",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-56",
        )}
      >
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
