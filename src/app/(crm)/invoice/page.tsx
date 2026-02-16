import { PageContainer } from "@/components/layout/page-container";

const invoiceUrl = "https://invoice-verdetec.vercel.app/";

export default function InvoicePage() {
  return (
    <PageContainer className="h-[calc(100dvh-96px)] bg-[#eceef0]">
      <div className="h-full overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
        <iframe title="Invoice Verdetec" src={invoiceUrl} className="h-full w-full" />
      </div>
    </PageContainer>
  );
}
