import { cn } from "@/utils/cn";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return <section className={cn("flex-1 p-4 lg:p-8", className)}>{children}</section>;
}
