import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { VERSION_MOTOR, generarRutina } from './motor'
import {
  cargarEquipamiento,
  cargarPersonalizados,
  miembroDelUsuario,
  estadoDesdeTablas,
} from './servidor'

// Texto técnico corto de un error de Supabase/Postgres, para diagnóstico
export function detalleError(error) {
  if (!error) return null
  if (typeof error === 'string') return error
  return [error.code, error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 400)
}

function edadDesdeFecha(fecha) {
  if (!fecha) return null
  const nacimiento = new Date(fecha)
  if (Number.isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad > 4 && edad < 110 ? edad : null
}

/**
 * Reúne todo lo necesario y genera la rutina v4 del socio (sin guardarla).
 * Devuelve { ok, paso, error, status, ... } para poder diagnosticar en qué
 * paso falla.
 */
export async function prepararRutinaV4(supabase, userId) {
  let { data: estado, error: errorEstado } =
    await supabase.rpc('obtener_mi_rutina_app')

  // Si la función SQL antigua falla por algo que no sea acceso/membresía,
  // se lee el perfil directamente de las tablas.
  if (errorEstado) {
    const msg = String(errorEstado.message || '')
    const esDeAcceso =
      msg.includes('MEMBRESIA') || msg.includes('AUTENTIC') || msg.includes('CUENTA')
    if (!esDeAcceso) {
      const id = await miembroDelUsuario(supabase, userId)
      const alterno = await estadoDesdeTablas(id).catch(() => null)
      if (alterno) {
        estado = alterno
        errorEstado = null
      }
    }
  }

  if (errorEstado) {
    return {
      ok: false,
      paso: 'estado',
      status: 400,
      error: 'No pudimos leer tu perfil.',
      detalle: detalleError(errorEstado),
      rpcMensaje: String(errorEstado.message || ''),
    }
  }

  if (!estado?.tiene_perfil) {
    return {
      ok: false,
      paso: 'perfil',
      status: 409,
      error: 'Completa primero tu perfil físico.',
    }
  }

  if (estado?.requiere_revision === true && estado?.puede_generar === false) {
    return {
      ok: false,
      paso: 'revision',
      status: 409,
      requiere_revision: true,
      error:
        estado?.message ||
        'Tus limitaciones físicas están en revisión por el equipo MAK.',
    }
  }

  const miembroId = await miembroDelUsuario(supabase, userId)
  if (!miembroId) {
    return {
      ok: false,
      paso: 'cuenta',
      status: 401,
      error: 'Tu sesión ya no es válida. Inicia sesión nuevamente.',
    }
  }

  const admin = createAdminClient()

  const { data: perfilTabla, error: errorPerfil } = await admin
    .from('socio_perfiles_fisicos')
    .select('*')
    .eq('miembro_id', miembroId)
    .maybeSingle()

  if (errorPerfil) {
    return {
      ok: false,
      paso: 'perfil_tabla',
      status: 500,
      error: 'No pudimos leer tu perfil físico.',
      detalle: detalleError(errorPerfil),
    }
  }

  const perfil = {
    ...(estado.perfil || {}),
    ...(perfilTabla || {}),
  }

  if (!Number(perfil.edad)) {
    const { data: miembro } = await admin
      .from('miembros')
      .select('fecha_nacimiento')
      .eq('id', miembroId)
      .maybeSingle()
    const edad = edadDesdeFecha(miembro?.fecha_nacimiento)
    if (edad) perfil.edad = edad
  }

  // Popularidad de ejercicios en las rutinas v4 activas de otros socios
  const popularidad = {}
  const { data: activas } = await admin
    .from('socio_rutinas_generadas')
    .select('rutina_json')
    .eq('activa', true)
    .neq('miembro_id', miembroId)
    .order('fecha_registro', { ascending: false })
    .limit(120)

  for (const fila of activas || []) {
    if (fila?.rutina_json?.motor !== VERSION_MOTOR) continue
    const vistos = new Set()
    for (const dia of fila.rutina_json.dias || []) {
      for (const ej of dia?.ejercicios || []) {
        if (ej?.codigo && !vistos.has(ej.codigo)) {
          vistos.add(ej.codigo)
          popularidad[ej.codigo] = (popularidad[ej.codigo] || 0) + 1
        }
      }
    }
  }

  const [equipamiento, personalizados] = await Promise.all([
    cargarEquipamiento(),
    cargarPersonalizados(),
  ])

  let rutina
  try {
    rutina = generarRutina(perfil, {
      equipamiento,
      personalizados,
      popularidad,
      semilla: `${miembroId}-${Date.now()}`,
    })
  } catch (e) {
    return {
      ok: false,
      paso: 'motor',
      status: 500,
      error: 'No pudimos crear tu rutina.',
      detalle: String(e?.message || e).slice(0, 400),
    }
  }

  if (!rutina?.dias?.length) {
    return {
      ok: false,
      paso: 'motor',
      status: 500,
      error: 'No pudimos crear tu rutina.',
      detalle: 'El motor devolvió una rutina vacía.',
    }
  }

  return { ok: true, admin, estado, perfil, rutina, miembroId }
}

/**
 * Guarda la rutina sin riesgo de dejar al socio sin rutina:
 * 1) inserta la nueva como inactiva (probando variantes por si la tabla
 *    tiene restricciones en origen/motor_version),
 * 2) desactiva las anteriores y activa la nueva,
 * 3) si algo falla, restaura las anteriores y borra la nueva.
 * Con soloPrueba = true inserta y borra (diagnóstico).
 */
export async function guardarRutinaV4(
  admin,
  { miembroId, perfil, rutina },
  { soloPrueba = false } = {}
) {
  const base = {
    miembro_id: miembroId,
    objetivo: perfil.objetivo || rutina.objetivo || 'salud',
    nivel: perfil.nivel || rutina.nivel || 'principiante',
    dias_semana: Math.round(Number(rutina.dias_semana || perfil.dias_entrenamiento || 3)),
    tiempo_sesion_min: Math.round(
      Number(rutina.tiempo_maximo_sesion_min || perfil.tiempo_sesion_min || 60)
    ),
    limitaciones: perfil.limitaciones || null,
    rutina_json: rutina,
    activa: false,
    perfil_fecha_actualizacion:
      perfil.fecha_actualizacion || new Date().toISOString(),
  }

  const intentos = [
    { ...base, motor_version: VERSION_MOTOR, origen: 'app_motor_v4' },
    { ...base, motor_version: VERSION_MOTOR, origen: 'app' },
    { ...base, motor_version: VERSION_MOTOR },
    { ...base },
  ]

  const errores = []
  let nuevaId = null
  let intentoUsado = null

  for (let i = 0; i < intentos.length; i++) {
    const { data, error } = await admin
      .from('socio_rutinas_generadas')
      .insert(intentos[i])
      .select('id')
      .single()

    if (!error && data?.id) {
      nuevaId = data.id
      intentoUsado = i + 1
      break
    }
    errores.push(`insertar#${i + 1}: ${detalleError(error)}`)
  }

  if (!nuevaId) {
    return { ok: false, paso: 'insertar', errores }
  }

  if (soloPrueba) {
    const { error } = await admin
      .from('socio_rutinas_generadas')
      .delete()
      .eq('id', nuevaId)
    if (error) errores.push(`borrar_prueba: ${detalleError(error)}`)
    return { ok: true, prueba: true, intento: intentoUsado, errores }
  }

  // Rutinas activas actuales (para restaurarlas si algo falla)
  const { data: anteriores } = await admin
    .from('socio_rutinas_generadas')
    .select('id')
    .eq('miembro_id', miembroId)
    .eq('activa', true)
    .neq('id', nuevaId)

  const idsAnteriores = (anteriores || []).map((f) => f.id)

  if (idsAnteriores.length) {
    const { error } = await admin
      .from('socio_rutinas_generadas')
      .update({ activa: false })
      .in('id', idsAnteriores)

    if (error) {
      errores.push(`desactivar: ${detalleError(error)}`)
      await admin.from('socio_rutinas_generadas').delete().eq('id', nuevaId)
      return { ok: false, paso: 'desactivar', errores }
    }
  }

  const { error: errorActivar } = await admin
    .from('socio_rutinas_generadas')
    .update({ activa: true })
    .eq('id', nuevaId)

  if (errorActivar) {
    errores.push(`activar: ${detalleError(errorActivar)}`)
    if (idsAnteriores.length) {
      await admin
        .from('socio_rutinas_generadas')
        .update({ activa: true })
        .in('id', idsAnteriores)
    }
    await admin.from('socio_rutinas_generadas').delete().eq('id', nuevaId)
    return { ok: false, paso: 'activar', errores }
  }

  return { ok: true, id: nuevaId, intento: intentoUsado, errores }
}
