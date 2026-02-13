import { ExternalLink } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";

const invoiceUrl = process.env.NEXT_PUBLIC_INVOICE_URL ?? "https://example.com";

export default function InvoicePage() {
  return (
    <>
      <AppHeader title="Invoice" subtitle="Integração externa com sistema financeiro." />
      <PageContainer className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <p className="text-sm text-slate-600">
              URL configurada via <code>NEXT_PUBLIC_INVOICE_URL</code>.
            </p>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir em nova aba
            </a>
          </CardContent>
        </Card>

        <div className="h-[72vh] overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
          <iframe title="Invoice" src={invoiceUrl} className="h-full w-full" />
        </div>
      </PageContainer>
    </>
  );
}
