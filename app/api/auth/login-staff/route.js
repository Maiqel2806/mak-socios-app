import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES_STAFF } from '@/lib/staff'

export const runtime = 'nodejs'

function responder(error, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

/**
 * Ingreso de entrenadores y personal con su usuario y contraseña del
 * sistema administrativo (tabla admin_usuarios). No requiere ser socio
 * ni tener membresía.
 */
export async function POST(request) {
  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return responder('Solicitud no autorizada.', 403)
  }

  const body = await request.json().catch(() => null)
  const usuario = String(body?.usuario || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!usuario || !password || usuario.length > 60 || password.length > 128) {
    return responder('Ingresa tu usuario y contraseña.')
  }

  const incorrecto = 'Usuario o contraseña incorrectos.'

  try {
    const admin = createAdminClient()
    const { data: cuenta } = await admin
      .from('admin_usuarios')
      .select('auth_user_id, auth_email, rol, activo')
      .eq('usuario', usuario)
      .maybeSingle()

    if (!cuenta?.auth_email || !cuenta.auth_user_id) return responder(incorrecto, 401)
    if (!cuenta.activo) return responder('Tu usuario está desactivado. Consulta con administración.', 403)
    if (!ROLES_STAFF.includes(String(cuenta.rol || '').toLowerCase())) {
      return responder('Tu usuario no tiene acceso al modo entrenador.', 403)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cuenta.auth_email,
      password,
    })

    if (error || data?.user?.id !== cuenta.auth_user_id) {
      if (data?.user) await supabase.auth.signOut()
      return responder(incorrecto, 401)
    }

    return NextResponse.json({ ok: true, destino: '/entrenador' })
  } catch (e) {
    console.error('LOGIN STAFF:', e)
    return responder('No se pudo iniciar sesión. Intenta de nuevo.', 500)
  }
}
