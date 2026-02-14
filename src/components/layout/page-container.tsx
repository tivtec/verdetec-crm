import { cn } from "@/utils/cn";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section className={cn("min-h-0 flex-1 overflow-y-auto p-4 lg:p-8", className)}>
      {children}
    </section>
  );
}
