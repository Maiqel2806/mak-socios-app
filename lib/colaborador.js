import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export const CARGOS = {
  entrenador: 'Entrenador',
  recepcion: 'Recepción',
  limpieza: 'Limpieza',
  administracion: 'Administración',
  nutricion: 'Nutrición',
  otro: 'Colaborador',
}

/**
 * Colaborador (staff) vinculado al registro interno de miembros.
 * Devuelve null si no es colaborador o si la tabla aún no existe.
 */
export async function colaboradorDeMiembro(miembroId) {
  if (!miembroId) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('colaboradores')
      .select('id, nombre, apellido, cargo, fecha_ingreso, activo, acceso_app')
      .eq('miembro_id', miembroId)
      .maybeSingle()
    if (error || !data) return null
    return {
      ...data,
      cargo_nombre: CARGOS[data.cargo] || 'Colaborador',
      vigente: Boolean(data.activo && data.acceso_app),
    }
  } catch {
    return null
  }
}

/** Membresía virtual del Plan Entrenador ($0, vigencia ilimitada). */
export function membresiaPlanEntrenador(colaborador) {
  return {
    tiene_membresia: true,
    estado_visual: 'activa',
    puede_entrenar_hoy: true,
    plan_nombre: 'Plan Entrenador',
    precio: 0,
    dias_restantes: null,
    fecha_inicio: colaborador?.fecha_ingreso || null,
    fecha_fin: null,
    es_fecha_fija: true,
    ilimitada: true,
  }
}
