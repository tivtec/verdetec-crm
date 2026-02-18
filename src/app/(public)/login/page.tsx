import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-[var(--brand-surface)] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:flex">
        <Image
          src="/brand/grama.jpg"
          alt="Verdetec"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/85 to-slate-900/70" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
          <div className="inline-flex items-center gap-3">
            <Image src="/brand/Icon.png" alt="Icone Verdetec" width={48} height={48} />
            <div>
              <p className="text-xl font-semibold">Verdetec Conecta CRM</p>
              <p className="text-sm text-white/80">Plataforma comercial integrada</p>
            </div>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">
              Gestão de clientes, propostas e agenda em um só lugar.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:p-8">
          <div className="mb-6 space-y-2 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary-soft)]">
              <Image src="/brand/Icon.png" alt="Verdetec" width={34} height={34} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Bem-vindo</h2>
            <p className="text-sm text-slate-500">Entre com seus dados para acessar o CRM.</p>
          </div>

          <Suspense fallback={<p className="text-center text-sm text-slate-500">Carregando formulário...</p>}>
            <LoginForm />
          </Suspense>

          {/* Oculto temporariamente ate a configuracao final do fluxo */}
          {/* <div className="mt-4 text-center text-sm text-slate-500">
            <Link href="/novasenha" className="font-medium text-[var(--brand-primary)] hover:underline">
              Esqueci minha senha
            </Link>
          </div> */}
        </div>
      </section>
    </div>
  );
}
