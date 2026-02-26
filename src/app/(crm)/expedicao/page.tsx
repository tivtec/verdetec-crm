import { ExpedicaoShell } from "@/components/expedicao/expedicao-shell";
import { PageContainer } from "@/components/layout/page-container";

export default function ExpedicaoPage() {
  return (
    <PageContainer className="bg-[#eceef0]">
      <div className="rounded-2xl bg-[#e4e6e8] p-4">
        <ExpedicaoShell />
      </div>
    </PageContainer>
  );
}

