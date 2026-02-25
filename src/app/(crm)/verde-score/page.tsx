import { PageContainer } from "@/components/layout/page-container";

const verdeScoreUrl = "https://score.verdetec.com/";

export default function VerdeScorePage() {
  return (
    <PageContainer className="h-full min-h-0 bg-[#eceef0] [&>div]:h-full [&>div>div]:h-full">
      <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
        <iframe title="Verde Score" src={verdeScoreUrl} className="h-full w-full border-0" />
      </div>
    </PageContainer>
  );
}
