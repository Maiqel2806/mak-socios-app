import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { unoRM } from '@/lib/progresion'

// Historial completo del socio para la pantalla Progreso:
// récords personales, volumen semanal, racha y últimas sesiones.
// Solo lectura; el miembro siempre viene de la sesión autenticada.

async function enLotes(ids, tam, consulta) {
  const resultado = []
  for (let i = 0; i < ids.length; i += tam) {
    const { data, error } = await consulta(ids.slice(i, i + tam))
    if (error) throw error
    resultado.push(...(data || []))
  }
  return resultado
}

function inicioSemana(fecha) {
  const d = new Date(fecha)
  // Semana de lunes a domingo, hora de Ecuador (UTC-5)
  const local = new Date(d.getTime() - 5 * 3600 * 1000)
  const dia = (local.getUTCDay() + 6) % 7
  local.setUTCDate(local.getUTCDate() - dia)
  local.setUTCHours(0, 0, 0, 0)
  return local.toISOString().slice(0, 10)
}

export async function cargarHistorialSocio(miembroId) {
  const admin = createAdminClient()

  const { data: sesiones, error } = await admin
    .from('socio_entrenamientos')
    .select('id, nombre_dia, fecha_inicio, fecha_fin, duracion_seg, estado')
    .eq('miembro_id', miembroId)
    .not('fecha_fin', 'is', null)
    .order('fecha_inicio', { ascending: false })
    .limit(60)

  if (error) throw error

  const validas = (sesiones || []).filter((s) => !/cancel/i.test(String(s.estado || '')))
  if (!validas.length) {
    return { records: [], sesiones: [], semanas: [], racha: 0, total_sesiones: 0 }
  }

  const ejercicios = await enLotes(validas.map((s) => s.id), 50, (lote) =>
    admin
      .from('socio_entrenamiento_ejercicios')
      .select('id, entrenamiento_id, nombre_realizado')
      .in('entrenamiento_id', lote)
  )

  const series = await enLotes(ejercicios.map((e) => e.id), 100, (lote) =>
    admin
      .from('socio_entrenamiento_series')
      .select('entrenamiento_ejercicio_id, peso_kg, repeticiones, completada')
      .in('entrenamiento_ejercicio_id', lote)
      .eq('completada', true)
  )

  const ejercicioPorId = new Map(ejercicios.map((e) => [e.id, e]))
  const sesionPorId = new Map(validas.map((s) => [s.id, s]))

  const records = new Map()
  const resumenSesion = new Map()

  for (const s of series) {
    const ej = ejercicioPorId.get(s.entrenamiento_ejercicio_id)
    if (!ej) continue
    const sesion = sesionPorId.get(ej.entrenamiento_id)
    const peso = Number(s.peso_kg) || 0
    const reps = Number(s.repeticiones) || 0

    const r = resumenSesion.get(ej.entrenamiento_id) || { series: 0, volumen: 0 }
    r.series += 1
    r.volumen += peso * reps
    resumenSesion.set(ej.entrenamiento_id, r)

    if (peso > 0 && reps > 0) {
      const e1rm = unoRM(peso, reps)
      const k = ej.nombre_realizado
      const actual = records.get(k)
      if (!actual || e1rm > actual.e1rm) {
        records.set(k, { nombre: k, peso, reps, e1rm, fecha: sesion?.fecha_inicio })
      }
    }
  }

  // Volumen de las últimas 8 semanas
  const hoy = new Date()
  const semanas = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(hoy.getTime() - i * 7 * 86400000)
    semanas.push({ semana: inicioSemana(d), volumen: 0, sesiones: 0 })
  }
  const indiceSemana = new Map(semanas.map((s, i) => [s.semana, i]))

  for (const s of validas) {
    const i = indiceSemana.get(inicioSemana(s.fecha_inicio))
    if (i === undefined) continue
    semanas[i].sesiones += 1
    semanas[i].volumen += resumenSesion.get(s.id)?.volumen || 0
  }

  // Racha: semanas consecutivas (hasta la actual) con al menos una sesión
  let racha = 0
  for (let i = semanas.length - 1; i >= 0; i--) {
    if (semanas[i].sesiones > 0) racha++
    else if (i === semanas.length - 1) continue // la semana actual aún puede completarse
    else break
  }

  return {
    total_sesiones: validas.length,
    racha,
    semanas: semanas.map((s) => ({ ...s, volumen: Math.round(s.volumen) })),
    records: [...records.values()].sort((a, b) => b.e1rm - a.e1rm).slice(0, 8),
    sesiones: validas.slice(0, 6).map((s) => ({
      id: s.id,
      nombre_dia: s.nombre_dia,
      fecha_inicio: s.fecha_inicio,
      duracion_seg: s.duracion_seg,
      series: resumenSesion.get(s.id)?.series || 0,
      volumen: Math.round(resumenSesion.get(s.id)?.volumen || 0),
    })),
  }
}
