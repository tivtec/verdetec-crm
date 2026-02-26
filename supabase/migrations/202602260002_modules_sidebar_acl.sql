-- 1) tabela modulos (base)
create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  nome text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Se a tabela ja existir com schema antigo, garante colunas novas.
alter table if exists public.modulos
  add column if not exists key text;

alter table if exists public.modulos
  add column if not exists nome text;

alter table if exists public.modulos
  add column if not exists sort_order integer;

alter table if exists public.modulos
  add column if not exists is_active boolean;

alter table if exists public.modulos
  add column if not exists created_at timestamptz;

alter table if exists public.modulos
  add column if not exists updated_at timestamptz;

-- defaults/fallback para colunas adicionadas em bases legadas
update public.modulos
set sort_order = 0
where sort_order is null;

update public.modulos
set is_active = true
where is_active is null;

update public.modulos
set created_at = now()
where created_at is null;

update public.modulos
set updated_at = now()
where updated_at is null;

-- tenta aproveitar nome_fantasia/descricao caso existam em schema legado
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'modulos'
      and column_name = 'descricao'
  ) then
    execute 'update public.modulos set nome = coalesce(nome, descricao) where nome is null';
  end if;
end $$;

update public.modulos
set nome = 'Modulo'
where nome is null;

update public.modulos
set key = lower(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g'))
where key is null
   or btrim(key) = '';

do $$
begin
  -- evita duplicidade de key gerada automaticamente
  with duplicated as (
    select id,
           key,
           row_number() over (partition by key order by id) as rn
    from public.modulos
    where key is not null and btrim(key) <> ''
  )
  update public.modulos m
  set key = m.key || '-' || m.id::text
  from duplicated d
  where d.id = m.id
    and d.rn > 1;
exception
  when others then
    null;
end $$;

create unique index if not exists uq_modulos_key
  on public.modulos (key);

alter table public.modulos
  alter column sort_order set default 0;

alter table public.modulos
  alter column is_active set default true;

alter table public.modulos
  alter column created_at set default now();

alter table public.modulos
  alter column updated_at set default now();

-- 2) crm_pages -> id_modulo
alter table public.crm_pages
  add column if not exists id_modulo uuid;

do $$
declare
  v_modulos_id_type text;
  v_crm_pages_modulo_type text;
begin
  select c.data_type
    into v_modulos_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'modulos'
    and c.column_name = 'id';

  select c.data_type
    into v_crm_pages_modulo_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'crm_pages'
    and c.column_name = 'id_modulo';

  if v_modulos_id_type = 'uuid'
     and v_crm_pages_modulo_type = 'uuid'
     and not exists (
       select 1 from pg_constraint where conname = 'crm_pages_id_modulo_fkey'
     ) then
    alter table public.crm_pages
      add constraint crm_pages_id_modulo_fkey
      foreign key (id_modulo) references public.modulos(id);
  end if;
end $$;

create index if not exists idx_crm_pages_id_modulo
  on public.crm_pages (id_modulo, is_active, sort_order);

-- 3) usuarios -> modulo ativo
alter table public.usuarios
  add column if not exists id_modulo_ativo uuid;

do $$
declare
  v_modulos_id_type text;
  v_usuarios_modulo_type text;
begin
  select c.data_type
    into v_modulos_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'modulos'
    and c.column_name = 'id';

  select c.data_type
    into v_usuarios_modulo_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'usuarios'
    and c.column_name = 'id_modulo_ativo';

  if v_modulos_id_type = 'uuid'
     and v_usuarios_modulo_type = 'uuid'
     and not exists (
       select 1 from pg_constraint where conname = 'usuarios_id_modulo_ativo_fkey'
     ) then
    alter table public.usuarios
      add constraint usuarios_id_modulo_ativo_fkey
      foreign key (id_modulo_ativo) references public.modulos(id);
  end if;
end $$;

create index if not exists idx_usuarios_id_modulo_ativo
  on public.usuarios (id_modulo_ativo);

-- 4) seed modulo padrão CRM
insert into public.modulos (key, nome, sort_order, is_active)
values ('crm', 'Verdetec CRM', 10, true)
on conflict (key) do update
set nome = excluded.nome,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

-- 5) backfill páginas sem módulo para CRM
update public.crm_pages p
set id_modulo = m.id
from public.modulos m
where m.key = 'crm'
  and p.id_modulo is null;

-- 6) backfill usuários sem modulo ativo para CRM
update public.usuarios u
set id_modulo_ativo = m.id
from public.modulos m
where m.key = 'crm'
  and u.id_modulo_ativo is null;

-- 7) trigger de updated_at para modulos (se função já existir na base ACL)
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'crm_touch_updated_at'
  ) then
    execute 'drop trigger if exists trg_modulos_touch_updated_at on public.modulos';
    execute 'create trigger trg_modulos_touch_updated_at
             before update on public.modulos
             for each row execute function public.crm_touch_updated_at()';
  end if;
end $$;
