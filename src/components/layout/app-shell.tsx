import { AppSidebar } from "@/components/layout/app-sidebar";
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

  return (
    <div className="h-dvh bg-[var(--brand-surface)]">
      <AppSidebar profile={profile} allowedPaths={allowedPaths} />
      <div className="h-dvh w-full lg:pl-56">
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
