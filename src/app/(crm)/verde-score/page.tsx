import { PageContainer } from "@/components/layout/page-container";

const verdeScoreUrl = "https://score.verdetec.com/";

export default function VerdeScorePage() {
  return (
    <PageContainer className="h-[calc(100dvh-96px)] bg-[#eceef0]">
      <div className="h-full overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
        <iframe title="Verde Score" src={verdeScoreUrl} className="h-full w-full border-0" />
      </div>
    </PageContainer>
  );
}

