-- =====================================================================
-- MAK Socios · Aceptar cualquier peso al registrar series
-- Fecha: 2026-11-23
--
-- Cambios respecto a la versión anterior (todo lo demás es idéntico):
--   1. Se elimina la regla "PESO_NO_DISPONIBLE" (múltiplos de 2,5 kg).
--   2. Se acepta cualquier peso entre 0 y 500 kg; se redondea a 2 decimales.
--   3. El conteo de series completadas ya no exige múltiplos de 2,5 kg
--      (antes, una serie de 12,4 kg nunca contaba como completada).
--
-- No modifica datos existentes. Se puede ejecutar más de una vez.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.guardar_mi_serie_entrenamiento_app(
  p_entrenamiento_ejercicio_id uuid,
  p_numero_serie integer,
  p_peso_kg numeric DEFAULT NULL::numeric,
  p_repeticiones integer DEFAULT NULL::integer,
  p_duracion_seg integer DEFAULT NULL::integer,
  p_rir integer DEFAULT NULL::integer,
  p_completada boolean DEFAULT true
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_miembro_id uuid;
  v_entrenamiento_id uuid;
  v_ejercicio public.socio_entrenamiento_ejercicios%rowtype;
  v_por_tiempo boolean;
  v_completadas integer;
  v_finalizado boolean;
  v_serie jsonb;
  v_peso numeric;
begin

  v_miembro_id := public.socio_miembro_id_actual();

  if v_miembro_id is null then
    raise exception 'SOCIO_NO_VALIDO';
  end if;

  if not public.socio_puede_usar_beneficios_app() then
    raise exception 'MEMBRESIA_ACTIVA_REQUERIDA';
  end if;

  -- Primero bloquear la sesión para coordinarla
  -- con una posible finalización simultánea.
  select e.id
  into v_entrenamiento_id
  from public.socio_entrenamientos e
  join public.socio_entrenamiento_ejercicios ee
    on ee.entrenamiento_id = e.id
  where ee.id = p_entrenamiento_ejercicio_id
    and e.miembro_id = v_miembro_id
    and e.estado = 'en_curso'
  for update of e;

  if not found then
    raise exception 'EJERCICIO_NO_DISPONIBLE';
  end if;

  select *
  into v_ejercicio
  from public.socio_entrenamiento_ejercicios
  where id = p_entrenamiento_ejercicio_id
    and entrenamiento_id = v_entrenamiento_id
  for update;

  if v_ejercicio.id is null then
    raise exception 'EJERCICIO_NO_DISPONIBLE';
  end if;

  if coalesce(v_ejercicio.series_objetivo, 0) < 1
     or v_ejercicio.series_objetivo > 30 then
    raise exception 'SERIES_OBJETIVO_INVALIDAS';
  end if;

  if p_numero_serie is null
    or p_numero_serie < 1
    or p_numero_serie > v_ejercicio.series_objetivo then
    raise exception 'NUMERO_SERIE_INVALIDO';
  end if;

  -- Cualquier peso entre 0 y 500 kg (máquinas en 2,5 kg, 3 kg,
  -- mancuernas de 1 kg, etc.). Se guarda con 2 decimales.
  if p_completada is null
    or (p_peso_kg is not null and (p_peso_kg < 0 or p_peso_kg > 500))
    or (p_repeticiones is not null and p_repeticiones < 0)
    or (p_rir is not null and (p_rir < 0 or p_rir > 10))
  then
    raise exception 'VALORES_SERIE_INVALIDOS';
  end if;

  v_peso := case
    when p_peso_kg is null then null
    else round(p_peso_kg, 2)
  end;

  -- No se registrará duración individual.
  if p_duracion_seg is not null then
    raise exception 'TIEMPO_NO_REGISTRABLE';
  end if;

  -- Distinguir ejercicios por tiempo según la
  -- programación almacenada al iniciar la sesión.
  v_por_tiempo :=
    lower(coalesce(
      v_ejercicio.snapshot_programado->>'patron_movimiento',
      ''
    )) = 'cardio'
    or coalesce(
      v_ejercicio.repeticiones_objetivo,
      ''
    ) ~* '(^|[^a-z])(seg|segundos|min|minutos)($|[^a-z])';

  if v_por_tiempo then

    -- Plancha y cardio: check, sin kilos ni reps.
    if v_peso is not null
      or p_repeticiones is not null then
      raise exception 'DATOS_ACTIVIDAD_INVALIDOS';
    end if;

  elsif p_completada then

    -- Fuerza: datos reales de peso y repeticiones.
    -- Carga corporal sin peso adicional: 0 kg.
    if v_peso is null
      or coalesce(p_repeticiones, 0) <= 0 then
      raise exception 'DATOS_SERIE_INCOMPLETOS';
    end if;

  end if;

  insert into public.socio_entrenamiento_series (
    entrenamiento_ejercicio_id,
    numero_serie,
    peso_kg,
    repeticiones,
    duracion_seg,
    rir,
    completada
  )
  values (
    p_entrenamiento_ejercicio_id,
    p_numero_serie,
    v_peso,
    p_repeticiones,
    null,
    p_rir,
    p_completada
  )
  on conflict (
    entrenamiento_ejercicio_id,
    numero_serie
  )
  do update set
    peso_kg = excluded.peso_kg,
    repeticiones = excluded.repeticiones,
    duracion_seg = null,
    rir = excluded.rir,
    completada = excluded.completada,
    updated_at = now();

  select count(*)::integer
  into v_completadas
  from public.socio_entrenamiento_series s
  where s.entrenamiento_ejercicio_id = v_ejercicio.id
    and s.numero_serie between 1 and v_ejercicio.series_objetivo
    and s.completada = true
    and (
      v_por_tiempo
      or (
        s.peso_kg is not null
        and coalesce(s.repeticiones, 0) > 0
      )
    );

  v_finalizado :=
    v_completadas = v_ejercicio.series_objetivo;

  update public.socio_entrenamiento_ejercicios
  set completado = v_finalizado,
      updated_at = now()
  where id = v_ejercicio.id
    and completado is distinct from v_finalizado;

  select to_jsonb(s)
  into v_serie
  from public.socio_entrenamiento_series s
  where s.entrenamiento_ejercicio_id = v_ejercicio.id
    and s.numero_serie = p_numero_serie;

  return jsonb_build_object(
    'ok', true,
    'serie', v_serie,
    'series_objetivo', v_ejercicio.series_objetivo,
    'series_completadas', v_completadas,
    'ejercicio_completado', v_finalizado
  );

end;
$function$;


-- ---------------------------------------------------------------------
-- Verificación: otras funciones que aún revisen múltiplos de 2,5 kg
-- (por ejemplo, al finalizar el entrenamiento o en Progreso).
-- Si esta consulta devuelve filas, compártelas para corregirlas también.
-- ---------------------------------------------------------------------
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ilike '%2.5%'
  and p.proname <> 'guardar_mi_serie_entrenamiento_app';
