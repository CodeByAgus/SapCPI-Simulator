-- flowDev: panel de administración (admin/). Ejecutar una vez en Supabase → SQL Editor.
-- La función admin_stats() solo responde a los usuarios de la tabla admins y devuelve datos anónimos:
-- fechas, proveedor de ingreso y cantidad de contenido completado por usuario. Nunca emails ni nombres.

-- 1) Quiénes pueden ver el panel. RLS sin políticas: la tabla no se puede leer ni modificar desde la API.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 2) Estadísticas
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = (select auth.uid())) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    -- Una fila por usuario, sin datos personales
    'users', coalesce((select jsonb_agg(to_jsonb(t) order by t.created) from (
      select u.created_at as created, u.last_sign_in_at as last_sign_in, p.updated_at as last_progress,
        coalesce(u.raw_app_meta_data->>'provider', 'email') as provider, u.email_confirmed_at is not null as confirmed,
        coalesce(c.pa_l, 0) as pa_l, coalesce(c.pa_p, 0) as pa_p, coalesce(c.pa_q, 0) as pa_q,
        coalesce(c.sap_l, 0) as sap_l, coalesce(c.sap_p, 0) as sap_p, coalesce(c.sap_q, 0) as sap_q
      from auth.users u
      left join public.progress p on p.user_id = u.id
      left join lateral (
        select count(*) filter (where k ~ '^pa:L[0-9]+$') as pa_l,
               count(*) filter (where k like 'pa:P:%') as pa_p,
               count(*) filter (where k ~ '^pa:Q:c[0-9]+$') as pa_q,
               count(*) filter (where k ~ '^sap:L[0-9]+$') as sap_l,
               count(*) filter (where k like 'sap:P:%') as sap_p,
               count(*) filter (where k ~ '^sap:Q:c[0-9]+$') as sap_q
        from jsonb_object_keys(case when jsonb_typeof(p.data->'progress') = 'object' then p.data->'progress' else '{}'::jsonb end) as k
      ) c on true
      where u.deleted_at is null and not coalesce(u.is_anonymous, false)
    ) t), '[]'::jsonb),
    -- Contenido más completado (clases, escenarios y cuestionarios)
    'top', coalesce((select jsonb_agg(to_jsonb(x)) from (
      select k as key, count(*) as n
      from public.progress p2,
        jsonb_object_keys(case when jsonb_typeof(p2.data->'progress') = 'object' then p2.data->'progress' else '{}'::jsonb end) as k
      group by k order by n desc, k limit 15
    ) x), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- 3) Darte acceso. La cuenta tiene que existir antes: primero creala en flowDev con este email y confirmala.
--    Si la cuenta todavía no existe, este insert no agrega nada (no da error): volvé a ejecutarlo después de crearla.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('FlowDevSimulator@proton.me')
on conflict do nothing;

-- Para comprobar quiénes son administradores:
-- select u.email from public.admins a join auth.users u on u.id = a.user_id;
