-- Vincula a nova página de RH ao módulo "Verdetec RH"
insert into public.crm_pages (key, path, label, sort_order, is_active, id_modulo)
select
  'rh' as key,
  '/rh' as path,
  'RH' as label,
  10 as sort_order,
  true as is_active,
  m.id as id_modulo
from public.modulos m
where m.key = 'verdetec_rh'
on conflict (key) do update
set
  path = excluded.path,
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  id_modulo = excluded.id_modulo;
