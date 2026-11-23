import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unoRM } from '@/lib/progresion'

// Historial por ejercicio del socio autenticado:
// última sesión, mejor peso y mejor 1RM estimado.
// Solo lectura. El miembro se obtiene de la sesión, nunca del cliente.

function error(mensaje, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status })
}

const clave = (texto) => String(texto || '').trim().toLowerCase()

export async function POST(request) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return error('Sesión no válida.', 401)

  let body
  try {
    body = await request.json()
  } catch {
    return error('Datos no válidos.')
  }

  const nombres = [...new Set((Array.isArray(body?.nombres) ? body.nombres : [])
    .map((n) => String(n || '').trim())
    .filter(Boolean))]
    .slice(0, 30)

  if (!nombres.length) return NextResponse.json({ ok: true, historial: {} })

  const { data: cuenta } = await supabase
    .from('socio_cuentas_app')
    .select('miembro_id, activo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!cuenta?.activo) return error('Sesión no válida.', 401)

  try {
    const admin = createAdminClient()

    const { data: sesiones, error: e1 } = await admin
      .from('socio_entrenamientos')
      .select('id, fecha_inicio, estado')
      .eq('miembro_id', cuenta.miembro_id)
      .not('fecha_fin', 'is', null)
      .order('fecha_inicio', { ascending: false })
      .limit(80)

    if (e1) throw e1

    const validas = (sesiones || []).filter((s) => !/cancel/i.test(String(s.estado || '')))
    if (!validas.length) return NextResponse.json({ ok: true, historial: {} })

    const fechaPorSesion = new Map(validas.map((s) => [s.id, s.fecha_inicio]))

    const { data: ejercicios, error: e2 } = await admin
      .from('socio_entrenamiento_ejercicios')
      .select('id, entrenamiento_id, nombre_realizado')
      .in('entrenamiento_id', validas.map((s) => s.id))
      .in('nombre_realizado', nombres)

    if (e2) throw e2
    if (!ejercicios?.length) return NextResponse.json({ ok: true, historial: {} })

    const { data: series, error: e3 } = await admin
      .from('socio_entrenamiento_series')
      .select('entrenamiento_ejercicio_id, numero_serie, peso_kg, repeticiones, completada')
      .in('entrenamiento_ejercicio_id', ejercicios.map((x) => x.id))
      .eq('completada', true)

    if (e3) throw e3

    const seriesPorEjercicio = new Map()
    for (const s of series || []) {
      const lista = seriesPorEjercicio.get(s.entrenamiento_ejercicio_id) || []
      lista.push(s)
      seriesPorEjercicio.set(s.entrenamiento_ejercicio_id, lista)
    }

    const historial = {}

    for (const ej of ejercicios) {
      const lista = (seriesPorEjercicio.get(ej.id) || []).sort((a, b) => a.numero_serie - b.numero_serie)
      if (!lista.length) continue

      const k = clave(ej.nombre_realizado)
      const fecha = fechaPorSesion.get(ej.entrenamiento_id)
      const actual = historial[k] || { sesiones: 0, mejor_peso: 0, mejor_e1rm: 0, ultima: null }

      actual.sesiones += 1
      for (const s of lista) {
        actual.mejor_peso = Math.max(actual.mejor_peso, Number(s.peso_kg) || 0)
        actual.mejor_e1rm = Math.max(actual.mejor_e1rm, unoRM(s.peso_kg, s.repeticiones))
      }

      if (!actual.ultima || new Date(fecha) > new Date(actual.ultima.fecha)) {
        actual.ultima = {
          fecha,
          series: lista.map((s) => ({
            numero_serie: s.numero_serie,
            peso_kg: Number(s.peso_kg),
            repeticiones: s.repeticiones,
            completada: true,
          })),
        }
      }

      historial[k] = actual
    }

    return NextResponse.json({ ok: true, historial })
  } catch (e) {
    console.error('HISTORIAL EJERCICIOS:', e)
    return error('No se pudo cargar el historial.', 500)
  }
}
