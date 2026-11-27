import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { perfilStaff } from '@/lib/staff'

export const dynamic = 'force-dynamic'

const CATEGORIAS = ['rutinas', 'ejercicio', 'equipo', 'app', 'otro']
const ESTADOS = ['nueva', 'en_revision', 'aplicada', 'descartada']
const TABLA = 'app_sugerencias_entrenadores'

function error(mensaje, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status })
}

async function autorizar() {
  const supabase = await createClient()
  const staff = await perfilStaff(supabase)
  return staff.ok ? staff : null
}

function tablaFaltante(e) {
  return e?.code === '42P01' || /does not exist|schema cache/i.test(String(e?.message || ''))
}

export async function GET() {
  const staff = await autorizar()
  if (!staff) return error('No autorizado.', 403)

  const admin = createAdminClient()
  let consulta = admin.from(TABLA).select('*').order('created_at', { ascending: false }).limit(100)
  if (!staff.esDueno) consulta = consulta.eq('autor_auth_user_id', staff.userId)

  const { data, error: e } = await consulta
  if (e) {
    if (tablaFaltante(e)) return NextResponse.json({ ok: true, sugerencias: [], falta_tabla: true, puede_gestionar: staff.esDueno })
    console.error('SUGERENCIAS GET:', e)
    return error('No se pudieron cargar las sugerencias.', 500)
  }
  return NextResponse.json({ ok: true, sugerencias: data || [], puede_gestionar: staff.esDueno })
}

export async function POST(request) {
  const staff = await autorizar()
  if (!staff) return error('No autorizado.', 403)

  const body = await request.json().catch(() => null)
  const categoria = CATEGORIAS.includes(body?.categoria) ? body.categoria : 'otro'
  const titulo = String(body?.titulo || '').trim().slice(0, 120)
  const detalle = String(body?.detalle || '').trim().slice(0, 3000)
  if (titulo.length < 4) return error('Escribe un título corto para tu sugerencia.')
  if (detalle.length < 10) return error('Cuéntanos un poco más en el detalle.')

  const admin = createAdminClient()
  const { data, error: e } = await admin.from(TABLA).insert({
    autor_auth_user_id: staff.userId,
    autor_nombre: staff.nombre,
    categoria,
    titulo,
    detalle,
    ejercicio_codigo: String(body?.ejercicio_codigo || '').slice(0, 80) || null,
    contexto: body?.contexto && typeof body.contexto === 'object' ? body.contexto : null,
  }).select('*').single()

  if (e) {
    if (tablaFaltante(e)) return error('Falta crear la tabla de sugerencias en Supabase (archivo 20261127_modo_entrenador.sql).', 503)
    console.error('SUGERENCIAS POST:', e)
    return error('No se pudo enviar la sugerencia.', 500)
  }
  return NextResponse.json({ ok: true, sugerencia: data })
}

// Solo el dueño: cambiar estado y responder
export async function PATCH(request) {
  const staff = await autorizar()
  if (!staff?.esDueno) return error('No autorizado.', 403)

  const body = await request.json().catch(() => null)
  const id = String(body?.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return error('Sugerencia no válida.')

  const cambios = { updated_at: new Date().toISOString() }
  if (body?.estado !== undefined) {
    if (!ESTADOS.includes(body.estado)) return error('Estado no válido.')
    cambios.estado = body.estado
  }
  if (body?.respuesta !== undefined) cambios.respuesta = String(body.respuesta || '').trim().slice(0, 2000) || null

  const admin = createAdminClient()
  const { data, error: e } = await admin.from(TABLA).update(cambios).eq('id', id).select('*').single()
  if (e) {
    console.error('SUGERENCIAS PATCH:', e)
    return error('No se pudo actualizar la sugerencia.', 500)
  }
  return NextResponse.json({ ok: true, sugerencia: data })
}
