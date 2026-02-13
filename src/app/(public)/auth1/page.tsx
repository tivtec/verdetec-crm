import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Auth1Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-surface)] p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Fluxo Auth1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            Esta rota foi mantida por compatibilidade com o projeto original no FlutterFlow.
          </p>
          <p>Use o login principal para iniciar sessão e seguir para o Splash.</p>
          <Link href="/login" className="font-medium text-[var(--brand-primary)] hover:underline">
            Ir para Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
