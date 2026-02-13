import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--brand-surface)]">
      <AppSidebar />
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
    </div>
  );
}
