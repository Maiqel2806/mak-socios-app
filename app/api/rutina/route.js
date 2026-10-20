import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'


function errorJson(
  error,
  status = 400,
  extra = {}
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...extra,
    },
    {
      status,
    }
  )
}


async function sesion() {
  const supabase =
    await createClient()

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims()

  return {
    supabase,

    autorizado:
      !error &&
      Boolean(
        data?.claims?.sub
      ),
  }
}


function errorRpc(
  mensaje,
  fallback
) {
  if (
    mensaje.includes(
      'MEMBRESIA_ACTIVA_REQUERIDA'
    )
  ) {
    return errorJson(
      'Necesitas una membresía activa para usar este beneficio.',
      403
    )
  }


  if (
    mensaje.includes(
      'PERFIL_FISICO_REQUERIDO'
    ) ||
    mensaje.includes(
      'PERFIL_FISICO_INCOMPLETO'
    )
  ) {
    return errorJson(
      'Completa primero tu perfil físico.',
      409
    )
  }


  if (
    mensaje.includes(
      'DIAS_ENTRENAMIENTO_INVALIDOS'
    )
  ) {
    return errorJson(
      'Tu perfil debe tener entre 1 y 5 días de entrenamiento.'
    )
  }


  if (
    mensaje.includes(
      'TIEMPO_SESION_INVALIDO'
    )
  ) {
    return errorJson(
      'Tu sesión debe durar 30, 40, 45, 50 o 60 minutos.'
    )
  }


  return errorJson(
    mensaje || fallback
  )
}


export async function GET() {
  const {
    supabase,
    autorizado,
  } =
    await sesion()


  if (!autorizado) {
    return errorJson(
      'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      401
    )
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      'obtener_mi_rutina_app'
    )


  if (error) {
    return errorRpc(
      String(
        error.message || ''
      ),
      'No pudimos cargar tu rutina.'
    )
  }


  return NextResponse.json({
    ok: true,
    estado: data,
  })
}


export async function POST() {
  const {
    supabase,
    autorizado,
  } =
    await sesion()


  if (!autorizado) {
    return errorJson(
      'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      401
    )
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      'generar_mi_rutina_app'
    )


  if (error) {
    return errorRpc(
      String(
        error.message || ''
      ),
      'No pudimos generar tu rutina.'
    )
  }


  if (
    data?.ok === false &&
    data?.requiere_revision
  ) {
    return NextResponse.json(
      data,
      {
        status: 409,
      }
    )
  }


  if (data?.ok === false) {
    return errorJson(
      data?.message ||
      'No pudimos generar tu rutina.',
      400,
      data
    )
  }


  return NextResponse.json(
    data
  )
}
