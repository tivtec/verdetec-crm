# Verdetec Conecta CRM (Next.js + Supabase)

CRM SaaS completo em **Next.js (App Router)**, inspirado nas telas do sistema atual FlutterFlow e preparado para deploy na **Vercel** com backend em **Supabase**.

## Stack
- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Supabase Realtime (leads, funil, agenda)
- React Hook Form + Zod
- TanStack Query + TanStack Table
- Integração com n8n via API routes

## Rotas principais
- Públicas: `/login`, `/splash`, `/auth1`, `/novasenha`, `/redefinirsenha`
- CRM: `/dashboard`, `/dashboard-adm`, `/dashboard-representante`, `/clientes`, `/empresas`, `/pedido`, `/usuarios`, `/agenda`, `/solicitacao-portal`, `/invoice`

## Estrutura
```txt
src/
  app/
    (public)/
    (crm)/
    api/
  components/
  services/
  hooks/
  schemas/
  middleware/
supabase/
  migrations/
```

## Setup local
1. Instale dependências:
```bash
npm install
```

2. Configure variáveis:
```bash
cp .env.example .env.local
```

3. Rode o projeto:
```bash
npm run dev
```

## Supabase
1. Crie um projeto Supabase.
2. Rode a migration:
   - `supabase/migrations/202602130001_init_crm.sql`
3. Configure JWT claims custom (ex.: `company_id`, `unit_id`, `role`, `permissions`) no fluxo de auth.

### Modelagem implementada
- Tabelas: `users`, `companies`, `org_units`, `clientes`, `empresas`, `leads`, `etiquetas`, `pipeline_histories`, `agenda_events`, `pedidos`, `propostas`, `contratos`
- RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`
- RPCs: `rpc_get_clientes_funil`, `rpc_paginate_clientes`, `rpc_notify_channel`
- View: `view_dashboard_metrics`
- RLS com escopo: org / unit / self


## Teste 


## n8n
API route pronta: `POST /api/n8n/:event`
- `lead-created`
- `update-etiqueta`
- `send-notification`

A rota recebe payload do frontend, opcionalmente cria lead provisório no Supabase e encaminha para n8n.

## Deploy Vercel
1. Importar repositório na Vercel.
2. Definir variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `N8N_WEBHOOK_BASE_URL`
   - `N8N_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_INVOICE_URL`
3. Deploy.

## Supabase MCP (Codex)
- Runbook: `docs/mcp-supabase-runbook.md`
- Setup script: `scripts/setup-supabase-mcp.ps1`
- Validation script: `scripts/validate-supabase-mcp.ps1`

Example:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/setup-supabase-mcp.ps1 -StagingProjectRef "<STAGING_PROJECT_REF>"
powershell -ExecutionPolicy Bypass -File ./scripts/validate-supabase-mcp.ps1
```
