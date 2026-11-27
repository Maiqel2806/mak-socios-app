import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { colaboradorDeMiembro } from '@/lib/colaborador'
import { esAdministrador } from '@/lib/rutinas/servidor'

/**
 * Herramientas de entrenador (simulador, biblioteca, sugerencias):
 * colaboradores activos con acceso a la app y administradores de la app
 * (MAK_ADMIN_CODIGOS). Todos entran con su código como cualquier socio.
 */
export async function perfilStaff(supabase) {
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { ok: false }

  const admin = createAdminClient()
  const { data: cuenta } = await admin
    .from('socio_cuentas_app')
    .select('miembro_id, activo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!cuenta?.activo) return { ok: false, userId }

  const [colaborador, permisoAdmin] = await Promise.all([
    colaboradorDeMiembro(cuenta.miembro_id),
    esAdministrador(supabase).catch(() => ({ ok: false })),
  ])

  if (!colaborador?.vigente && !permisoAdmin.ok) return { ok: false, userId }

  let nombre = [colaborador?.nombre, colaborador?.apellido].filter(Boolean).join(' ')
  if (!nombre) {
    const { data: miembro } = await admin
      .from('miembros')
      .select('nombre, apellido')
      .eq('id', cuenta.miembro_id)
      .maybeSingle()
    nombre = [miembro?.nombre, miembro?.apellido].filter(Boolean).join(' ') || 'Equipo MAK'
  }

  return {
    ok: true,
    userId,
    miembroId: cuenta.miembro_id,
    nombre,
    cargo: colaborador?.cargo_nombre || 'Administrador',
    esDueno: Boolean(permisoAdmin.ok),
  }
}
