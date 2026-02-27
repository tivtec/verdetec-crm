-- Wrapper RPC com parametros nomeados para consumo via PostgREST/Supabase RPC.
-- A funcao legado public.performance(data_ini, data_fim) pode ter assinatura
-- nao amigavel para RPC nomeado; este wrapper padroniza a chamada.

create or replace function public.dashboard_performance(
  p_data_inicio date,
  p_data_fim date
)
returns table (
  dia date,
  performance numeric
)
language sql
security definer
set search_path = public
as $$
  select
    t.dia::date as dia,
    t.performance::numeric as performance
  from public.performance(p_data_inicio, p_data_fim) as t;
$$;

grant execute on function public.dashboard_performance(date, date) to anon;
grant execute on function public.dashboard_performance(date, date) to authenticated;
grant execute on function public.dashboard_performance(date, date) to service_role;

