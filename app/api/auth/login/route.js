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


// Normaliza una cédula para comparar (sin espacios, guiones ni puntos)
function normalizarCedula(valor) {
  return String(valor || '')
    .trim()
    .replace(/[\s.-]/g, '')
    .toUpperCase()
}


/**
 * Sincroniza la contraseña inicial con la cédula actual del socio.
 *
 * La cuenta de la app se crea con la cédula como contraseña inicial
 * (o una clave aleatoria si la cédula no era válida). Si después se
 * corrige la cédula en el sistema administrativo, la contraseña de
 * Supabase Auth seguía siendo la anterior y el socio no podía entrar.
 *
 * Solo se aplica si el socio NUNCA cambió su contraseña y si lo que
 * escribió coincide con la cédula registrada hoy en el sistema.
 */
async function sincronizarClaveInicial({
  admin,
  cuenta,
  miembro,
  password,
}) {
  if (cuenta.clave_cambiada === true) return null

  // Mismo formato que usa el sistema administrativo al crear el acceso:
  // solo dígitos/letras, sin puntos, espacios ni guiones
  const cedulaActual =
    normalizarCedula(miembro?.cedula)

  if (
    cedulaActual.length < 6 ||
    normalizarCedula(password) !== cedulaActual
  ) {
    return null
  }

  const { error: errorClave } =
    await admin.auth.admin.updateUserById(
      cuenta.auth_user_id,
      { password: cedulaActual }
    )

  if (errorClave) {
    console.error(
      'SINCRONIZAR CLAVE INICIAL:',
      errorClave
    )
    return null
  }

  await admin
    .from('socio_cuentas_app')
    .update({
      tipo_clave_inicial: 'cedula',
      cambio_clave_obligatorio: false,
      updated_at: new Date().toISOString(),
    })
    .eq('miembro_id', miembro.id)

  return cedulaActual
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
      .select('id, cedula')
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

    let {
      data: login,
      error: errorLogin,
    } =
      await supabase.auth
        .signInWithPassword({
          email:
            cuenta.auth_email,

          password,
        })

    // Cédula corregida en el sistema administrativo: la contraseña
    // inicial se actualiza a la cédula vigente y se reintenta.
    if (errorLogin || !login?.user) {
      const claveSincronizada =
        await sincronizarClaveInicial({
          admin,
          cuenta,
          miembro,
          password,
        })

      if (claveSincronizada) {
        const reintento =
          await supabase.auth
            .signInWithPassword({
              email: cuenta.auth_email,
              password: claveSincronizada,
            })

        login = reintento.data
        errorLogin = reintento.error
        cuenta.cambio_clave_obligatorio = false
      }
    }

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
