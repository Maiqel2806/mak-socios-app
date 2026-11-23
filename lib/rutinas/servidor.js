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
