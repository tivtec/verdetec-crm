"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nome: z.string().min(3, "Informe o nome do solicitante"),
  empresa: z.string().min(2, "Informe a empresa"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone inválido"),
  vertical: z.string().min(1, "Selecione uma vertical"),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SolicitacaoPortalPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      vertical: "",
      observacoes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/n8n/lead-created", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus("success");
      setMessage("Solicitação enviada com sucesso. O gestor foi notificado.");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erro ao enviar solicitação.");
    }
  }

  return (
    <>
      <AppHeader
        title="Solicitação Portal"
        subtitle="Cadastro de solicitações com envio para n8n e notificação de admin."
      />
      <PageContainer>
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Nova solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" {...form.register("nome")} />
                {form.formState.errors.nome ? (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.nome.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" {...form.register("empresa")} />
                {form.formState.errors.empresa ? (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.empresa.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" {...form.register("telefone")} />
                {form.formState.errors.telefone ? (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.telefone.message}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="vertical">Vertical</Label>
                <Select id="vertical" {...form.register("vertical")}>
                  <option value="">Selecione uma vertical</option>
                  <option value="hidrossemeadura">Hidrossemeadura</option>
                  <option value="irrigacao">Irrigação</option>
                  <option value="paisagismo">Paisagismo</option>
                </Select>
                {form.formState.errors.vertical ? (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.vertical.message}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" {...form.register("observacoes")} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                {status !== "idle" ? (
                  <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                    {message}
                  </p>
                ) : (
                  <span />
                )}
                <Button type="submit">Enviar solicitação</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
