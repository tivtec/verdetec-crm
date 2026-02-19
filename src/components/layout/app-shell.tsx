import { AppShellClient } from "@/components/layout/app-shell-client";
import { getCurrentAllowedSidebarPaths } from "@/services/access-control/server";
import { getSidebarProfile } from "@/services/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const [profile, allowedPaths] = await Promise.all([
    getSidebarProfile(),
    getCurrentAllowedSidebarPaths(),
  ]);

  return <AppShellClient profile={profile} allowedPaths={allowedPaths}>{children}</AppShellClient>;
}
