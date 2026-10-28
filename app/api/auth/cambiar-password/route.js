import { NextResponse } from 'next/server'
import { createClient as crearClienteTemporal } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function responder(error, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

export async function POST(request) {
  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return responder('Solicitud no autorizada.', 403)
  }

  const body = await request.json().catch(() => null)
  const actual = body?.actual
  const nueva = body?.nueva

  if (typeof actual !== 'string' ||
      typeof nueva !== 'string' ||
      actual.length > 128 ||
      nueva.length < 6 ||
      nueva.length > 72 ||
      actual === nueva) {
    return responder('Revisa las contraseñas ingresadas.')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const usuario = data?.user

  if (error || !usuario) {
    return responder('Tu sesión ha expirado.', 401)
  }

  const admin = createAdminClient()
  const { data: cuenta, error: errorCuenta } = await admin
    .from('socio_cuentas_app')
    .select('miembro_id, activo')
    .eq('auth_user_id', usuario.id)
    .maybeSingle()

  if (errorCuenta || !cuenta?.activo ||
      usuario.app_metadata?.mak_tipo_usuario !== 'socio' ||
      String(usuario.app_metadata?.miembro_id) !==
      String(cuenta.miembro_id)) {
    return responder('Cuenta no autorizada.', 403)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key || !usuario.email) {
    return responder('Servicio no disponible.', 503)
  }

  // Verificación independiente de la contraseña anterior.
  // No altera la sesión del navegador.
  const temporal = crearClienteTemporal(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  const comprobacion = await temporal.auth.signInWithPassword({
    email: usuario.email,
    password: actual
  })

  if (comprobacion.error ||
      comprobacion.data?.user?.id !== usuario.id) {
    return responder('La contraseña actual es incorrecta.')
  }

  const cambio = await supabase.auth.updateUser({
    password: nueva
  })

  if (cambio.error) {
    return responder('No se pudo actualizar la contraseña.')
  }

  const estado = await admin
    .from('socio_cuentas_app')
    .update({
      clave_cambiada: true,
      cambio_clave_obligatorio: false,
      aviso_cambio_clave_visto: true
    })
    .eq('auth_user_id', usuario.id)

  if (estado.error) {
    console.error('MAK: clave cambiada, falta actualizar estado')
  }

  // Exigir un nuevo inicio de sesión.
  await supabase.auth.signOut({ scope: 'global' })

  return NextResponse.json({ ok: true })
}
