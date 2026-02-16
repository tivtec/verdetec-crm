import { PageContainer } from "@/components/layout/page-container";

const mixSementesWidgetUrl = "/widgets/mix-sementes.html";

export default function MixSementesPage() {
  return (
    <PageContainer className="h-[calc(100dvh-96px)] bg-[#eceef0]">
      <div className="h-full overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
        <iframe title="Mix de sementes" src={mixSementesWidgetUrl} className="h-full w-full border-0" />
      </div>
    </PageContainer>
  );
}

