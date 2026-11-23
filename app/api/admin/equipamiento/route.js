import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EQUIPAMIENTO_POR_DEFECTO, ZONAS } from '@/lib/rutinas/equipamiento'
import { PATRONES, GRUPOS } from '@/lib/rutinas/ejercicios'
import { generarRutina } from '@/lib/rutinas/motor'
import { esAdministrador } from '@/lib/rutinas/servidor'

function error(mensaje, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status })
}

function slug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48)
}

async function autorizar() {
  const supabase = await createClient()
  const permiso = await esAdministrador(supabase)
  return permiso.ok ? permiso : null
}

async function leerTodo(admin) {
  const [equipos, ejercicios] = await Promise.all([
    admin.from('gimnasio_equipamiento').select('*').order('zona').order('nombre'),
    admin.from('gimnasio_ejercicios_personalizados').select('*').order('created_at', { ascending: false }),
  ])

  const tablaLista = !equipos.error
  return {
    tablaLista,
    equipamiento: tablaLista && equipos.data?.length ? equipos.data : EQUIPAMIENTO_POR_DEFECTO,
    personalizados: ejercicios.error ? [] : ejercicios.data || [],
  }
}

export async function GET() {
  if (!(await autorizar())) return error('No autorizado.', 403)

  const admin = createAdminClient()
  const datos = await leerTodo(admin)

  return NextResponse.json({
    ok: true,
    ...datos,
    zonas: ZONAS,
    patrones: PATRONES,
    grupos: GRUPOS,
  })
}

export async function POST(request) {
  const permiso = await autorizar()
  if (!permiso) return error('No autorizado.', 403)

  let body
  try {
    body = await request.json()
  } catch {
    return error('Datos no válidos.')
  }

  const admin = createAdminClient()

  // ---------------------------------------------- Equipamiento
  if (body?.accion === 'guardar_equipo') {
    const e = body.equipo || {}
    const nombre = String(e.nombre || '').trim().slice(0, 80)
    if (!nombre) return error('Escribe el nombre del equipo.')

    const codigo = slug(e.codigo || nombre)
    if (!codigo) return error('Código no válido.')
    if (codigo === 'peso_corporal' && e.activo === false) {
      return error('El peso corporal siempre está disponible.')
    }

    const incremento =
      e.incremento_kg === '' || e.incremento_kg === null || e.incremento_kg === undefined
        ? null
        : Number(String(e.incremento_kg).replace(',', '.'))

    if (incremento !== null && (!Number.isFinite(incremento) || incremento <= 0 || incremento > 50)) {
      return error('El incremento debe estar entre 0,1 y 50 kg.')
    }

    const fila = {
      codigo,
      nombre,
      zona: ZONAS[e.zona] ? e.zona : 'maquinas',
      activo: e.activo !== false,
      incremento_kg: incremento,
      nuevo: Boolean(e.nuevo),
      notas: e.notas ? String(e.notas).slice(0, 300) : null,
      actualizado_por: permiso.nombre || null,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = await admin.from('gimnasio_equipamiento').upsert(fila, { onConflict: 'codigo' })
    if (err) {
      console.error('ADMIN EQUIPO:', err)
      return error('No se pudo guardar. ¿Aplicaste la migración SQL del motor v4?', 500)
    }

    return NextResponse.json({ ok: true, ...(await leerTodo(admin)) })
  }

  // ---------------------------------------------- Ejercicio personalizado
  if (body?.accion === 'guardar_ejercicio') {
    const x = body.ejercicio || {}
    const nombre = String(x.nombre || '').trim().slice(0, 90)
    if (!nombre) return error('Escribe el nombre del ejercicio.')
    if (!PATRONES[x.patron]) return error('Selecciona el patrón de movimiento.')
    if (!GRUPOS[x.grupo]) return error('Selecciona el grupo muscular.')

    const equipo = (Array.isArray(x.equipo) ? x.equipo : [x.equipo])
      .map((c) => slug(c))
      .filter(Boolean)
    if (!equipo.length) return error('Selecciona el equipo que usa el ejercicio.')

    const nivelMin = Math.min(3, Math.max(1, Number(x.nivel_min) || 1))
    const nivelMax = Math.min(3, Math.max(nivelMin, Number(x.nivel_max) || 3))

    const fila = {
      codigo: `gym_${slug(x.codigo || nombre)}`,
      nombre,
      grupo: x.grupo,
      patron: x.patron,
      equipo,
      nivel_min: nivelMin,
      nivel_max: nivelMax,
      tipo: ['fuerza', 'calistenia', 'funcional', 'cardio', 'core'].includes(x.tipo) ? x.tipo : 'fuerza',
      tecnica: x.tecnica ? String(x.tecnica).slice(0, 500) : null,
      imagen_url: x.imagen_url && /^https?:\/\//.test(x.imagen_url) ? String(x.imagen_url).slice(0, 500) : null,
      video_url: x.video_url && /^https?:\/\//.test(x.video_url) ? String(x.video_url).slice(0, 500) : null,
      guiado: Boolean(x.guiado),
      compuesto: Boolean(x.compuesto),
      seg: Boolean(x.seg),
      unilateral: Boolean(x.unilateral),
      activo: x.activo !== false,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = await admin
      .from('gimnasio_ejercicios_personalizados')
      .upsert(fila, { onConflict: 'codigo' })

    if (err) {
      console.error('ADMIN EJERCICIO:', err)
      return error('No se pudo guardar el ejercicio.', 500)
    }

    return NextResponse.json({ ok: true, ...(await leerTodo(admin)) })
  }

  // ---------------------------------------------- Vista previa de rutina
  if (body?.accion === 'vista_previa') {
    const { equipamiento, personalizados } = await leerTodo(admin)
    const rutina = generarRutina(
      {
        objetivo: body?.perfil?.objetivo,
        nivel: body?.perfil?.nivel,
        dias_entrenamiento: body?.perfil?.dias_entrenamiento,
        tiempo_sesion_min: body?.perfil?.tiempo_sesion_min,
      },
      { equipamiento, personalizados }
    )
    return NextResponse.json({ ok: true, rutina })
  }

  return error('Acción no válida.')
}
