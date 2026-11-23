import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'

import {
  createAdminClient,
} from '@/lib/supabase/admin'

import {
  generarRutina,
} from '@/lib/rutinas/motor'

import {
  cargarEquipamiento,
  cargarPersonalizados,
  huellaPerfil,
  miembroDelUsuario,
  motorV4Activo,
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
    return errorRpc(
      String(
        error.message || ''
      ),
      'No pudimos cargar tu rutina.'
    )
  }


  if (!motorV4Activo()) {
    return NextResponse.json({
      ok: true,
      estado: data,
    })
  }

  // ---------- Motor v4: la rutina vive en socio_rutinas_v4 ----------
  const miembroId =
    await miembroDelUsuario(
      supabase,
      userId
    )

  const rutinaV4 =
    miembroId
      ? await rutinaActivaV4(
          miembroId
        )
      : null

  if (!rutinaV4) {
    return NextResponse.json({
      ok: true,
      estado: {
        ...(data || {}),
        tiene_rutina: false,
        rutina: null,
        // Si existía una rutina del motor anterior, invitamos a renovarla
        requiere_regenerar:
          Boolean(data?.tiene_rutina),
      },
    })
  }

  return NextResponse.json({
    ok: true,
    estado: {
      ...(data || {}),
      tiene_rutina: true,
      rutina: rutinaV4.rutina,
      motor: 'v4',
      requiere_regenerar:
        huellaPerfil(data?.perfil) !==
        rutinaV4.huella_perfil,
    },
  })
}


async function rutinaActivaV4(
  miembroId
) {
  try {
    const admin =
      createAdminClient()

    const {
      data,
      error,
    } = await admin
      .from('socio_rutinas_v4')
      .select('id, rutina, huella_perfil, created_at')
      .eq('miembro_id', miembroId)
      .eq('activa', true)
      .order('created_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    return error
      ? null
      : data
  } catch {
    return null
  }
}


async function generarRutinaV4(
  supabase,
  userId
) {
  const {
    data: estado,
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
      'No pudimos generar tu rutina.'
    )
  }

  if (
    !estado?.tiene_perfil ||
    !estado?.perfil
  ) {
    return errorJson(
      'Completa primero tu perfil físico.',
      409
    )
  }

  if (
    estado?.requiere_revision === true &&
    estado?.puede_generar === false
  ) {
    return NextResponse.json(
      {
        ok: false,
        requiere_revision: true,
        message:
          estado?.message ||
          'Tus limitaciones físicas están en revisión por el equipo MAK.',
      },
      {
        status: 409,
      }
    )
  }

  const miembroId =
    await miembroDelUsuario(
      supabase,
      userId
    )

  if (!miembroId) {
    return errorJson(
      'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      401
    )
  }

  const [
    equipamiento,
    personalizados,
  ] = await Promise.all([
    cargarEquipamiento(),
    cargarPersonalizados(),
  ])

  const rutina =
    generarRutina(
      estado.perfil,
      {
        equipamiento,
        personalizados,
        semilla:
          `${miembroId}-${Date.now()}`,
      }
    )

  const admin =
    createAdminClient()

  // Conserva el historial: la rutina anterior queda inactiva, no se borra
  await admin
    .from('socio_rutinas_v4')
    .update({
      activa: false,
    })
    .eq('miembro_id', miembroId)
    .eq('activa', true)

  const {
    error: errorGuardar,
  } = await admin
    .from('socio_rutinas_v4')
    .insert({
      miembro_id: miembroId,
      rutina,
      motor: rutina.motor,
      semilla: rutina.semilla,
      huella_perfil:
        huellaPerfil(
          estado.perfil
        ),
      activa: true,
    })

  if (errorGuardar) {
    console.error(
      'GUARDAR RUTINA V4:',
      errorGuardar
    )

    return errorJson(
      'No pudimos guardar tu rutina.',
      500
    )
  }

  return NextResponse.json({
    ok: true,
    motor: rutina.motor,
    total_ejercicios:
      rutina.total_ejercicios,
  })
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
