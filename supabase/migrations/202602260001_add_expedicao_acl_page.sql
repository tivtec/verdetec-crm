insert into public.crm_pages (key, path, label, sort_order, is_active)
values ('expedicao', '/expedicao', 'Expedicao', 75, true)
on conflict (key) do update
set
  path = excluded.path,
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

