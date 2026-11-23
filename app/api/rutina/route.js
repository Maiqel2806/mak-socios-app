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
  VERSION_MOTOR,
  generarRutina,
} from '@/lib/rutinas/motor'

import {
  cargarEquipamiento,
  cargarPersonalizados,
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


  return NextResponse.json({
    ok: true,
    estado: data,
  })
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

  const admin =
    createAdminClient()

  // Perfil completo directamente de la tabla (incluye observaciones,
  // precauciones y objetivo secundario)
  const {
    data: perfilTabla,
  } = await admin
    .from('socio_perfiles_fisicos')
    .select('*')
    .eq('miembro_id', miembroId)
    .maybeSingle()

  const perfil = {
    ...(estado.perfil || {}),
    ...(perfilTabla || {}),
  }

  // Popularidad de ejercicios en las rutinas activas de otros socios:
  // el motor la usa para repartir y evitar que todos tengan lo mismo
  const {
    data: activas,
  } = await admin
    .from('socio_rutinas_generadas')
    .select('rutina_json')
    .eq('activa', true)
    .eq('motor_version', VERSION_MOTOR)
    .neq('miembro_id', miembroId)
    .order('fecha_registro', { ascending: false })
    .limit(80)

  const popularidad = {}
  for (const fila of activas || []) {
    const vistos = new Set()
    for (const dia of fila?.rutina_json?.dias || []) {
      for (const ej of dia?.ejercicios || []) {
        if (ej?.codigo && !vistos.has(ej.codigo)) {
          vistos.add(ej.codigo)
          popularidad[ej.codigo] = (popularidad[ej.codigo] || 0) + 1
        }
      }
    }
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
      perfil,
      {
        equipamiento,
        personalizados,
        popularidad,
        semilla:
          `${miembroId}-${Date.now()}`,
      }
    )

  // Conserva el historial: la rutina anterior queda inactiva, no se borra
  const {
    error: errorDesactivar,
  } = await admin
    .from('socio_rutinas_generadas')
    .update({
      activa: false,
    })
    .eq('miembro_id', miembroId)
    .eq('activa', true)

  if (errorDesactivar) {
    console.error('DESACTIVAR RUTINA V4:', errorDesactivar)
    return errorJson('No pudimos guardar tu rutina.', 500)
  }

  const {
    error: errorGuardar,
  } = await admin
    .from('socio_rutinas_generadas')
    .insert({
      miembro_id: miembroId,
      objetivo: perfil.objetivo,
      nivel: perfil.nivel,
      dias_semana: rutina.dias_semana,
      tiempo_sesion_min: rutina.tiempo_maximo_sesion_min,
      limitaciones: perfil.limitaciones || null,
      rutina_json: rutina,
      activa: true,
      perfil_fecha_actualizacion:
        perfil.fecha_actualizacion || new Date().toISOString(),
      motor_version: rutina.motor,
      origen: 'app_motor_v4',
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
