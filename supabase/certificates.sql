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

-- 2) Endurecimiento (revisión de código): el título, las partes y la fecha los pone la base, no el navegador.
-- Plataformas que emiten certificado: el título y las partes salen de acá, no del navegador.
create table if not exists public.cert_platforms (
  id text primary key,
  title text not null,
  parts jsonb not null
);
alter table public.cert_platforms enable row level security;
revoke all on public.cert_platforms from anon, authenticated;
insert into public.cert_platforms (id, title, parts) values
  ('btp', 'Proyecto final de SAP BTP: preparar la plataforma para conectar el ERP', '["Mapeo del ERP de producción","Destino OnPremise al ERP","Permisos del equipo"]'::jsonb),
  ('abap', 'Proyecto final de ABAP: reporte de deuda de clientes', '["Leer las facturas vencidas","Validar el cliente y sumar la deuda","Alerta de límite en una clase"]'::jsonb),
  ('s4hana', 'Proyecto final de SAP S/4HANA: proceso de compras completo (Procure to Pay)', '["Pedido de compra","Entrada de mercancías","Factura del proveedor"]'::jsonb),
  ('knime', 'Proyecto final de KNIME: reporte mensual automatizado de ventas', '["Preparar las ventas","Enriquecer y calcular","Resumir y entregar"]'::jsonb),
  ('power-bi', 'Proyecto final de Power BI: tablero de cumplimiento de objetivos de ventas', '["Preparar la tabla de objetivos","Medidas de cumplimiento","Visual de cumplimiento por provincia"]'::jsonb),
  ('successfactors', 'Proyecto final de SAP SuccessFactors: ciclo de incorporación de una posición', '["Requisición de la búsqueda","Contratación","Objetivos del primer año"]'::jsonb)
on conflict (id) do update set title = excluded.title, parts = excluded.parts;

-- Al emitir: solo plataformas conocidas, título y partes oficiales, fecha del servidor.
create or replace function public.certificates_fill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare cp public.cert_platforms;
begin
  select * into cp from public.cert_platforms where id = new.platform;
  if not found then
    raise exception 'Plataforma sin certificado: %', new.platform using errcode = '22023';
  end if;
  new.title := cp.title;
  new.summary := cp.parts;
  new.issued_at := now();
  return new;
end;
$$;
revoke all on function public.certificates_fill() from public, anon, authenticated;
drop trigger if exists certificates_fill on public.certificates;
create trigger certificates_fill before insert on public.certificates
  for each row execute function public.certificates_fill();

-- Defensa extra: desde la web nadie actualiza ni borra certificados.
revoke update, delete, truncate on public.certificates from anon, authenticated;
