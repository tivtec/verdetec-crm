"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CadastrarLeadModal() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [representante, setRepresentante] = useState("");

  return (
    <>
      <div className="ml-2">
        <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
          Cadastrar Lead
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-[720px] max-w-[95%] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-semibold text-[#0f5050]">Cadastrar Leads</h3>
              <button
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="text-slate-600 hover:text-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Telefone</label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Seu Telefone"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email"
                  className="w-full rounded-lg bg-[#e6f3ef] px-4 py-3 text-slate-700 outline-none"
                />
              </div>

              <div className="rounded-lg bg-[#e6f3ef] p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Representante</label>
                <select
                  value={representante}
                  onChange={(e) => setRepresentante(e.target.value)}
                  className="w-full rounded-md border border-transparent bg-white px-4 py-3 text-slate-700"
                >
                  <option value="">Selecione</option>
                  <option value="1">Representante 1</option>
                  <option value="2">Representante 2</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" size="md" onClick={() => { /* placeholder */ }}>
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CadastrarLeadModal;
