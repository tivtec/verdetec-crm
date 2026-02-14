import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen bg-[var(--brand-surface)]">
      <AppSidebar />
      <div className="h-screen w-full lg:pl-72">
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
