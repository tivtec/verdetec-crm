-- Corrige o escopo de data/campanha da RPC de campanhas.
-- Problema anterior:
-- 1) O filtro de data era aplicado apenas na selecao inicial de #10.
-- 2) As demais etiquetas eram juntadas sem filtro de data.
-- 3) As etiquetas tambem podiam vir de outra campanha do mesmo lead.
--
-- Regra aplicada aqui:
-- - O periodo (p_data_inicio/p_data_fim) vale para TODAS as etiquetas.
-- - As contagens sao limitadas a etiqueta da MESMA campanha do lead.

create or replace function public.filter3_campanhas_usuarios_por_etiquetas(
  p_data_inicio date default null,
  p_data_fim date default null
)
returns table (
  id_unico integer,
  apelido_campanha text,
  total_leads bigint,
  etiqueta_00 bigint,
  etiqueta_10 bigint,
  etiqueta_20 bigint,
  etiqueta_21 bigint,
  etiqueta_05 bigint,
  etiqueta_30 bigint,
  etiqueta_35 bigint,
  etiqueta_40 bigint,
  etiqueta_50 bigint,
  etiqueta_60 bigint,
  etiqueta_61 bigint,
  etiqueta_62 bigint,
  etiqueta_66 bigint
)
language sql
stable
as $$
with etiquetas_filtradas as (
  select
    e.id_pessoa,
    e.id_usuario,
    e.id_campanhas,
    e.etiqueta,
    c.id_unico,
    c.apelido
  from public.etiqueta e
  left join public.campanhas c on c.id = e.id_campanhas
  where e.id_campanhas is not null
    and (p_data_inicio is null or e.data_criacao >= p_data_inicio::date + time '00:00:00')
    and (p_data_fim is null or e.data_criacao <= p_data_fim::date + time '23:59:59')
),
leads_por_campanha as (
  select distinct
    ef.id_pessoa,
    ef.id_campanhas
  from etiquetas_filtradas ef
  where ef.etiqueta = '#10'
),
etiquetas_completas as (
  select
    ef.id_unico,
    ef.apelido,
    ef.id_usuario,
    ef.id_pessoa,
    ef.etiqueta
  from leads_por_campanha l
  join etiquetas_filtradas ef
    on ef.id_pessoa = l.id_pessoa
   and ef.id_campanhas = l.id_campanhas
)
select
  ec.id_unico,
  ec.apelido as apelido_campanha,

  count(distinct ec.id_pessoa) as total_leads,

  count(distinct ec.id_pessoa) filter (where ec.etiqueta = '#00') as etiqueta_00,
  count(distinct ec.id_pessoa) filter (where ec.etiqueta = '#10') as etiqueta_10,
  count(distinct ec.id_pessoa) filter (where ec.etiqueta = '#20') as etiqueta_20,
  count(distinct ec.id_pessoa) filter (where ec.etiqueta = '#21') as etiqueta_21,

  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#05') as etiqueta_05,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#30') as etiqueta_30,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#35') as etiqueta_35,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#40') as etiqueta_40,
  count(distinct ec.id_pessoa) filter (where ec.etiqueta = '#50') as etiqueta_50,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#60') as etiqueta_60,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#61') as etiqueta_61,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#62') as etiqueta_62,
  count(distinct concat(ec.id_usuario, '-', ec.id_pessoa)) filter (where ec.etiqueta = '#66') as etiqueta_66
from etiquetas_completas ec
group by ec.id_unico, ec.apelido
order by total_leads desc;
$$;
