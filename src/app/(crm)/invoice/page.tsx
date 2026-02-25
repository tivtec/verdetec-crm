import { PageContainer } from "@/components/layout/page-container";

const invoiceUrl = "https://invoice-verdetec.vercel.app/";

export default function InvoicePage() {
  return (
    <PageContainer className="h-full min-h-0 bg-[#eceef0] [&>div]:h-full [&>div>div]:h-full">
      <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
        <iframe title="Invoice Verdetec" src={invoiceUrl} className="h-full w-full border-0" />
      </div>
    </PageContainer>
  );
}
