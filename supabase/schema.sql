-- flowDev: avance de cada usuario. Ejecutar una vez en Supabase → SQL Editor.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Cada usuario solo ve y modifica su propia fila
drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Límite de tamaño: cada fila de avance es un objeto JSON de hasta 2 MB (evita que alguien llene la base)
alter table public.progress drop constraint if exists progress_data_size;
alter table public.progress add constraint progress_data_size
  check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000);

-- rls_auto_enable() es el helper de Supabase que activa RLS en cada tabla nueva (corre como event trigger).
-- No tiene que poder llamarse desde la API: se quita el permiso a los roles públicos. El trigger sigue funcionando.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
