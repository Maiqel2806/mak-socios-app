import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { EQUIPAMIENTO_POR_DEFECTO } from './equipamiento'

// Activa el motor v4 con la variable de entorno MOTOR_RUTINAS=v4.
// Mientras no esté activa, la app sigue usando el motor SQL v3.
export function motorV4Activo() {
  return String(process.env.MOTOR_RUTINAS || '').toLowerCase() === 'v4'
}

/** Equipamiento del gimnasio (tabla editable). Fallback: catálogo por defecto. */
export async function cargarEquipamiento() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('gimnasio_equipamiento')
      .select('codigo, nombre, zona, activo, incremento_kg, nuevo, notas')
      .order('zona')
      .order('nombre')

    if (error || !data?.length) return EQUIPAMIENTO_POR_DEFECTO
    return data
  } catch {
    return EQUIPAMIENTO_POR_DEFECTO
  }
}

/** Ejercicios creados por el gimnasio para máquinas nuevas. */
export async function cargarPersonalizados() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('gimnasio_ejercicios_personalizados')
      .select('*')
      .eq('activo', true)

    return error ? [] : data || []
  } catch {
    return []
  }
}

/** miembro_id del socio autenticado. */
export async function miembroDelUsuario(supabase, userId) {
  const { data } = await supabase
    .from('socio_cuentas_app')
    .select('miembro_id, activo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  return data?.activo ? data.miembro_id : null
}

/**
 * ¿El usuario autenticado es administrador?
 * Se define con MAK_ADMIN_CODIGOS="MAK001,MAK002" (códigos de acceso).
 */
export async function esAdministrador(supabase) {
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { ok: false }

  const permitidos = String(process.env.MAK_ADMIN_CODIGOS || '')
    .split(',')
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)

  if (!permitidos.length) return { ok: false, userId }

  const miembroId = await miembroDelUsuario(supabase, userId)
  if (!miembroId) return { ok: false, userId }

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('codigo_acceso, nombre')
    .eq('id', miembroId)
    .maybeSingle()

  const codigo = String(miembro?.codigo_acceso || '').trim().toUpperCase()

  return {
    ok: Boolean(codigo) && permitidos.includes(codigo),
    userId,
    miembroId,
    nombre: miembro?.nombre || '',
  }
}

/** Huella del perfil para detectar si la rutina quedó desactualizada. */
export function huellaPerfil(perfil) {
  return [
    perfil?.objetivo,
    perfil?.nivel,
    Number(perfil?.dias_entrenamiento) || '',
    Number(perfil?.tiempo_sesion_min) || '',
    String(perfil?.limitaciones || '').trim() ? 'lim' : '',
  ].join('|')
}

/**
 * Con el motor v4 activo, la rutina que se muestra se lee directamente de
 * socio_rutinas_generadas (fila activa), sin depender de cómo la función SQL
 * antigua arme o reconstruya la rutina. Si la rutina activa es del sistema
 * anterior, se marca para que el socio la actualice.
 */
export async function estadoConRutinaV4(estado, miembroId) {
  if (!motorV4Activo() || !miembroId || !estado) return estado

  try {
    const admin = createAdminClient()
    const { data: fila } = await admin
      .from('socio_rutinas_generadas')
      .select('id, rutina_json, motor_version, fecha_registro')
      .eq('miembro_id', miembroId)
      .eq('activa', true)
      .order('fecha_registro', { ascending: false })
      .limit(1)
      .maybeSingle()

    const esV4 =
      (fila?.motor_version === 'mak-adaptativo-v4' ||
        fila?.rutina_json?.motor === 'mak-adaptativo-v4') &&
      fila?.rutina_json?.dias?.length

    if (esV4) {
      return {
        ...estado,
        tiene_rutina: true,
        requiere_regenerar: false,
        rutina_anterior: false,
        rutina: {
          ...fila.rutina_json,
          id: fila.id,
          rutina_generada_id: fila.id,
        },
      }
    }

    // Rutina activa del sistema anterior: pedir actualizarla
    if (estado.tiene_perfil && estado.tiene_rutina) {
      return {
        ...estado,
        rutina_anterior: true,
      }
    }
  } catch (e) {
    console.error('RUTINA V4 ESTADO:', e)
  }

  return estado
}

/**
 * Si la función SQL antigua falla al leer el estado (por ejemplo, porque no
 * reconoce una rutina del motor v4), arma el estado directamente desde las
 * tablas para que el socio siga viendo su perfil y su rutina.
 */
export async function estadoDesdeTablas(miembroId) {
  if (!miembroId) return null
  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('socio_perfiles_fisicos')
    .select('*')
    .eq('miembro_id', miembroId)
    .maybeSingle()

  const tienePerfil = Boolean(
    perfil && Number(perfil.peso_kg) && Number(perfil.estatura_cm) && perfil.objetivo
  )

  const base = {
    tiene_perfil: tienePerfil,
    perfil: perfil || null,
    tiene_rutina: false,
    puede_generar: tienePerfil,
    requiere_regenerar: false,
    requiere_revision: false,
  }

  return estadoConRutinaV4(base, miembroId)
}
