import { z } from "zod";

export const idSchema = z.string().uuid();

export const clienteSchema = z.object({
  id: idSchema,
  nome: z.string().min(2),
  email: z.string().email().nullable(),
  telefone: z.string().nullable(),
  etiqueta: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
});
export type Cliente = z.infer<typeof clienteSchema>;

export const empresaSchema = z.object({
  id: idSchema,
  razao_social: z.string().min(2),
  cnpj: z.string().nullable(),
  vertical: z.string().nullable(),
  created_at: z.string(),
});
export type Empresa = z.infer<typeof empresaSchema>;

export const pedidoSchema = z.object({
  id: idSchema,
  cliente: z.string().nullable(),
  status: z.string(),
  valor_total: z.number(),
  created_at: z.string(),
});
export type Pedido = z.infer<typeof pedidoSchema>;

export const agendaEventSchema = z.object({
  id: idSchema,
  title: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.string(),
});
export type AgendaEvent = z.infer<typeof agendaEventSchema>;
