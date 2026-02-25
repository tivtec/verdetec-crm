import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { GlassFilter } from "@/components/ui/liquid-radio";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-[var(--brand-surface)] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:flex">
        <Image
          src="/brand/grama.jpg"
          alt="Verdetec"
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
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
              Gestao de clientes, propostas e agenda em um so lugar.
            </h1>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden p-6 lg:p-10">
        <GlassFilter />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(127,192,176,0.62),transparent_42%),radial-gradient(circle_at_84%_18%,rgba(188,229,218,0.5),transparent_48%),radial-gradient(circle_at_66%_78%,rgba(93,152,138,0.4),transparent_56%),linear-gradient(150deg,rgba(227,239,235,0.95),rgba(211,226,221,0.92))]" />
        <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-soft-light" style={{ filter: 'url("#radio-glass")' }} />
        <div className="pointer-events-none absolute -top-12 left-4 h-32 w-64 rounded-full bg-white/60 blur-xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-36 w-72 rounded-full bg-[#6ca89a]/40 blur-2xl" />

        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/65 bg-white/25 p-6 shadow-[0_30px_95px_rgba(28,72,65,0.3),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/14 to-transparent" />
          <div className="pointer-events-none absolute -top-8 left-8 h-24 w-52 rounded-full bg-white/56 blur-xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-32 w-52 rounded-full bg-[#79b7a8]/35 blur-2xl" />

          <div className="relative z-10">
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex items-center justify-center">
                <Image
                  src="/brand/Icon@3x.png"
                  alt="Logo Verdetec"
                  width={300}
                  height={172}
                  className="h-auto w-[230px] object-contain drop-shadow-[0_4px_10px_rgba(15,80,80,0.18)]"
                />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Bem-vindo</h2>
              <p className="text-sm text-slate-600">Entre com seus dados para acessar o CRM.</p>
            </div>

            <Suspense fallback={<p className="text-center text-sm text-slate-500">Carregando formulario...</p>}>
              <LoginForm />
            </Suspense>

            {/* Oculto temporariamente ate a configuracao final do fluxo */}
            {/* <div className="mt-4 text-center text-sm text-slate-500">
            <Link href="/novasenha" className="font-medium text-[var(--brand-primary)] hover:underline">
              Esqueci minha senha
            </Link>
          </div> */}
          </div>
        </div>
      </section>
    </div>
  );
}
