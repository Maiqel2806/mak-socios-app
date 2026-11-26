import { randomInt } from 'node:crypto'
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { esAdministrador } from '@/lib/rutinas/servidor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function error(mensaje, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status })
}

async function autorizar() {
  const supabase = await createClient()
  const permiso = await esAdministrador(supabase)
  return permiso.ok ? permiso : null
}

// Igual que el sistema administrativo: sin puntos, espacios ni guiones
function normalizarCedula(valor) {
  return String(valor || '').trim().replace(/[\s.-]/g, '').toUpperCase()
}

// Clave temporal fácil de dictar (sin 0/O ni 1/I/L)
function claveTemporal() {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let clave = 'MAK-'
  for (let i = 0; i < 6; i++) clave += letras[randomInt(letras.length)]
  return clave
}

/** Revisa todo lo que puede impedir que un socio entre a la app. */
function diagnosticar({ miembro, cuenta, authUser, errorAuth }) {
  const problemas = []
  const avisos = []

  if (!String(miembro.codigo_acceso || '').trim()) {
    problemas.push('No tiene código de acceso en el sistema administrativo.')
  }
  if (!cuenta) {
    problemas.push('No tiene acceso a la app creado. Créalo desde el sistema administrativo.')
    return { problemas, avisos }
  }
  if (!cuenta.activo) problemas.push('El acceso a la app está desactivado.')
  if (!cuenta.auth_email) problemas.push('La cuenta no tiene correo técnico vinculado.')

  if (errorAuth || !authUser) {
    problemas.push('No existe la identidad de inicio de sesión vinculada a la cuenta.')
    return { problemas, avisos }
  }

  if (authUser.app_metadata?.mak_tipo_usuario !== 'socio' ||
      String(authUser.app_metadata?.miembro_id) !== String(miembro.id)) {
    problemas.push('La identidad de inicio de sesión no está marcada como de este socio.')
  }
  if (cuenta.auth_email && authUser.email &&
      authUser.email.toLowerCase() !== cuenta.auth_email.toLowerCase()) {
    problemas.push('El correo técnico de la cuenta no coincide con el de inicio de sesión.')
  }
  if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
    problemas.push('El inicio de sesión está bloqueado.')
  }
  if (!authUser.email_confirmed_at) {
    problemas.push('El correo técnico no está confirmado.')
  }

  if (normalizarCedula(miembro.cedula).length < 6) {
    avisos.push('La cédula registrada no es válida: al restablecer se generará una clave temporal.')
  }
  if (cuenta.clave_cambiada) {
    avisos.push('El socio cambió su contraseña: la cédula ya no le sirve para entrar.')
  }
  if (cuenta.cambio_clave_obligatorio) {
    avisos.push('Tiene una clave temporal: deberá crear una contraseña personal al entrar.')
  }

  return { problemas, avisos }
}

async function leerSocio(admin, miembro) {
  const { data: cuenta } = await admin
    .from('socio_cuentas_app')
    .select('miembro_id, auth_user_id, auth_email, tipo_clave_inicial, cambio_clave_obligatorio, clave_cambiada, activo, ultimo_acceso_at, ultimo_cambio_clave_at')
    .eq('miembro_id', miembro.id)
    .maybeSingle()

  let authUser = null
  let errorAuth = null
  if (cuenta?.auth_user_id) {
    const r = await admin.auth.admin.getUserById(cuenta.auth_user_id)
    authUser = r.data?.user || null
    errorAuth = r.error || null
  }

  const { problemas, avisos } = diagnosticar({ miembro, cuenta, authUser, errorAuth })
  const cedula = normalizarCedula(miembro.cedula)

  return {
    id: miembro.id,
    nombre: [miembro.nombre, miembro.apellido].filter(Boolean).join(' '),
    codigo_acceso: miembro.codigo_acceso,
    cedula_final: cedula ? `•••${cedula.slice(-4)}` : null,
    estado_socio: miembro.estado || null,
    tiene_cuenta: Boolean(cuenta),
    cuenta_activa: Boolean(cuenta?.activo),
    clave_cambiada: Boolean(cuenta?.clave_cambiada),
    tipo_clave: cuenta?.clave_cambiada
      ? 'personal'
      : cuenta?.tipo_clave_inicial || null,
    ultimo_acceso: cuenta?.ultimo_acceso_at || authUser?.last_sign_in_at || null,
    clave_actualizada: cuenta?.ultimo_cambio_clave_at || null,
    problemas,
    avisos,
  }
}

// Buscar por código, cédula o nombre
export async function GET(request) {
  if (!(await autorizar())) return error('No autorizado.', 403)

  const q = String(new URL(request.url).searchParams.get('q') || '').trim()
  if (q.length < 2) return error('Escribe al menos 2 caracteres.')
  if (q.length > 60) return error('Búsqueda demasiado larga.')

  const admin = createAdminClient()
  const campos = 'id, nombre, apellido, cedula, codigo_acceso, estado'
  const limpio = q.replace(/[%,()*]/g, ' ').trim()
  const soloDigitos = normalizarCedula(q)

  const consultas = [
    admin.from('miembros').select(campos).eq('codigo_acceso', q.toUpperCase()).limit(5),
    admin.from('miembros').select(campos).or(`nombre.ilike.%${limpio}%,apellido.ilike.%${limpio}%`).limit(8),
  ]
  if (soloDigitos.length >= 4) {
    consultas.push(admin.from('miembros').select(campos).ilike('cedula', `%${soloDigitos}%`).limit(5))
  }

  const resultados = await Promise.all(consultas)
  const vistos = new Map()
  for (const r of resultados) {
    for (const m of r.data || []) if (!vistos.has(m.id)) vistos.set(m.id, m)
  }

  const miembros = [...vistos.values()].slice(0, 8)
  const socios = await Promise.all(miembros.map((m) => leerSocio(admin, m)))

  return NextResponse.json({ ok: true, socios })
}

// Restablecer contraseña y reparar el acceso
export async function POST(request) {
  const permiso = await autorizar()
  if (!permiso) return error('No autorizado.', 403)

  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return error('Solicitud no autorizada.', 403)
  }

  const body = await request.json().catch(() => null)
  const miembroId = String(body?.miembro_id || '')
  const accion = String(body?.accion || '')
  if (!/^[0-9a-f-]{36}$/i.test(miembroId)) return error('Socio no válido.')
  if (!['restablecer', 'activar'].includes(accion)) return error('Acción no válida.')

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, nombre, apellido, cedula, codigo_acceso, estado')
    .eq('id', miembroId)
    .maybeSingle()
  if (!miembro) return error('Socio no encontrado.', 404)

  const { data: cuenta } = await admin
    .from('socio_cuentas_app')
    .select('miembro_id, auth_user_id, auth_email, activo')
    .eq('miembro_id', miembro.id)
    .maybeSingle()

  if (!cuenta?.auth_user_id) {
    return error('Este socio no tiene acceso a la app. Créalo desde el sistema administrativo.', 409)
  }

  if (accion === 'activar') {
    const { error: e } = await admin
      .from('socio_cuentas_app')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('miembro_id', miembro.id)
    if (e) return error('No se pudo activar el acceso.', 500)
    console.info('MAK ACCESOS: acceso activado', { miembro: miembro.codigo_acceso, por: permiso.miembroId })
    return NextResponse.json({ ok: true, socio: await leerSocio(admin, miembro) })
  }

  const { data: authData, error: errorAuth } =
    await admin.auth.admin.getUserById(cuenta.auth_user_id)
  const authUser = authData?.user
  if (errorAuth || !authUser) {
    return error('No existe la identidad de inicio de sesión de este socio. Vuelve a crear su acceso desde el sistema administrativo.', 409)
  }

  const cedula = normalizarCedula(miembro.cedula)
  const usaCedula = cedula.length >= 6
  const nuevaClave = usaCedula ? cedula : claveTemporal()

  // Contraseña nueva + reparación de la identidad (marca de socio,
  // correo confirmado y desbloqueo)
  const { error: errorClave } = await admin.auth.admin.updateUserById(authUser.id, {
    password: nuevaClave,
    email_confirm: true,
    ban_duration: 'none',
    app_metadata: {
      ...(authUser.app_metadata || {}),
      mak_tipo_usuario: 'socio',
      miembro_id: miembro.id,
    },
  })
  if (errorClave) {
    console.error('MAK ACCESOS RESTABLECER:', errorClave)
    return error('No se pudo restablecer la contraseña.', 500)
  }

  const { error: errorCuenta } = await admin
    .from('socio_cuentas_app')
    .update({
      auth_email: cuenta.auth_email || authUser.email,
      tipo_clave_inicial: usaCedula ? 'cedula' : 'aleatoria',
      clave_cambiada: false,
      cambio_clave_obligatorio: !usaCedula,
      aviso_cambio_clave_visto: false,
      updated_at: new Date().toISOString(),
    })
    .eq('miembro_id', miembro.id)
  if (errorCuenta) console.error('MAK ACCESOS ESTADO CUENTA:', errorCuenta)

  console.info('MAK ACCESOS: contraseña restablecida', {
    miembro: miembro.codigo_acceso,
    por: permiso.miembroId,
    tipo: usaCedula ? 'cedula' : 'temporal',
  })

  return NextResponse.json({
    ok: true,
    usa_cedula: usaCedula,
    clave_temporal: usaCedula ? null : nuevaClave,
    socio: await leerSocio(admin, miembro),
  })
}
