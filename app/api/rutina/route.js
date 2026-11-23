import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'

import {
  prepararRutinaV4,
  guardarRutinaV4,
} from '@/lib/rutinas/generacion'

import {
  miembroDelUsuario,
  motorV4Activo,
  estadoConRutinaV4,
  estadoDesdeTablas,
} from '@/lib/rutinas/servidor'


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

    userId:
      data?.claims?.sub || null,

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
    userId,
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
    const mensaje = String(error.message || '')
    const esDeAcceso =
      mensaje.includes('MEMBRESIA') ||
      mensaje.includes('AUTENTIC') ||
      mensaje.includes('CUENTA')

    if (motorV4Activo() && !esDeAcceso) {
      console.error('OBTENER RUTINA (SQL) FALLÓ, USANDO TABLAS:', error)
      const miembroId = await miembroDelUsuario(supabase, userId)
      const estado = await estadoDesdeTablas(miembroId).catch(() => null)
      if (estado) {
        return NextResponse.json({ ok: true, motor: 'v4', estado })
      }
    }

    return errorRpc(
      mensaje,
      'No pudimos cargar tu rutina.'
    )
  }


  let estado = data
  if (motorV4Activo()) {
    const miembroId = await miembroDelUsuario(supabase, userId)
    estado = await estadoConRutinaV4(data, miembroId)
  }

  return NextResponse.json({
    ok: true,
    motor: motorV4Activo() ? 'v4' : 'anterior',
    estado,
  })
}


async function generarRutinaV4(
  supabase,
  userId
) {
  try {
    const preparada =
      await prepararRutinaV4(supabase, userId)

    if (!preparada.ok) {
      if (preparada.rpcMensaje) {
        return errorRpc(preparada.rpcMensaje, preparada.error)
      }
      if (preparada.requiere_revision) {
        return NextResponse.json(
          {
            ok: false,
            requiere_revision: true,
            message: preparada.error,
          },
          { status: 409 }
        )
      }
      console.error('RUTINA V4', preparada.paso, preparada.detalle)
      return errorJson(preparada.error, preparada.status || 500, {
        paso: preparada.paso,
        detalle: preparada.detalle || null,
      })
    }

    const guardado =
      await guardarRutinaV4(preparada.admin, preparada)

    if (!guardado.ok) {
      console.error('GUARDAR RUTINA V4', guardado.paso, guardado.errores)
      return errorJson('No pudimos guardar tu rutina.', 500, {
        paso: guardado.paso,
        detalle: guardado.errores.join(' || ').slice(0, 900),
      })
    }

    return NextResponse.json({
      ok: true,
      motor: preparada.rutina.motor,
      rutina_id: guardado.id,
      total_ejercicios: preparada.rutina.total_ejercicios,
    })
  } catch (e) {
    console.error('RUTINA V4 EXCEPCION', e)
    return errorJson('No pudimos crear tu rutina.', 500, {
      paso: 'excepcion',
      detalle: String(e?.message || e).slice(0, 400),
    })
  }
}


export async function POST() {
  const {
    supabase,
    userId,
    autorizado,
  } =
    await sesion()


  if (!autorizado) {
    return errorJson(
      'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      401
    )
  }


  if (motorV4Activo()) {
    return generarRutinaV4(
      supabase,
      userId
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
