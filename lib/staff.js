import 'server-only'
import { redirect } from 'next/navigation'

import { createAdminClient } from '@/lib/supabase/admin'

// Roles del sistema administrativo que pueden usar el modo entrenador
export const ROLES_STAFF = ['dueno', 'empleado', 'entrenador', 'coach', 'administrador']

/**
 * ¿La sesión actual es de un usuario del sistema administrativo
 * (entrenador / personal)? Se valida contra admin_usuarios.
 */
export async function perfilStaff(supabase) {
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return { ok: false }

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('admin_usuarios')
    .select('id, usuario, nombre, rol, activo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!usuario?.activo || !ROLES_STAFF.includes(String(usuario.rol || '').toLowerCase())) {
    return { ok: false, userId }
  }

  return {
    ok: true,
    userId,
    id: usuario.id,
    usuario: usuario.usuario,
    nombre: usuario.nombre || usuario.usuario,
    rol: String(usuario.rol).toLowerCase(),
    esDueno: String(usuario.rol).toLowerCase() === 'dueno',
  }
}

/** En páginas de socio: si quien entra es entrenador, lo lleva a su panel. */
export async function redirigirSiStaff(supabase) {
  const staff = await perfilStaff(supabase).catch(() => ({ ok: false }))
  if (staff.ok) {
    redirect('/entrenador')
  }
}
