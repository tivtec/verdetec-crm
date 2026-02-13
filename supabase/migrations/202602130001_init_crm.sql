-- Verdetec Conecta CRM - initial schema
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.org_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  vertical text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  level int not null default 1
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  full_name text not null,
  email text not null,
  role_id uuid references public.roles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  scope_type text not null check (scope_type in ('org', 'unit', 'self')),
  unit_id uuid references public.org_units(id) on delete set null,
  primary key (user_id, role_id, scope_type)
);

create table if not exists public.etiquetas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  nome text not null,
  cor text,
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  etiqueta text,
  status text not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  razao_social text not null,
  cnpj text,
  vertical text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email text,
  telefone text,
  origem text,
  status text not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_histories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  etapa text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  valor_total numeric(12,2) not null default 0,
  status text not null default 'novo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid references public.org_units(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'agendado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  valor numeric(12,2) not null,
  status text not null default 'rascunho',
  created_at timestamptz not null default now()
);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  status text not null default 'pendente',
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_clientes on public.clientes;
create trigger set_updated_at_clientes
before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_empresas on public.empresas;
create trigger set_updated_at_empresas
before update on public.empresas
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_leads on public.leads;
create trigger set_updated_at_leads
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_pedidos on public.pedidos;
create trigger set_updated_at_pedidos
before update on public.pedidos
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_agenda_events on public.agenda_events;
create trigger set_updated_at_agenda_events
before update on public.agenda_events
for each row execute function public.set_updated_at();

create or replace function public.user_can_access(
  row_company uuid,
  row_unit uuid,
  row_owner uuid
)
returns boolean
language plpgsql
stable
as $$
declare
  claim_company uuid;
  claim_unit uuid;
  claim_role text;
begin
  claim_company := nullif(auth.jwt() ->> 'company_id', '')::uuid;
  claim_unit := nullif(auth.jwt() ->> 'unit_id', '')::uuid;
  claim_role := lower(
    coalesce(auth.jwt() ->> 'role', auth.jwt() ->> 'app_role', '')
  );

  if auth.uid() is null then
    return false;
  end if;

  if claim_company is not null and claim_company = row_company then
    if claim_role in ('org_admin', 'superadm', 'admin') then
      return true;
    end if;

    if claim_role in ('manager', 'gestor') and claim_unit is not null and claim_unit = row_unit then
      return true;
    end if;
  end if;

  if row_owner is not null and row_owner = auth.uid() then
    return true;
  end if;

  return false;
end;
$$;

alter table public.companies enable row level security;
alter table public.org_units enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.clientes enable row level security;
alter table public.empresas enable row level security;
alter table public.leads enable row level security;
alter table public.pedidos enable row level security;
alter table public.pipeline_histories enable row level security;
alter table public.agenda_events enable row level security;
alter table public.etiquetas enable row level security;
alter table public.propostas enable row level security;
alter table public.contratos enable row level security;

drop policy if exists "Org Admin can read all companies" on public.companies;
create policy "Org Admin can read all companies"
on public.companies
for select
using ((auth.jwt() ->> 'company_id')::uuid = id);

drop policy if exists "Org users can read units" on public.org_units;
create policy "Org users can read units"
on public.org_units
for select
using ((auth.jwt() ->> 'company_id')::uuid = company_id);

drop policy if exists "Org users can read roles" on public.roles;
create policy "Org users can read roles"
on public.roles
for select
using ((auth.jwt() ->> 'company_id')::uuid = company_id);

drop policy if exists "Authenticated read permissions" on public.permissions;
create policy "Authenticated read permissions"
on public.permissions
for select
to authenticated
using (true);

drop policy if exists "Org users can read role_permissions" on public.role_permissions;
create policy "Org users can read role_permissions"
on public.role_permissions
for select
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (auth.jwt() ->> 'company_id')::uuid = r.company_id
  )
);

drop policy if exists "Org users can read users" on public.users;
create policy "Org users can read users"
on public.users
for select
using (public.user_can_access(company_id, unit_id, id));

drop policy if exists "Org users can read user_roles" on public.user_roles;
create policy "Org users can read user_roles"
on public.user_roles
for select
using (
  exists (
    select 1
    from public.users u
    where u.id = user_roles.user_id
      and public.user_can_access(u.company_id, u.unit_id, u.id)
  )
);

drop policy if exists "Org Admin can manage users" on public.users;
create policy "Org Admin can manage users"
on public.users
for all
using (
  (auth.jwt() ->> 'company_id')::uuid = company_id
  and lower(coalesce(auth.jwt() ->> 'role', auth.jwt() ->> 'app_role', '')) in ('org_admin', 'superadm', 'admin')
)
with check (
  (auth.jwt() ->> 'company_id')::uuid = company_id
);

drop policy if exists "User scoped access clientes" on public.clientes;
create policy "User scoped access clientes"
on public.clientes
for all
using (public.user_can_access(company_id, unit_id, owner_id))
with check (public.user_can_access(company_id, unit_id, owner_id));

drop policy if exists "User scoped access empresas" on public.empresas;
create policy "User scoped access empresas"
on public.empresas
for all
using (public.user_can_access(company_id, unit_id, owner_id))
with check (public.user_can_access(company_id, unit_id, owner_id));

drop policy if exists "User scoped access leads" on public.leads;
create policy "User scoped access leads"
on public.leads
for all
using (public.user_can_access(company_id, unit_id, owner_id))
with check (public.user_can_access(company_id, unit_id, owner_id));

drop policy if exists "User scoped access pedidos" on public.pedidos;
create policy "User scoped access pedidos"
on public.pedidos
for all
using (public.user_can_access(company_id, unit_id, owner_id))
with check (public.user_can_access(company_id, unit_id, owner_id));

drop policy if exists "User scoped access agenda" on public.agenda_events;
create policy "User scoped access agenda"
on public.agenda_events
for all
using (public.user_can_access(company_id, unit_id, owner_id))
with check (public.user_can_access(company_id, unit_id, owner_id));

drop policy if exists "User scoped access pipeline" on public.pipeline_histories;
create policy "User scoped access pipeline"
on public.pipeline_histories
for select
using ((auth.jwt() ->> 'company_id')::uuid = company_id);

drop policy if exists "User scoped access etiquetas" on public.etiquetas;
create policy "User scoped access etiquetas"
on public.etiquetas
for all
using ((auth.jwt() ->> 'company_id')::uuid = company_id)
with check ((auth.jwt() ->> 'company_id')::uuid = company_id);

drop policy if exists "User scoped access propostas" on public.propostas;
create policy "User scoped access propostas"
on public.propostas
for all
using ((auth.jwt() ->> 'company_id')::uuid = company_id)
with check ((auth.jwt() ->> 'company_id')::uuid = company_id);

drop policy if exists "User scoped access contratos" on public.contratos;
create policy "User scoped access contratos"
on public.contratos
for all
using ((auth.jwt() ->> 'company_id')::uuid = company_id)
with check ((auth.jwt() ->> 'company_id')::uuid = company_id);

create or replace view public.view_dashboard_metrics as
select
  c.company_id,
  count(*) filter (where c.status <> 'inativo')::int as total_clientes,
  (select count(*)::int from public.empresas e where e.company_id = c.company_id) as total_empresas,
  (select count(*)::int from public.pedidos p where p.company_id = c.company_id) as total_pedidos,
  coalesce(
    (select avg(p.valor_total) from public.pedidos p where p.company_id = c.company_id),
    0
  )::numeric(12,2) as ticket_medio,
  min(c.created_at) as period_start,
  max(c.created_at) as period_end
from public.clientes c
group by c.company_id;

create or replace function public.rpc_get_clientes_funil(
  p_company_id uuid,
  p_vertical text default null
)
returns table (
  etiqueta text,
  total int
)
language sql
stable
as $$
  select
    coalesce(c.etiqueta, 'Sem etiqueta') as etiqueta,
    count(*)::int as total
  from public.clientes c
  where c.company_id = p_company_id
  group by 1
  order by 2 desc;
$$;

create or replace function public.rpc_paginate_clientes(
  p_company_id uuid,
  p_search text default null,
  p_offset int default 0,
  p_limit int default 20
)
returns setof public.clientes
language sql
stable
as $$
  select *
  from public.clientes c
  where c.company_id = p_company_id
    and (
      p_search is null
      or c.nome ilike '%' || p_search || '%'
      or c.email ilike '%' || p_search || '%'
    )
  order by c.created_at desc
  offset greatest(p_offset, 0)
  limit greatest(p_limit, 1);
$$;

create or replace function public.rpc_notify_channel(
  p_channel text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  perform pg_notify(p_channel, p_payload::text);
end;
$$;

grant execute on function public.rpc_get_clientes_funil(uuid, text) to authenticated;
grant execute on function public.rpc_paginate_clientes(uuid, text, int, int) to authenticated;
grant execute on function public.rpc_notify_channel(text, jsonb) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.pipeline_histories;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.agenda_events;
exception
  when duplicate_object then null;
end;
$$;

insert into public.permissions (key, description)
values
  ('dashboard:read', 'Visualizar dashboard'),
  ('clientes:read', 'Visualizar clientes'),
  ('clientes:write', 'Editar clientes'),
  ('empresas:read', 'Visualizar empresas'),
  ('empresas:write', 'Editar empresas'),
  ('pedidos:read', 'Visualizar pedidos'),
  ('pedidos:write', 'Editar pedidos'),
  ('usuarios:read', 'Visualizar usuários'),
  ('usuarios:write', 'Editar usuários'),
  ('agenda:read', 'Visualizar agenda'),
  ('agenda:write', 'Editar agenda'),
  ('invoice:read', 'Visualizar invoice'),
  ('portal:submit', 'Enviar solicitação de portal')
on conflict (key) do nothing;
