import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'


function responderError(
  mensaje,
  status = 400
) {
  return NextResponse.json(
    {
      ok: false,
      error: mensaje,
    },
    {
      status,
    }
  )
}


async function obtenerSupabaseAutenticado() {
  const supabase =
    await createClient()

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims()

  if (
    error ||
    !data?.claims
  ) {
    return {
      supabase: null,
      error: responderError(
        'Sesión no válida.',
        401
      ),
    }
  }

  return {
    supabase,
    error: null,
  }
}


function traducirErrorRpc(error) {
  const mensaje =
    String(
      error?.message || ''
    )

  if (
    mensaje.includes(
      'MEMBRESIA_ACTIVA_REQUERIDA'
    )
  ) {
    return responderError(
      'Necesitas una membresía activa para entrenar.',
      403
    )
  }

  if (
    mensaje.includes(
      'RUTINA_ACTIVA_REQUERIDA'
    )
  ) {
    return responderError(
      'Primero necesitas una rutina activa.',
      409
    )
  }

  if (
    mensaje.includes(
      'DIA_NO_EXISTE_EN_RUTINA'
    ) ||
    mensaje.includes(
      'DIA_INVALIDO'
    )
  ) {
    return responderError(
      'El día seleccionado no es válido.',
      400
    )
  }

  console.error(
    'ENTRENAMIENTO RPC:',
    error
  )

  return responderError(
    'No fue posible procesar el entrenamiento.',
    500
  )
}


export async function GET() {
  try {
    const {
      supabase,
      error: authError,
    } =
      await obtenerSupabaseAutenticado()

    if (authError) {
      return authError
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'obtener_mi_entrenamiento_en_curso_app'
      )

    if (error) {
      return traducirErrorRpc(
        error
      )
    }

    return NextResponse.json({
      ok: true,
      entrenamiento:
        data || {
          tiene_entrenamiento: false,
        },
    })

  } catch (error) {
    console.error(
      'GET ENTRENAMIENTO:',
      error
    )

    return responderError(
      'No fue posible recuperar el entrenamiento.',
      500
    )
  }
}


export async function POST(
  request
) {
  try {
    const {
      supabase,
      error: authError,
    } =
      await obtenerSupabaseAutenticado()

    if (authError) {
      return authError
    }

    const body =
      await request.json()

    const dia =
      Number(
        body?.dia
      )

    if (
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 7
    ) {
      return responderError(
        'El día seleccionado no es válido.',
        400
      )
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'iniciar_mi_entrenamiento_app',
        {
          p_dia: dia,
        }
      )

    if (error) {
      return traducirErrorRpc(
        error
      )
    }

    const {
      data: entrenamiento,
      error: errorEntrenamiento,
    } =
      await supabase.rpc(
        'obtener_mi_entrenamiento_en_curso_app'
      )

    if (errorEntrenamiento) {
      return traducirErrorRpc(
        errorEntrenamiento
      )
    }

    return NextResponse.json({
      ok: true,
      inicio: data,
      entrenamiento,
    })

  } catch (error) {
    console.error(
      'POST ENTRENAMIENTO:',
      error
    )

    return responderError(
      'No fue posible iniciar el entrenamiento.',
      500
    )
  }
}


export async function PATCH(
  request
) {
  try {
    const {
      supabase,
      error: authError,
    } =
      await obtenerSupabaseAutenticado()

    if (authError) {
      return authError
    }

    const body =
      await request.json()

    const accion =
      String(
        body?.accion || ''
      )

    if (accion === 'serie') {
      const ejercicioId =
        String(
          body?.entrenamiento_ejercicio_id || ''
        )

      const numeroSerie =
        Number(
          body?.numero_serie
        )

      if (
        !ejercicioId ||
        !Number.isInteger(numeroSerie) ||
        numeroSerie < 1
      ) {
        return responderError(
          'Datos de serie no válidos.',
          400
        )
      }

      const peso =
        body?.peso_kg === '' ||
        body?.peso_kg === null ||
        body?.peso_kg === undefined
          ? null
          : Number(body.peso_kg)

      const repeticiones =
        body?.repeticiones === '' ||
        body?.repeticiones === null ||
        body?.repeticiones === undefined
          ? null
          : Number(body.repeticiones)

      const duracion =
        body?.duracion_seg === '' ||
        body?.duracion_seg === null ||
        body?.duracion_seg === undefined
          ? null
          : Number(body.duracion_seg)

      const rir =
        body?.rir === '' ||
        body?.rir === null ||
        body?.rir === undefined
          ? null
          : Number(body.rir)

      const {
        error,
      } =
        await supabase
          .from(
            'socio_entrenamiento_series'
          )
          .upsert(
            {
              entrenamiento_ejercicio_id:
                ejercicioId,

              numero_serie:
                numeroSerie,

              peso_kg:
                Number.isFinite(peso)
                  ? peso
                  : null,

              repeticiones:
                Number.isFinite(repeticiones)
                  ? repeticiones
                  : null,

              duracion_seg:
                Number.isFinite(duracion)
                  ? Math.round(duracion)
                  : null,

              rir:
                Number.isFinite(rir)
                  ? Math.round(rir)
                  : null,

              completada:
                true,

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                'entrenamiento_ejercicio_id,numero_serie',
            }
          )

      if (error) {
        console.error(
          'GUARDAR SERIE:',
          error
        )

        return responderError(
          'No fue posible guardar la serie.',
          500
        )
      }
    }

    else if (
      accion === 'completar_ejercicio'
    ) {
      const ejercicioId =
        String(
          body?.entrenamiento_ejercicio_id || ''
        )

      if (!ejercicioId) {
        return responderError(
          'Ejercicio no válido.',
          400
        )
      }

      const {
        error,
      } =
        await supabase
          .from(
            'socio_entrenamiento_ejercicios'
          )
          .update({
            completado: true,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            ejercicioId
          )

      if (error) {
        console.error(
          'COMPLETAR EJERCICIO:',
          error
        )

        return responderError(
          'No fue posible completar el ejercicio.',
          500
        )
      }
    }

    else if (
      accion === 'finalizar'
    ) {
      const entrenamientoId =
        String(
          body?.entrenamiento_id || ''
        )

      const duracionSeg =
        Math.max(
          0,
          Math.round(
            Number(
              body?.duracion_seg || 0
            )
          )
        )

      const rpe =
        Number(
          body?.rpe
        )

      if (
        !entrenamientoId ||
        !Number.isInteger(rpe) ||
        rpe < 1 ||
        rpe > 10
      ) {
        return responderError(
          'Datos de finalización no válidos.',
          400
        )
      }

      const {
        error,
      } =
        await supabase
          .from(
            'socio_entrenamientos'
          )
          .update({
            estado:
              'completado',

            fecha_fin:
              new Date().toISOString(),

            duracion_seg:
              duracionSeg,

            esfuerzo_sesion_rpe:
              rpe,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            entrenamientoId
          )
          .eq(
            'estado',
            'en_curso'
          )

      if (error) {
        console.error(
          'FINALIZAR ENTRENAMIENTO:',
          error
        )

        return responderError(
          'No fue posible finalizar el entrenamiento.',
          500
        )
      }

      return NextResponse.json({
        ok: true,
        finalizado: true,
      })
    }

    else {
      return responderError(
        'Acción no válida.',
        400
      )
    }


    const {
      data: entrenamiento,
      error: errorEntrenamiento,
    } =
      await supabase.rpc(
        'obtener_mi_entrenamiento_en_curso_app'
      )

    if (errorEntrenamiento) {
      return traducirErrorRpc(
        errorEntrenamiento
      )
    }

    return NextResponse.json({
      ok: true,
      entrenamiento,
    })

  } catch (error) {
    console.error(
      'PATCH ENTRENAMIENTO:',
      error
    )

    return responderError(
      'No fue posible actualizar el entrenamiento.',
      500
    )
  }
}



export async function DELETE() {
  try {

    const {
      supabase,
      error: authError,
    } =
      await obtenerSupabaseAutenticado()

    if (authError) {
      return authError
    }


    const {
      data,
      error,
    } =
      await supabase.rpc(
        'cancelar_mi_entrenamiento_app'
      )


    if (error) {
      return traducirErrorRpc(
        error
      )
    }


    return NextResponse.json({
      ok: true,
      resultado: data,
    })

  } catch (error) {

    console.error(
      'DELETE ENTRENAMIENTO:',
      error
    )

    return responderError(
      'No fue posible cancelar el entrenamiento.',
      500
    )
  }
}
