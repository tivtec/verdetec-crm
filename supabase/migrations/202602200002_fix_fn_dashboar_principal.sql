-- Remove overloaded versions to avoid PostgREST RPC ambiguity (PGRST203)
drop function if exists public.fn_dashboar_principal(date, date, bigint, text);
drop function if exists public.fn_dashboar_principal(timestamp with time zone, timestamp with time zone, bigint, text);
drop function if exists public.fn_dashboar_principal(timestamp without time zone, timestamp without time zone, bigint, text);

create or replace function public.fn_dashboar_principal(
  p_data_inicio date default null,
  p_data_fim date default null,
  p_id_usuario bigint default 0,
  p_tipo_acesso_2 text default null
)
returns table (
  "Nome" text,
  "Lead" bigint,
  "+L100" numeric,
  "L100" numeric,
  "#00" bigint,
  "#10" bigint,
  "#21" bigint,
  "#05" bigint,
  "#30" bigint,
  "#40" bigint,
  "#50" bigint,
  "#60" bigint,
  "#61" bigint,
  "#62" bigint,
  "#66" bigint,
  "TV" numeric,
  "Min" text,
  "Qtd" bigint,
  "Umbler" numeric
)
language plpgsql
as $$
begin
  return query
  with params as (
    select
      coalesce(p_id_usuario, 0)::bigint as usuario_id,
      nullif(btrim(coalesce(p_tipo_acesso_2, '')), '') as tipo_raw,
      coalesce(
        least(p_data_inicio, p_data_fim),
        p_data_inicio,
        p_data_fim
      )::timestamp as dt_inicio,
      case
        when coalesce(greatest(p_data_inicio, p_data_fim), p_data_inicio, p_data_fim) is null then null
        else coalesce(greatest(p_data_inicio, p_data_fim), p_data_inicio, p_data_fim)::timestamp
          + interval '23 hours 59 minutes 59.999 seconds'
      end as dt_fim
  ),
  tipo_param as (
    select
      p.usuario_id,
      p.dt_inicio,
      p.dt_fim,
      case
        when p.tipo_raw is null then null
        when regexp_replace(lower(p.tipo_raw), '[^a-z0-9]+', '', 'g') in ('timenegcios', 'timenegocios', 'timedenegcios', 'timedenegocios')
          then 'time_negocios'
        else lower(p.tipo_raw)
      end as tipo_norm
    from params p
  ),
  usuarios_filtrados as (
    select u.id, u.nome
    from public.usuarios u
    cross join tipo_param tp
    where u.usuario_ativo = true
      and (tp.usuario_id = 0 or u.id = tp.usuario_id)
      and (
        tp.tipo_norm is null
        or (
          tp.tipo_norm = 'time_negocios'
          and regexp_replace(lower(coalesce(u.tipo_acesso_2, '')), '[^a-z0-9]+', '', 'g')
              in ('timenegcios', 'timenegocios', 'timedenegcios', 'timedenegocios')
        )
        or (
          tp.tipo_norm <> 'time_negocios'
          and lower(coalesce(u.tipo_acesso_2, '')) = tp.tipo_norm
        )
      )
  ),
  eventos_agregacao as (
    select
      ag.id_usuario as id_usuario_evento,
      et.id as id_etiqueta,
      et.etiqueta
    from public.agregacao ag
    join public.etiqueta et on et.id = ag.id_etiqueta
    join usuarios_filtrados uf on uf.id = ag.id_usuario
    cross join tipo_param tp
    where (tp.dt_inicio is null or ag.data_criacao >= tp.dt_inicio)
      and (tp.dt_fim is null or ag.data_criacao <= tp.dt_fim)
  ),
  eventos_etiqueta_fallback as (
    select
      et.id_usuario as id_usuario_evento,
      et.id as id_etiqueta,
      et.etiqueta
    from public.etiqueta et
    join usuarios_filtrados uf on uf.id = et.id_usuario
    cross join tipo_param tp
    where (tp.dt_inicio is null or et.data_criacao >= tp.dt_inicio)
      and (tp.dt_fim is null or et.data_criacao <= tp.dt_fim)
      and not exists (
        select 1
        from public.agregacao ag2
        where ag2.id_etiqueta = et.id
          and (tp.dt_inicio is null or ag2.data_criacao >= tp.dt_inicio)
          and (tp.dt_fim is null or ag2.data_criacao <= tp.dt_fim)
      )
  ),
  eventos_etiqueta as (
    select * from eventos_agregacao
    union all
    select * from eventos_etiqueta_fallback
  ),
  etiquetas_por_usuario as (
    select
      ev.id_usuario_evento as id_usuario,
      count(*) filter (where ev.etiqueta in ('#00', '#21'))::bigint as lead_count,
      count(*) filter (where ev.etiqueta = '#00')::bigint as tag_00,
      count(*) filter (where ev.etiqueta = '#10')::bigint as tag_10,
      count(*) filter (where ev.etiqueta = '#21')::bigint as tag_21,
      count(*) filter (where ev.etiqueta = '#05')::bigint as tag_05,
      count(*) filter (where ev.etiqueta = '#30')::bigint as tag_30,
      count(*) filter (where ev.etiqueta = '#40')::bigint as tag_40,
      count(*) filter (where ev.etiqueta = '#50')::bigint as tag_50,
      count(*) filter (where ev.etiqueta = '#60')::bigint as tag_60,
      count(*) filter (where ev.etiqueta = '#61')::bigint as tag_61,
      count(*) filter (where ev.etiqueta = '#62')::bigint as tag_62,
      count(*) filter (where ev.etiqueta = '#66')::bigint as tag_66
    from eventos_etiqueta ev
    group by ev.id_usuario_evento
  ),
  zenvia_por_usuario as (
    select
      z.id_usuario,
      count(*)::bigint as qtd_ligacoes,
      coalesce(
        sum(
          extract(epoch from (
            split_part(coalesce(z.des_dur_falada, '00:00:00'), ':', 1)::int * interval '1 hour' +
            split_part(coalesce(z.des_dur_falada, '00:00:00'), ':', 2)::int * interval '1 minute' +
            split_part(coalesce(z.des_dur_falada, '00:00:00'), ':', 3)::int * interval '1 second'
          ))
        )::bigint,
        0
      ) as total_segundos
    from public.zenvia z
    join usuarios_filtrados uf on uf.id = z.id_usuario
    cross join tipo_param tp
    where (tp.dt_inicio is null or z.data_ligacao >= tp.dt_inicio)
      and (tp.dt_fim is null or z.data_ligacao <= tp.dt_fim)
    group by z.id_usuario
  ),
  wassi_por_usuario as (
    select
      w.id_usuarios as id_usuario,
      coalesce(sum(w.qtd_mensagens), 0)::numeric as total_mensagens
    from public.wassi w
    join usuarios_filtrados uf on uf.id = w.id_usuarios
    cross join tipo_param tp
    where (tp.dt_inicio is null or w.data_mensagem >= tp.dt_inicio)
      and (tp.dt_fim is null or w.data_mensagem <= tp.dt_fim)
    group by w.id_usuarios
  )
  select
    uf.nome as "Nome",
    coalesce(epu.lead_count, 0) as "Lead",
    coalesce(l.valor, 0)::numeric as "+L100",
    coalesce(l.valor_exebicao, 0)::numeric as "L100",
    coalesce(epu.tag_00, 0) as "#00",
    coalesce(epu.tag_10, 0) as "#10",
    coalesce(epu.tag_21, 0) as "#21",
    coalesce(epu.tag_05, 0) as "#05",
    coalesce(epu.tag_30, 0) as "#30",
    coalesce(epu.tag_40, 0) as "#40",
    coalesce(epu.tag_50, 0) as "#50",
    coalesce(epu.tag_60, 0) as "#60",
    coalesce(epu.tag_61, 0) as "#61",
    coalesce(epu.tag_62, 0) as "#62",
    coalesce(epu.tag_66, 0) as "#66",
    round(coalesce(zpu.total_segundos, 0)::numeric / 60.0, 2) as "TV",
    (
      lpad(floor(coalesce(zpu.total_segundos, 0)::numeric / 3600)::text, 2, '0') || ':' ||
      lpad(floor((coalesce(zpu.total_segundos, 0)::numeric % 3600) / 60)::text, 2, '0') || ':' ||
      lpad((coalesce(zpu.total_segundos, 0)::bigint % 60)::text, 2, '0')
    ) as "Min",
    coalesce(zpu.qtd_ligacoes, 0) as "Qtd",
    coalesce(wpu.total_mensagens, 0)::numeric as "Umbler"
  from usuarios_filtrados uf
  left join etiquetas_por_usuario epu on epu.id_usuario = uf.id
  left join zenvia_por_usuario zpu on zpu.id_usuario = uf.id
  left join wassi_por_usuario wpu on wpu.id_usuario = uf.id
  left join public.l100 l on l.usuario_id = uf.id
  order by coalesce(epu.lead_count, 0) desc, uf.nome asc;
end;
$$;

grant execute on function public.fn_dashboar_principal(date, date, bigint, text)
  to anon, authenticated, service_role;
