import { AppShellClient } from "@/components/layout/app-shell-client";
import { getCurrentSidebarNavigationSnapshot } from "@/services/access-control/server";
import { getSidebarProfile } from "@/services/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const [profile, navigation] = await Promise.all([
    getSidebarProfile(),
    getCurrentSidebarNavigationSnapshot(),
  ]);

  return <AppShellClient profile={profile} navigation={navigation}>{children}</AppShellClient>;
}
