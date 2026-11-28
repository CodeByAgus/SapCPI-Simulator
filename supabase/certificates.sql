-- flowDev: certificados de cumplimiento del proyecto final. Ejecutar una vez en Supabase → SQL Editor.
-- Cada usuario puede emitirse un certificado por plataforma (lo crea el navegador al aprobar el proyecto final).
-- La verificación pública pasa por verify_certificate(code): devuelve el certificado sin user_id ni email.
create table if not exists public.certificates (
  code text primary key check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform ~ '^[a-z0-9-]{2,20}$'),
  full_name text not null check (char_length(full_name) between 2 and 80),
  title text not null check (char_length(title) <= 120),
  summary jsonb not null default '[]'::jsonb check (octet_length(summary::text) <= 4000),
  solution jsonb not null default '{}'::jsonb check (octet_length(solution::text) <= 60000),
  issued_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.certificates enable row level security;
revoke all on public.certificates from anon;

drop policy if exists "cert_select_own" on public.certificates;
create policy "cert_select_own" on public.certificates
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "cert_insert_own" on public.certificates;
create policy "cert_insert_own" on public.certificates
  for insert to authenticated with check ((select auth.uid()) = user_id and issued_at > now() - interval '5 minutes');

-- Sin políticas de update ni delete: nadie los edita ni borra desde la web.

create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('code', c.code, 'platform', c.platform, 'full_name', c.full_name, 'title', c.title,
    'summary', c.summary, 'solution', c.solution, 'issued_at', c.issued_at)
  from public.certificates c where c.code = upper(trim(p_code));
$$;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
