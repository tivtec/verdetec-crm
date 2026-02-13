import { AppShell } from "@/components/layout/app-shell";

type CrmLayoutProps = {
  children: React.ReactNode;
};

export function CrmLayout({ children }: CrmLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
