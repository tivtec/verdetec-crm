import { CrmLayout as CrmShellLayout } from "@/layouts/crm-layout";

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmShellLayout>{children}</CrmShellLayout>;
}
