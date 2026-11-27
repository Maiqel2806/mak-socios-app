-- =====================================================================
-- MAK Socios · Modo entrenador: buzón de sugerencias
-- Fecha: 2026-11-27
--
-- Los entrenadores entran a la app con su usuario del sistema
-- administrativo (admin_usuarios) y pueden enviar sugerencias de mejora
-- sobre rutinas, ejercicios, equipo o la app. El dueño las revisa.
--
-- Solo la app (con su clave de servidor) lee y escribe esta tabla:
-- RLS activado y sin políticas públicas. Se puede ejecutar más de una vez.
-- =====================================================================

create table if not exists public.app_sugerencias_entrenadores (
  id uuid primary key default gen_random_uuid(),
  autor_auth_user_id uuid not null,
  autor_nombre text,
  categoria text not null default 'otro'
    check (categoria in ('rutinas', 'ejercicio', 'equipo', 'app', 'otro')),
  titulo text not null,
  detalle text not null,
  ejercicio_codigo text,
  contexto jsonb,
  estado text not null default 'nueva'
    check (estado in ('nueva', 'en_revision', 'aplicada', 'descartada')),
  respuesta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_sugerencias_entrenadores_fecha_idx
  on public.app_sugerencias_entrenadores (created_at desc);

create index if not exists app_sugerencias_entrenadores_autor_idx
  on public.app_sugerencias_entrenadores (autor_auth_user_id);

alter table public.app_sugerencias_entrenadores enable row level security;

revoke all on public.app_sugerencias_entrenadores from anon, authenticated;

-- Comprobación
select count(*) as sugerencias from public.app_sugerencias_entrenadores;
