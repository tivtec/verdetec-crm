-- Dashboard RPC hardening:
-- - If p_id_usuario > 0, vertical is resolved from usuarios.id_vertical for that user.
-- - If p_id_usuario = 0, uses incoming "vertical" as before.
-- - Keeps output contract used by n8n/dashboard mapping.

create or replace function public.flutterflow_dashboard_001(
  p_data_inicio date default null,
  p_data_fim date default null,
  vertical text default null,
  p_tipo_acesso_2 text default null,
  p_id_usuario integer default 0
)
returns table (
  id bigint,
  nome text,
  usuario_ativo boolean,
  tipo_acesso_2 text,
  total_leads_qualificados integer,
  etiqueta_00 integer,
  etiqueta_10 integer,
  etiqueta_20 integer,
  etiqueta_21 integer,
  etiqueta_05 integer,
  etiqueta_30 integer,
  etiqueta_35 integer,
  etiqueta_40 integer,
  etiqueta_50 integer,
  etiqueta_60 integer,
  etiqueta_61 integer,
  etiqueta_62 integer,
  etiqueta_66 integer,
  valor numeric,
  valor_exebicao numeric,
  des_dur_falada text,
  des_dur_falada_segundos bigint,
  quantidade_linhas integer,
  total_des_dur_falada text,
  total_quantidade_linhas integer,
  mensagem_umbler numeric,
  total_etiqueta_00 integer,
  total_etiqueta_10 integer,
  total_etiqueta_20 integer,
  total_etiqueta_21 integer,
  total_etiqueta_05 integer,
  total_etiqueta_30 integer,
  total_etiqueta_35 integer,
  total_etiqueta_40 integer,
  total_etiqueta_50 integer,
  total_etiqueta_60 integer,
  total_etiqueta_61 integer,
  total_etiqueta_62 integer,
  total_etiqueta_66 integer,
  total_mensagens_gerais numeric,
  total_leads_qualificados_geral integer,
  media_dias_entre numeric,
  media_dias_entre_entrada_e_conversao_individual numeric
)
language plpgsql
as $$
begin
  return query
  with contexto_filtro as (
    select
      case
        when coalesce(p_id_usuario, 0) > 0 then (
          select u_ctx.id_vertical::text
          from public.usuarios u_ctx
          where u_ctx.id = p_id_usuario
          limit 1
        )
        else nullif(btrim(coalesce(vertical, '')), '')
      end as vertical_efetiva,
      nullif(btrim(coalesce(p_tipo_acesso_2, '')), '') as tipo_acesso_efetivo,
      coalesce(p_id_usuario, 0) as usuario_efetivo
  ),
  usuarios_filtrados as (
    select u.id
    from public.usuarios u
    cross join contexto_filtro cf
    where (cf.tipo_acesso_efetivo is null or u.tipo_acesso_2 = cf.tipo_acesso_efetivo)
      and (cf.usuario_efetivo = 0 or u.id = cf.usuario_efetivo)
      and (cf.vertical_efetiva is null or u.id_vertical::text = cf.vertical_efetiva)
  ),
  primeira_entrada as (
    select id_pessoa, min(date_trunc('day', data_criacao)) as data_primeira_entrada
    from public.etiqueta
    group by id_pessoa
  ),
  conversoes as (
    select e.id_usuario, e.id_pessoa, min(date_trunc('day', e.data_criacao)) as data_conversao
    from public.etiqueta e
    where e.etiqueta = '#50'
      and (p_data_inicio is null or e.data_criacao >= p_data_inicio)
      and (p_data_fim is null or e.data_criacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
    group by e.id_usuario, e.id_pessoa
  ),
  tempo_entre_entrada_e_venda as (
    select c.id_usuario, c.id_pessoa,
           date_part('day', c.data_conversao - p.data_primeira_entrada)::int + 1 as dias_entre
    from conversoes c
    join primeira_entrada p on p.id_pessoa = c.id_pessoa
  ),
  resumo_vendas as (
    select tev.id_usuario,
           count(*) as total_vendas,
           sum(tev.dias_entre) as soma_dias
    from tempo_entre_entrada_e_venda tev
    group by tev.id_usuario
  ),
  totais_etiquetas as (
    select
      sum(case when e.etiqueta = '#00' then 1 else 0 end)::int as total_etiqueta_00,
      sum(case when e.etiqueta = '#10' then 1 else 0 end)::int as total_etiqueta_10,
      sum(case when e.etiqueta = '#20' then 1 else 0 end)::int as total_etiqueta_20,
      sum(case when e.etiqueta = '#21' then 1 else 0 end)::int as total_etiqueta_21,
      sum(case when e.etiqueta = '#05' then 1 else 0 end)::int as total_etiqueta_05,
      sum(case when e.etiqueta = '#30' then 1 else 0 end)::int as total_etiqueta_30,
      sum(case when e.etiqueta = '#35' then 1 else 0 end)::int as total_etiqueta_35,
      sum(case when e.etiqueta = '#40' then 1 else 0 end)::int as total_etiqueta_40,
      sum(case when e.etiqueta = '#50' then 1 else 0 end)::int as total_etiqueta_50,
      sum(case when e.etiqueta = '#60' then 1 else 0 end)::int as total_etiqueta_60,
      sum(case when e.etiqueta = '#61' then 1 else 0 end)::int as total_etiqueta_61,
      sum(case when e.etiqueta = '#62' then 1 else 0 end)::int as total_etiqueta_62,
      sum(case when e.etiqueta = '#66' then 1 else 0 end)::int as total_etiqueta_66,
      sum(case when e.etiqueta in ('#00', '#21') then 1 else 0 end)::int as total_leads_qualificados_geral
    from public.etiqueta e
    join usuarios_filtrados uf on uf.id = e.id_usuario
    where (p_data_inicio is null or e.data_criacao >= p_data_inicio)
      and (p_data_fim is null or e.data_criacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
  ),
  total_mensagens as (
    select sum(w.qtd_mensagens)::numeric as total_mensagens_gerais
    from public.wassi w
    join usuarios_filtrados uf on uf.id = w.id_usuarios
    where (p_data_inicio is null or w.data_mensagem >= p_data_inicio)
      and (p_data_fim is null or w.data_mensagem <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
  ),
  media_dias as (
    select round(avg(tev.dias_entre)::numeric, 2) as media_dias_entre
    from tempo_entre_entrada_e_venda tev
  )
  select
    u.id,
    u.nome,
    u.usuario_ativo,
    u.tipo_acesso_2,

    count(case when e.etiqueta in ('#00', '#21') then e.id_pessoa end)::int as total_leads_qualificados,
    count(case when e.etiqueta = '#00' then e.id_pessoa end)::int as etiqueta_00,
    count(case when e.etiqueta = '#10' then e.id_pessoa end)::int as etiqueta_10,
    count(case when e.etiqueta = '#20' then e.id_pessoa end)::int as etiqueta_20,
    count(case when e.etiqueta = '#21' then e.id_pessoa end)::int as etiqueta_21,
    count(case when e.etiqueta = '#05' then e.id_pessoa end)::int as etiqueta_05,
    count(case when e.etiqueta = '#30' then e.id_pessoa end)::int as etiqueta_30,
    count(case when e.etiqueta = '#35' then e.id_pessoa end)::int as etiqueta_35,
    count(case when e.etiqueta = '#40' then e.id_pessoa end)::int as etiqueta_40,
    count(case when e.etiqueta = '#50' then e.id_pessoa end)::int as etiqueta_50,
    count(case when e.etiqueta = '#60' then e.id_pessoa end)::int as etiqueta_60,
    count(case when e.etiqueta = '#61' then e.id_pessoa end)::int as etiqueta_61,
    count(case when e.etiqueta = '#62' then e.id_pessoa end)::int as etiqueta_62,
    count(case when e.etiqueta = '#66' then e.id_pessoa end)::int as etiqueta_66,

    coalesce(l.valor, 0)::numeric as valor,
    coalesce(l.valor_exebicao, 0)::numeric as valor_exebicao,

    coalesce(
      (
        select to_char(sum(
          split_part(z.des_dur_falada, ':', 1)::int * interval '1 hour' +
          split_part(z.des_dur_falada, ':', 2)::int * interval '1 minute' +
          split_part(z.des_dur_falada, ':', 3)::int * interval '1 second'
        ), 'HH24:MI:SS')
        from public.zenvia z
        where z.id_usuario = u.id
          and (p_data_inicio is null or z.data_ligacao >= p_data_inicio)
          and (p_data_fim is null or z.data_ligacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      '00:00:00'
    ) as des_dur_falada,

    coalesce(
      (
        select sum(extract(epoch from (
          split_part(z.des_dur_falada, ':', 1)::int * interval '1 hour' +
          split_part(z.des_dur_falada, ':', 2)::int * interval '1 minute' +
          split_part(z.des_dur_falada, ':', 3)::int * interval '1 second'
        )))::bigint
        from public.zenvia z
        where z.id_usuario = u.id
          and (p_data_inicio is null or z.data_ligacao >= p_data_inicio)
          and (p_data_fim is null or z.data_ligacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      0
    ) as des_dur_falada_segundos,

    coalesce(
      (
        select count(*)::int
        from public.zenvia z
        where z.id_usuario = u.id
          and (p_data_inicio is null or z.data_ligacao >= p_data_inicio)
          and (p_data_fim is null or z.data_ligacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      0
    ) as quantidade_linhas,

    coalesce(
      (
        select to_char(sum(
          split_part(z.des_dur_falada, ':', 1)::int * interval '1 hour' +
          split_part(z.des_dur_falada, ':', 2)::int * interval '1 minute' +
          split_part(z.des_dur_falada, ':', 3)::int * interval '1 second'
        ), 'HH24:MI:SS')
        from public.zenvia z
        join usuarios_filtrados uf on uf.id = z.id_usuario
        where (p_data_inicio is null or z.data_ligacao >= p_data_inicio)
          and (p_data_fim is null or z.data_ligacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      '00:00:00'
    ) as total_des_dur_falada,

    coalesce(
      (
        select count(*)::int
        from public.zenvia z
        join usuarios_filtrados uf on uf.id = z.id_usuario
        where (p_data_inicio is null or z.data_ligacao >= p_data_inicio)
          and (p_data_fim is null or z.data_ligacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      0
    ) as total_quantidade_linhas,

    coalesce(
      (
        select sum(w.qtd_mensagens)
        from public.wassi w
        where w.id_usuarios = u.id
          and (p_data_inicio is null or w.data_mensagem >= p_data_inicio)
          and (p_data_fim is null or w.data_mensagem <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
      ),
      0
    )::numeric as mensagem_umbler,

    coalesce((select te.total_etiqueta_00 from totais_etiquetas te), 0) as total_etiqueta_00,
    coalesce((select te.total_etiqueta_10 from totais_etiquetas te), 0) as total_etiqueta_10,
    coalesce((select te.total_etiqueta_20 from totais_etiquetas te), 0) as total_etiqueta_20,
    coalesce((select te.total_etiqueta_21 from totais_etiquetas te), 0) as total_etiqueta_21,
    coalesce((select te.total_etiqueta_05 from totais_etiquetas te), 0) as total_etiqueta_05,
    coalesce((select te.total_etiqueta_30 from totais_etiquetas te), 0) as total_etiqueta_30,
    coalesce((select te.total_etiqueta_35 from totais_etiquetas te), 0) as total_etiqueta_35,
    coalesce((select te.total_etiqueta_40 from totais_etiquetas te), 0) as total_etiqueta_40,
    coalesce((select te.total_etiqueta_50 from totais_etiquetas te), 0) as total_etiqueta_50,
    coalesce((select te.total_etiqueta_60 from totais_etiquetas te), 0) as total_etiqueta_60,
    coalesce((select te.total_etiqueta_61 from totais_etiquetas te), 0) as total_etiqueta_61,
    coalesce((select te.total_etiqueta_62 from totais_etiquetas te), 0) as total_etiqueta_62,
    coalesce((select te.total_etiqueta_66 from totais_etiquetas te), 0) as total_etiqueta_66,

    coalesce((select tm.total_mensagens_gerais from total_mensagens tm), 0)::numeric as total_mensagens_gerais,
    coalesce((select te.total_leads_qualificados_geral from totais_etiquetas te), 0) as total_leads_qualificados_geral,
    coalesce((select md.media_dias_entre from media_dias md), 0)::numeric as media_dias_entre,
    round(rv.soma_dias::numeric / nullif(rv.total_vendas, 0), 2) as media_dias_entre_entrada_e_conversao_individual
  from public.etiqueta e
  join public.usuarios u on u.id = e.id_usuario
  left join public.l100 l on l.usuario_id = u.id
  join usuarios_filtrados uf on uf.id = u.id
  left join resumo_vendas rv on rv.id_usuario = u.id
  where (p_data_inicio is null or e.data_criacao >= p_data_inicio)
    and (p_data_fim is null or e.data_criacao <= p_data_fim + interval '23 hours 59 minutes 59 seconds')
  group by u.id, u.nome, u.usuario_ativo, u.tipo_acesso_2, l.valor, l.valor_exebicao, rv.soma_dias, rv.total_vendas
  order by total_leads_qualificados desc;
end;
$$;
