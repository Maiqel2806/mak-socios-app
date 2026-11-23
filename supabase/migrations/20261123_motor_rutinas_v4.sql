-- =====================================================================
-- MAK Socios · Motor de rutinas v4 + catálogo de equipamiento
-- Fecha: 2026-11-23
--
-- PARTE 1 (esta sección): SEGURA DE EJECUTAR.
--   Solo crea objetos nuevos. No modifica ni borra tablas existentes,
--   rutinas, entrenamientos ni historial.
--
-- PARTE 2 (al final, comentada): ajustes a funciones existentes que
--   requieren ver su definición actual (validación de 2,5 kg, inicio
--   de entrenamiento con rutinas v4, decimales en estatura).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Equipamiento del gimnasio (editable desde /admin/equipamiento)
-- ---------------------------------------------------------------------
create table if not exists public.gimnasio_equipamiento (
  codigo          text primary key check (codigo ~ '^[a-z0-9_]{2,48}$'),
  nombre          text not null,
  zona            text not null default 'maquinas'
                  check (zona in ('peso_libre','maquinas','calistenia','cardio','funcional','general')),
  activo          boolean not null default true,
  incremento_kg   numeric(5,2)
                  check (incremento_kg is null or (incremento_kg > 0 and incremento_kg <= 50)),
  nuevo           boolean not null default false,
  notas           text,
  actualizado_por text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.gimnasio_equipamiento enable row level security;

drop policy if exists gimnasio_equipamiento_lectura on public.gimnasio_equipamiento;
create policy gimnasio_equipamiento_lectura
  on public.gimnasio_equipamiento
  for select to authenticated
  using (true);
-- Escritura: solo service_role (API de administración). Sin políticas de escritura.


-- Catálogo inicial. REVISA los marcados "activo = false": son equipos
-- que no se confirmaron en MAK FITNESS. Actívalos solo si existen.
insert into public.gimnasio_equipamiento (codigo, nombre, zona, activo, incremento_kg, nuevo) values
  ('peso_corporal',      'Peso corporal',                 'general',    true,  null, false),
  ('colchoneta',         'Colchonetas',                   'general',    true,  null, false),
  ('mancuernas',         'Mancuernas',                    'peso_libre', true,  2,    false),
  ('barra_olimpica',     'Barra olímpica y discos',       'peso_libre', true,  2.5,  false),
  ('barra_z',            'Barra Z',                       'peso_libre', true,  2.5,  false),
  ('banco_plano',        'Banco plano',                   'peso_libre', true,  null, false),
  ('banco_inclinado',    'Banco inclinado / ajustable',   'peso_libre', true,  null, false),
  ('banco_declinado',    'Banco press pecho declinado',   'peso_libre', true,  null, true),
  ('rack_sentadilla',    'Rack de sentadilla',            'peso_libre', true,  null, false),
  ('polea',              'Poleas / cruce de poleas',      'maquinas',   true,  2.5,  false),
  ('maquina_jalon',      'Jalón al pecho',                'maquinas',   true,  2.5,  false),
  ('maquina_remo',       'Remo sentado',                  'maquinas',   true,  2.5,  false),
  ('prensa_piernas',     'Prensa de piernas',             'maquinas',   true,  5,    false),
  ('maquina_extension',  'Extensión de cuádriceps',       'maquinas',   true,  2.5,  false),
  ('maquina_curl_femoral','Curl femoral',                 'maquinas',   true,  2.5,  false),
  ('maquina_press_pecho','Press de pecho en máquina',     'maquinas',   true,  2.5,  false),
  ('maquina_pec_deck',   'Pec deck / aperturas',          'maquinas',   true,  2.5,  false),
  ('maquina_press_hombro','Press de hombro en máquina',   'maquinas',   true,  2.5,  false),
  ('maquina_hip_thrust', 'Máquina de hip thrust',         'maquinas',   true,  3,    true),
  ('maquina_smith',      'Máquina Smith',                 'maquinas',   false, 2.5,  false),
  ('maquina_abductores', 'Abductores / aductores',        'maquinas',   false, 2.5,  false),
  ('maquina_gemelos',    'Gemelos en máquina',            'maquinas',   false, 2.5,  false),
  ('barras_paralelas',   'Barras paralelas',              'calistenia', true,  null, true),
  ('barra_dominadas',    'Barra de dominadas',            'calistenia', true,  null, true),
  ('silla_romana',       'Silla romana (lumbar)',         'calistenia', true,  null, true),
  ('caminadora',         'Caminadora',                    'cardio',     true,  null, false),
  ('bicicleta_estatica', 'Bicicleta estática',            'cardio',     true,  null, false),
  ('eliptica',           'Elíptica',                      'cardio',     false, null, false),
  ('remo_ergometro',     'Remo ergómetro',                'cardio',     false, null, false),
  ('cuerda_saltar',      'Cuerda para saltar',            'funcional',  true,  null, false),
  ('kettlebell',         'Kettlebells',                   'funcional',  false, 4,    false),
  ('balon_medicinal',    'Balón medicinal',               'funcional',  false, null, false),
  ('cajon_pliometrico',  'Cajón pliométrico',             'funcional',  false, null, false)
on conflict (codigo) do nothing;


-- ---------------------------------------------------------------------
-- 2. Ejercicios propios del gimnasio (para máquinas sin ejercicios
--    en la biblioteca del motor)
-- ---------------------------------------------------------------------
create table if not exists public.gimnasio_ejercicios_personalizados (
  codigo      text primary key check (codigo ~ '^[a-z0-9_]{2,60}$'),
  nombre      text not null,
  grupo       text not null,
  patron      text not null,
  equipo      text[] not null default array['peso_corporal'],
  nivel_min   smallint not null default 1 check (nivel_min between 1 and 3),
  nivel_max   smallint not null default 3 check (nivel_max between 1 and 3),
  tipo        text not null default 'fuerza',
  tecnica     text,
  imagen_url  text,
  video_url   text,
  guiado      boolean not null default false,
  compuesto   boolean not null default false,
  seg         boolean not null default false,
  unilateral  boolean not null default false,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (nivel_max >= nivel_min)
);

alter table public.gimnasio_ejercicios_personalizados enable row level security;

drop policy if exists gimnasio_ejercicios_lectura on public.gimnasio_ejercicios_personalizados;
create policy gimnasio_ejercicios_lectura
  on public.gimnasio_ejercicios_personalizados
  for select to authenticated
  using (true);


-- ---------------------------------------------------------------------
-- 3. Rutinas generadas por el motor v4 (historial completo, nunca se
--    borran: la anterior queda activa = false)
--    El tipo de miembro_id se toma de public.miembros.id automáticamente.
-- ---------------------------------------------------------------------
do $$
declare
  tipo_id text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into tipo_id
  from pg_attribute a
  where a.attrelid = 'public.miembros'::regclass
    and a.attname = 'id'
    and not a.attisdropped;

  if tipo_id is null then
    raise exception 'No se encontró public.miembros.id';
  end if;

  execute format($f$
    create table if not exists public.socio_rutinas_v4 (
      id             uuid primary key default gen_random_uuid(),
      miembro_id     %s not null references public.miembros(id) on delete cascade,
      rutina         jsonb not null,
      motor          text not null default 'mak-adaptativo-v4',
      semilla        text,
      huella_perfil  text,
      activa         boolean not null default true,
      created_at     timestamptz not null default now()
    )$f$, tipo_id);
end
$$;

create index if not exists socio_rutinas_v4_miembro_idx
  on public.socio_rutinas_v4 (miembro_id, activa, created_at desc);

create unique index if not exists socio_rutinas_v4_una_activa
  on public.socio_rutinas_v4 (miembro_id)
  where activa;

alter table public.socio_rutinas_v4 enable row level security;

drop policy if exists socio_rutinas_v4_propia on public.socio_rutinas_v4;
create policy socio_rutinas_v4_propia
  on public.socio_rutinas_v4
  for select to authenticated
  using (
    exists (
      select 1
      from public.socio_cuentas_app c
      where c.auth_user_id = auth.uid()
        and c.miembro_id = socio_rutinas_v4.miembro_id
        and c.activo
    )
  );
-- Escritura: solo service_role desde /api/rutina.


-- =====================================================================
-- NOTA (actualizada): el motor v4 guarda las rutinas en la tabla real
-- public.socio_rutinas_generadas (motor_version = 'mak-adaptativo-v4'),
-- así el inicio de entrenamiento funciona igual que antes.
-- La tabla socio_rutinas_v4 de arriba ya no se usa (es inofensiva).
--
-- Orden para activar el motor v4:
--   1) Este archivo (equipamiento editable).
--   2) 20261123_pesos_libres_series.sql
--   3) 20261123_motor_v4_ejercicios.sql
--   4) En Vercel: MOTOR_RUTINAS=v4 (primero solo en Preview).
-- =====================================================================
