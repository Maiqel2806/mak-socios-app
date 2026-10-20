import {
  NextResponse,
} from 'next/server'

import {
  createAdminClient,
} from '@/lib/supabase/admin'

import {
  createClient,
} from '@/lib/supabase/server'


function respuestaError(
  mensaje,
  status
) {
  return NextResponse.json(
    {
      ok: false,
      error: mensaje,
    },
    {
      status,
    }
  )
}


export async function POST(
  request
) {
  try {
    const body =
      await request.json()

    const codigo =
      String(
        body?.codigo || ''
      )
        .trim()
        .toUpperCase()

    const password =
      String(
        body?.password || ''
      )

    if (
      !codigo ||
      !password
    ) {
      return respuestaError(
        'Ingresa tu código único y contraseña.',
        400
      )
    }

    if (
      codigo.length > 50 ||
      !/^[A-Z0-9_-]+$/.test(
        codigo
      )
    ) {
      return respuestaError(
        'Código o contraseña incorrectos.',
        401
      )
    }

    const admin =
      createAdminClient()

    // El correo técnico nunca sale
    // de esta ruta de servidor.
    const {
      data: miembro,
      error: errorMiembro,
    } = await admin
      .from('miembros')
      .select('id')
      .eq(
        'codigo_acceso',
        codigo
      )
      .maybeSingle()

    if (
      errorMiembro ||
      !miembro
    ) {
      return respuestaError(
        'Código o contraseña incorrectos.',
        401
      )
    }

    const {
      data: cuenta,
      error: errorCuenta,
    } = await admin
      .from(
        'socio_cuentas_app'
      )
      .select(`
        miembro_id,
        auth_user_id,
        auth_email,
        tipo_clave_inicial,
        cambio_clave_obligatorio,
        clave_cambiada,
        activo
      `)
      .eq(
        'miembro_id',
        miembro.id
      )
      .maybeSingle()

    if (
      errorCuenta ||
      !cuenta ||
      !cuenta.activo ||
      !cuenta.auth_email
    ) {
      return respuestaError(
        'Código o contraseña incorrectos.',
        401
      )
    }

    const supabase =
      await createClient()

    const {
      data: login,
      error: errorLogin,
    } =
      await supabase.auth
        .signInWithPassword({
          email:
            cuenta.auth_email,

          password,
        })

    if (
      errorLogin ||
      !login?.user
    ) {
      return respuestaError(
        'Código o contraseña incorrectos.',
        401
      )
    }

    const usuario =
      login.user

    const identidadValida =
      usuario.id ===
        cuenta.auth_user_id &&
      usuario.app_metadata
        ?.mak_tipo_usuario ===
        'socio' &&
      usuario.app_metadata
        ?.miembro_id ===
        miembro.id

    if (!identidadValida) {
      await supabase.auth.signOut()

      return respuestaError(
        'La cuenta no corresponde a un socio MAK válido.',
        403
      )
    }

    // No bloqueamos el acceso si solamente
    // falla el registro estadístico de último acceso.
    await admin
      .from(
        'socio_cuentas_app'
      )
      .update({
        ultimo_acceso_at:
          new Date().toISOString(),
      })
      .eq(
        'miembro_id',
        miembro.id
      )

    return NextResponse.json({
      ok: true,

      cambio_clave_obligatorio:
        cuenta
          .cambio_clave_obligatorio,

      clave_cambiada:
        cuenta.clave_cambiada,
    })

  } catch (error) {
    console.error(
      'LOGIN MAK SOCIOS:',
      error
    )

    return respuestaError(
      'No fue posible iniciar sesión. Intenta nuevamente.',
      500
    )
  }
}
