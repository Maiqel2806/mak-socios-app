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
    mensaje.includes('VARIANTE_') ||
    mensaje.includes('VARIANTES_')
  ) {
    return responderError(
      'La variante seleccionada ya no está disponible o no corresponde a este ejercicio. Vuelve a elegir una alternativa.',
      409
    )
  }

  if (
    mensaje.includes(
      'ENTRENAMIENTO_YA_REALIZADO_HOY'
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        codigo: 'ENTRENAMIENTO_YA_REALIZADO_HOY',
        error: 'Este entrenamiento ya fue completado hoy.',
      },
      { status: 409 }
    )
  }

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


async function obtenerEntrenamientoActual(
  supabase
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      'obtener_mi_entrenamiento_en_curso_app'
    )

  return {
    data,
    error,
  }
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
      await obtenerEntrenamientoActual(
        supabase
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
          tiene_entrenamiento:
            false,
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


    // ========================================================
    // 1. PRIMERO REVISAR SI YA HAY ENTRENAMIENTO EN CURSO
    //
    // Esto permite "Reanudar" sin depender de que el frontend
    // vuelva a enviar correctamente el número de día.
    // ========================================================

    const {
      data: entrenamientoActual,
      error: errorActual,
    } =
      await obtenerEntrenamientoActual(
        supabase
      )

    if (errorActual) {
      return traducirErrorRpc(
        errorActual
      )
    }


    if (
      entrenamientoActual
        ?.tiene_entrenamiento
    ) {
      return NextResponse.json({
        ok: true,

        reanudada:
          true,

        inicio: {
          ok: true,

          reanudada:
            true,

          entrenamiento_id:
            entrenamientoActual
              .entrenamiento_id,

          dia:
            entrenamientoActual.dia,

          nombre_dia:
            entrenamientoActual
              .nombre_dia,

          fecha_inicio:
            entrenamientoActual
              .fecha_inicio,
        },

        entrenamiento:
          entrenamientoActual,
      })
    }


    // ========================================================
    // 2. NO HAY SESIÓN ACTIVA:
    //    LEER EL DÍA SOLICITADO
    //
    // Aceptamos distintas claves para que la API sea robusta.
    // ========================================================

    let body = {}

    try {
      body =
        await request.json()
    } catch {
      body = {}
    }


    const diaCrudo =
      body?.dia ??
      body?.diaNumero ??
      body?.dia_numero ??
      null


    const dia =
      Number(
        diaCrudo
      )


    if (
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 7
    ) {
      console.error(
        'DÍA RECIBIDO INVÁLIDO:',
        body
      )

      return responderError(
        'El día seleccionado no es válido.',
        400
      )
    }


    // ========================================================
    // 3. INICIAR SESIÓN
    // ========================================================


    // Solo aceptamos identificadores y posiciones.
    // Nunca nombres ni prescripciones desde el cliente.
    const variantes = body?.variantes ?? []

    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (
      !Array.isArray(variantes) ||
      variantes.length > 30
    ) {
      return responderError(
        'Las variantes enviadas no son válidas.',
        400
      )
    }

    const posiciones = new Set()

    for (const variante of variantes) {
      const orden = variante?.orden

      if (
        !Number.isSafeInteger(orden) ||
        orden < 1 ||
        orden > 30 ||
        posiciones.has(orden) ||
        !uuid.test(
          String(variante?.ejercicio_programado_id || '')
        ) ||
        !uuid.test(
          String(variante?.ejercicio_realizado_id || '')
        )
      ) {
        return responderError(
          'La selección de variantes no es válida.',
          400
        )
      }

      posiciones.add(orden)
    }

    const {
      data: inicio,
      error: errorInicio,
    } =
      await supabase.rpc(
        'iniciar_mi_entrenamiento_con_variantes_app',
        {
          p_dia: dia,
          p_confirmar_repeticion:
            body?.confirmar_repeticion === true,
          p_variantes: variantes,
        }
      )


    if (errorInicio) {
      return traducirErrorRpc(
        errorInicio
      )
    }


    // ========================================================
    // 4. RECUPERAR SESIÓN COMPLETA
    // ========================================================

    const {
      data: entrenamiento,
      error: errorEntrenamiento,
    } =
      await obtenerEntrenamientoActual(
        supabase
      )


    if (errorEntrenamiento) {
      return traducirErrorRpc(
        errorEntrenamiento
      )
    }


    return NextResponse.json({
      ok: true,

      reanudada:
        Boolean(
          inicio?.reanudada
        ),

      inicio,

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
      const mensaje =
        String(
          error?.message || ''
        )

      if (
        mensaje.includes(
          'SESION_SOCIO_INVALIDA'
        )
      ) {
        return responderError(
          'Sesión no válida.',
          401
        )
      }

      console.error(
        'CANCELAR ENTRENAMIENTO RPC:',
        error
      )

      return responderError(
        'No fue posible cancelar el entrenamiento.',
        500
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


// MAK SOCIOS - Guardar o actualizar una serie
export async function PATCH(request) {
  try {
    const { supabase, error: authError } =
      await obtenerSupabaseAutenticado()

    if (authError) return authError

    let body

    try {
      body = await request.json()
    } catch {
      return responderError('Datos inválidos.', 400)
    }

    const id = body?.ejercicio_id
    const serie = body?.numero_serie

    const uuidValido =
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (
      !uuidValido ||
      !Number.isSafeInteger(serie) ||
      serie < 1 ||
      typeof body.completada !== 'boolean'
    ) {
      return responderError(
        'Ejercicio o número de serie inválido.',
        400
      )
    }

    const convertir = (valor, entero = false) => {
      if (
        valor === null ||
        valor === undefined ||
        valor === ''
      ) return null

      if (
        typeof valor !== 'number' &&
        typeof valor !== 'string'
      ) return NaN

      const texto = String(valor).trim().replace(',', '.')
      if (!texto) return null

      const numero = Number(texto)

      if (
        !Number.isFinite(numero) ||
        numero < 0 ||
        (entero && !Number.isSafeInteger(numero))
      ) return NaN

      return numero
    }

    const peso = convertir(body.peso_kg)
    const reps = convertir(body.repeticiones, true)
    const actividad =
      body.actividad_sin_repeticiones === true

    if (
      Number.isNaN(peso) ||
      Number.isNaN(reps) ||
      (body.duracion_seg !== undefined &&
       body.duracion_seg !== null) ||
      (peso !== null &&
        Math.abs(peso / 2.5 - Math.round(peso / 2.5)) >
          0.0000001)
    ) {
      return responderError(
        'El peso debe avanzar en incrementos de 2,5 kg. No se registran tiempos por ejercicio.',
        400
      )
    }

    if (actividad && (peso !== null || reps !== null)) {
      return responderError(
        'Esta actividad solo permite marcar su realización.',
        400
      )
    }

    if (
      body.completada &&
      !actividad &&
      (peso === null || !(reps > 0))
    ) {
      return responderError(
        'Registra peso y repeticiones para completar esta serie.',
        400
      )
    }

    const { data, error } = await supabase.rpc(
      'guardar_mi_serie_entrenamiento_app',
      {
        p_entrenamiento_ejercicio_id: id,
        p_numero_serie: serie,
        p_peso_kg: peso,
        p_repeticiones: reps,
        p_duracion_seg: null,
        p_rir: null,
        p_completada: body.completada,
      }
    )

    if (error) {
      const mensaje = String(error.message || '')

      if (mensaje.includes('SOCIO_NO_VALIDO'))
        return responderError('Sesión no válida.', 401)

      if (mensaje.includes('MEMBRESIA_ACTIVA_REQUERIDA'))
        return responderError('Necesitas una membresía activa.', 403)

      if (mensaje.includes('EJERCICIO_NO_DISPONIBLE'))
        return responderError('Ejercicio no disponible.', 409)

      if (mensaje.includes('PESO_NO_DISPONIBLE'))
        return responderError(
          'Introduce un peso válido en incrementos de 2,5 kg.',
          400
        )

      if (
        mensaje.includes('NUMERO_SERIE_INVALIDO') ||
        mensaje.includes('SERIES_OBJETIVO_INVALIDAS') ||
        mensaje.includes('DATOS_SERIE_INCOMPLETOS') ||
        mensaje.includes('DATOS_ACTIVIDAD_INVALIDOS') ||
        mensaje.includes('VALORES_SERIE_INVALIDOS')
      ) {
        return responderError(
          'Revisa los datos registrados.',
          400
        )
      }

      console.error('PATCH ENTRENAMIENTO:', error)
      return responderError('No fue posible guardar la serie.', 500)
    }

    return NextResponse.json({
      ok: true,
      serie: data.serie,
      ejercicio_completado: data.ejercicio_completado,
      series_completadas: data.series_completadas,
      series_objetivo: data.series_objetivo,
    })

  } catch (error) {
    console.error('PATCH ENTRENAMIENTO:', error)
    return responderError('No fue posible guardar la serie.', 500)
  }
}


export async function PUT() {
  try {
    const { supabase, error: authError } =
      await obtenerSupabaseAutenticado()

    if (authError) return authError

    const { data, error } = await supabase.rpc(
      'finalizar_mi_entrenamiento_app'
    )

    if (error) {
      const mensaje = String(error.message || '')

      if (mensaje.includes('SOCIO_NO_VALIDO'))
        return responderError('Sesión no válida.', 401)

      if (mensaje.includes('MEMBRESIA_ACTIVA_REQUERIDA'))
        return responderError('Necesitas una membresía activa.', 403)

      if (mensaje.includes('ENTRENAMIENTO_INCOMPLETO'))
        return responderError(
          'Aún faltan series por completar o corregir.',
          409
        )

      if (mensaje.includes('ENTRENAMIENTO_NO_DISPONIBLE'))
        return responderError(
          'No existe un entrenamiento activo para finalizar.',
          409
        )

      console.error('FINALIZAR ENTRENAMIENTO:', error)

      return responderError(
        'No fue posible finalizar el entrenamiento.',
        500
      )
    }

    if (!data?.ok) {
      return responderError(
        'No se pudo confirmar la finalización.',
        500
      )
    }

    return NextResponse.json({
      ok: true,
      resultado: data,
    })

  } catch (error) {
    console.error('PUT ENTRENAMIENTO:', error)

    return responderError(
      'No fue posible finalizar el entrenamiento.',
      500
    )
  }
}
