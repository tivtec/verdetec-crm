import { AppSidebar } from "@/components/layout/app-sidebar";
import { getSidebarProfile } from "@/services/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const profile = await getSidebarProfile();

  return (
    <div className="h-screen bg-[var(--brand-surface)]">
      <AppSidebar profile={profile} />
      <div className="h-screen w-full lg:pl-56">
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
