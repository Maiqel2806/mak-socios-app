import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'


function errorJson(
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


function esUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(valor || '').trim()
  )
}


export async function GET(
  request
) {
  try {
    const supabase =
      await createClient()

    const {
      data: claimsData,
      error: claimsError,
    } =
      await supabase.auth.getClaims()

    if (
      claimsError ||
      !claimsData?.claims
    ) {
      return errorJson(
        'Sesión no válida.',
        401
      )
    }

    const {
      searchParams,
    } =
      new URL(
        request.url
      )

    const ejercicioId =
      String(
        searchParams.get(
          'ejercicio_id'
        ) || ''
      ).trim()

    if (!esUuid(ejercicioId)) {
      return errorJson(
        'Ejercicio no válido.',
        400
      )
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'obtener_variantes_ejercicio_app',
        {
          p_ejercicio_id:
            ejercicioId,
        }
      )

    if (error) {
      const mensaje =
        String(
          error.message || ''
        )

      if (
        mensaje.includes(
          'MEMBRESIA_ACTIVA_REQUERIDA'
        )
      ) {
        return errorJson(
          'Necesitas una membresía activa para consultar variantes.',
          403
        )
      }

      if (
        mensaje.includes(
          'RUTINA_ACTIVA_REQUERIDA'
        )
      ) {
        return errorJson(
          'No tienes una rutina activa.',
          409
        )
      }

      if (
        mensaje.includes(
          'EJERCICIO_NO_PERTENECE_A_RUTINA'
        )
      ) {
        return errorJson(
          'Este ejercicio no pertenece a tu rutina actual.',
          403
        )
      }

      console.error(
        'VARIANTES RUTINA:',
        error
      )

      return errorJson(
        'No fue posible consultar las variantes.',
        500
      )
    }

    return NextResponse.json({
      ok: true,
      datos: data,
    })

  } catch (error) {
    console.error(
      'GET VARIANTES RUTINA:',
      error
    )

    return errorJson(
      'No fue posible consultar las variantes.',
      500
    )
  }
}
