-- =====================================================================
-- MAK · Colaboradores (staff) con acceso a la app MAK Socios
-- Fecha: 2026-11-27
--
-- 1) Tabla public.colaboradores: datos del personal (cargo, fecha de
--    ingreso, jornada, contacto de emergencia…). Se administra desde la
--    sección "Colaboradores" del sistema administrativo.
-- 2) Para usar la app, cada colaborador tiene un registro interno en
--    miembros marcado tipo_registro = 'colaborador'. Ese registro NO se
--    muestra en el sistema administrativo (miembros, búsquedas, listas).
-- 3) Mientras el colaborador esté activo y con acceso a la app, puede usar
--    todas las funciones de socio con el "Plan Entrenador": $0 y vigencia
--    ilimitada, sin crear membresías ni movimientos de caja.
--
-- Se puede ejecutar más de una vez.
-- =====================================================================


-- ---------------------------------------------------------------- 1
create table if not exists public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text,
  cedula text,
  telefono text,
  email text,
  fecha_nacimiento date,
  direccion text,
  cargo text not null default 'entrenador'
    check (cargo in ('entrenador', 'recepcion', 'limpieza', 'administracion', 'nutricion', 'otro')),
  fecha_ingreso date not null default current_date,
  fecha_salida date,
  jornada_dias text[] not null default '{}',
  jornada_inicio time,
  jornada_fin time,
  jornada_notas text,
  contacto_emergencia text,
  telefono_emergencia text,
  notas text,
  activo boolean not null default true,
  acceso_app boolean not null default true,
  miembro_id uuid unique references public.miembros(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists colaboradores_activo_idx on public.colaboradores (activo);
create unique index if not exists colaboradores_cedula_idx
  on public.colaboradores (cedula) where cedula is not null and cedula <> '';

-- Solo el servidor (clave de servicio) lee y escribe esta tabla
alter table public.colaboradores enable row level security;
revoke all on public.colaboradores from anon, authenticated;


-- ---------------------------------------------------------------- 2
alter table public.miembros
  add column if not exists tipo_registro text not null default 'socio';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'miembros_tipo_registro_check'
  ) then
    alter table public.miembros
      add constraint miembros_tipo_registro_check
      check (tipo_registro in ('socio', 'colaborador'));
  end if;
end $$;

-- Oculta los registros internos de colaboradores en el sistema
-- administrativo. Es una política RESTRICTIVA: se suma a las que ya
-- existen sin cambiarlas. El propio colaborador sí ve su registro.
do $$
begin
  if (select relrowsecurity from pg_class where oid = 'public.miembros'::regclass) then
    drop policy if exists ocultar_colaboradores on public.miembros;
    create policy ocultar_colaboradores on public.miembros
      as restrictive
      for select
      to authenticated
      using (
        tipo_registro = 'socio'
        or id = public.socio_miembro_id_actual()
      );
    raise notice 'Registros de colaboradores ocultos en el sistema administrativo.';
  else
    raise notice 'ATENCIÓN: miembros no tiene RLS activado; los registros de colaboradores podrían verse en el sistema administrativo.';
  end if;
end $$;


-- ---------------------------------------------------------------- 3
-- Plan Entrenador: la función que revisa la membresía también acepta
-- a los colaboradores activos con acceso a la app. La lógica original
-- se conserva intacta como socio_puede_usar_beneficios_app_base().
do $$
begin
  if to_regprocedure('public.socio_puede_usar_beneficios_app_base()') is null then
    alter function public.socio_puede_usar_beneficios_app()
      rename to socio_puede_usar_beneficios_app_base;
  end if;
end $$;

create or replace function public.socio_puede_usar_beneficios_app()
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if exists (
    select 1
    from public.colaboradores c
    where c.miembro_id = public.socio_miembro_id_actual()
      and c.activo
      and c.acceso_app
  ) then
    return true;
  end if;

  return public.socio_puede_usar_beneficios_app_base();
end;
$function$;

revoke all on function public.socio_puede_usar_beneficios_app() from public, anon;
grant execute on function public.socio_puede_usar_beneficios_app() to authenticated, service_role;


-- Comprobación
select
  (select count(*) from public.colaboradores) as colaboradores,
  (select count(*) from public.miembros where tipo_registro = 'colaborador') as registros_internos,
  to_regprocedure('public.socio_puede_usar_beneficios_app_base()') is not null as plan_entrenador_listo;
