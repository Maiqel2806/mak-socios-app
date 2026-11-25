-- =====================================================================
-- MAK Socios · Finalizar entrenamiento con cualquier peso
-- Fecha: 2026-11-23
--
-- La función finalizar_mi_entrenamiento_app() (la que usa la app, sin
-- parámetros) rechazaba como "incompleta" cualquier serie cuyo peso no
-- fuera múltiplo de 2,5 kg (mod(peso_kg, 2.5) = 0). Por eso no se podía
-- finalizar un entrenamiento con pesos como 3, 13 o 7,5 kg... 
--
-- Este cambio solo reemplaza esa condición por "peso entre 0 y 500 kg".
-- Todo lo demás (validación de series, ejercicios por tiempo, nivel de
-- cumplimiento, duración, respuesta) queda exactamente igual.
-- La otra versión con parámetros (p_entrenamiento_id, ...) no se toca.
-- Se puede ejecutar más de una vez.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.finalizar_mi_entrenamiento_app()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_miembro_id uuid;
  v_sesion public.socio_entrenamientos%rowtype;
  v_ejercicio public.socio_entrenamiento_ejercicios%rowtype;
  v_total integer := 0;
  v_validas integer;
  v_por_tiempo boolean;
  v_cumplimiento numeric;
  v_nivel text;
  v_fin timestamptz := now();
  v_duracion integer;
begin

  v_miembro_id := public.socio_miembro_id_actual();

  if v_miembro_id is null then
    raise exception 'SOCIO_NO_VALIDO';
  end if;

  if not public.socio_puede_usar_beneficios_app() then
    raise exception 'MEMBRESIA_ACTIVA_REQUERIDA';
  end if;

  select *
  into v_sesion
  from public.socio_entrenamientos
  where miembro_id = v_miembro_id
    and estado = 'en_curso'
  order by fecha_inicio desc
  limit 1
  for update;

  if v_sesion.id is null then
    raise exception 'ENTRENAMIENTO_NO_DISPONIBLE';
  end if;

  -- No confiar exclusivamente en los checks del frontend.
  for v_ejercicio in
    select *
    from public.socio_entrenamiento_ejercicios
    where entrenamiento_id = v_sesion.id
    order by orden
  loop

    v_total := v_total + 1;

    if coalesce(v_ejercicio.series_objetivo, 0) < 1
       or v_ejercicio.series_objetivo > 30 then
      raise exception 'ENTRENAMIENTO_INCOMPLETO';
    end if;

    v_por_tiempo :=
      lower(coalesce(
        v_ejercicio.snapshot_programado->>'patron_movimiento',
        ''
      )) = 'cardio'
      or coalesce(
        v_ejercicio.repeticiones_objetivo,
        ''
      ) ~* '(^|[^a-z])(seg|segundos|min|minutos)($|[^a-z])';

    select count(*)::integer
    into v_validas
    from public.socio_entrenamiento_series s
    where s.entrenamiento_ejercicio_id = v_ejercicio.id
      and s.numero_serie between 1 and v_ejercicio.series_objetivo
      and s.completada = true
      and (
        v_por_tiempo
        or (
          s.peso_kg is not null
          and s.peso_kg >= 0
          and s.peso_kg <= 500
          and coalesce(s.repeticiones, 0) > 0
        )
      );

    if v_validas <> v_ejercicio.series_objetivo then
      raise exception 'ENTRENAMIENTO_INCOMPLETO';
    end if;

  end loop;

  if v_total = 0 then
    raise exception 'ENTRENAMIENTO_INCOMPLETO';
  end if;

  -- Comparar las reps realizadas con el mínimo
  -- programado. Los ejercicios por tiempo no
  -- participan en esta valoración.
  select avg(
    least(
      1.0,
      s.repeticiones::numeric /
      nullif(
        split_part(
          regexp_replace(
            ee.repeticiones_objetivo,
            '[[:space:]]',
            '',
            'g'
          ),
          '-',
          1
        )::integer,
        0
      )
    )
  )
  into v_cumplimiento
  from public.socio_entrenamiento_ejercicios ee
  join public.socio_entrenamiento_series s
    on s.entrenamiento_ejercicio_id = ee.id
  where ee.entrenamiento_id = v_sesion.id
    and regexp_replace(
      coalesce(ee.repeticiones_objetivo, ''),
      '[[:space:]]',
      '',
      'g'
    ) ~ '^[0-9]+(-[0-9]+)?$'
    and s.completada = true
    and s.repeticiones > 0;

  v_nivel := case
    when v_cumplimiento is null then 'completado'
    when v_cumplimiento >= 0.95 then 'excelente'
    when v_cumplimiento >= 0.75 then 'medio'
    else 'bajo'
  end;

  v_duracion := greatest(
    0,
    floor(
      extract(epoch from (v_fin - v_sesion.fecha_inicio))
    )::integer
  );

  update public.socio_entrenamientos
  set estado = 'completado',
      fecha_fin = v_fin,
      duracion_seg = v_duracion,
      updated_at = now()
  where id = v_sesion.id
    and miembro_id = v_miembro_id
    and estado = 'en_curso';

  return jsonb_build_object(
    'ok', true,
    'entrenamiento_id', v_sesion.id,
    'ejercicios_completados', v_total,
    'duracion_seg', v_duracion,
    'nivel', v_nivel,
    'cumplimiento_porcentaje',
      case
        when v_cumplimiento is null then null
        else round(v_cumplimiento * 100)::integer
      end,
    'message', 'Entrenamiento finalizado correctamente.'
  );

end;
$function$;


-- Comprobación: debe devolver 0 filas (ninguna función con la regla 2,5)
select p.proname, pg_get_function_identity_arguments(p.oid) as argumentos
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and pg_get_functiondef(p.oid) ~ 'mod\([^)]*2\.5\)';
