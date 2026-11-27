import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { perfilStaff } from '@/lib/staff'
import { cargarEquipamiento, cargarPersonalizados } from '@/lib/rutinas/servidor'
import { construirBiblioteca, generarRutina } from '@/lib/rutinas/motor'
import { GRUPOS } from '@/lib/rutinas/ejercicios'
import { indexarEquipamiento } from '@/lib/rutinas/equipamiento'
import { imagenesDeEjercicio } from '@/lib/rutinas/medios'
import { escribirPrecauciones, ZONAS } from '@/lib/precauciones'
import { conSecundario } from '@/lib/objetivos'
import { modoRegistro } from '@/lib/registroSeries'

export const dynamic = 'force-dynamic'

function error(mensaje, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status })
}

async function autorizar() {
  const supabase = await createClient()
  const staff = await perfilStaff(supabase)
  return staff.ok ? staff : null
}

// Biblioteca de ejercicios con disponibilidad según el equipo activo
export async function GET() {
  const staff = await autorizar()
  if (!staff) return error('No autorizado.', 403)

  const [equipamiento, personalizados] = await Promise.all([
    cargarEquipamiento(),
    cargarPersonalizados(),
  ])
  const equipos = indexarEquipamiento(equipamiento)
  const biblioteca = construirBiblioteca(personalizados)

  const ejercicios = [...biblioteca.values()].map((ej) => {
    const equipo = (ej.equipo || []).map((c) => ({
      codigo: c,
      nombre: equipos.get?.(c)?.nombre || equipamiento.find((x) => x.codigo === c)?.nombre || c.replace(/_/g, ' '),
      activo: equipos.get?.(c)?.activo ?? equipamiento.find((x) => x.codigo === c)?.activo ?? false,
    }))
    const reps = ej.seg ? '30 seg' : ej.tipo === 'cardio' ? '10 min' : '10-12'
    return {
      codigo: ej.codigo,
      nombre: ej.nombre,
      grupo: ej.grupo,
      grupo_nombre: GRUPOS[ej.grupo] || ej.grupo,
      tipo: ej.tipo,
      nivel_min: ej.nivel_min,
      nivel_max: ej.nivel_max,
      tecnica: ej.tecnica || '',
      equipo,
      disponible: equipo.every((x) => x.activo),
      registro: modoRegistro({ nombre: ej.nombre, grupo_muscular: ej.grupo, repeticiones_objetivo: reps, equipamiento: equipo.map((x) => x.nombre).join(', ') }),
      imagenes: imagenesDeEjercicio(ej),
    }
  }).sort((a, b) => a.grupo_nombre.localeCompare(b.grupo_nombre) || a.nombre.localeCompare(b.nombre))

  return NextResponse.json({
    ok: true,
    // El catálogo de ejercicios es solo para administradores de la app
    ejercicios: staff.esDueno ? ejercicios : [],
    grupos: GRUPOS,
    zonas: Object.fromEntries(Object.entries(ZONAS).map(([k, v]) => [k, v.nombre])),
  })
}

// Simulador: genera una rutina para un socio hipotético (no se guarda)
export async function POST(request) {
  if (!(await autorizar())) return error('No autorizado.', 403)

  const body = await request.json().catch(() => null)
  const p = body?.perfil || {}

  const zonasElegidas = (Array.isArray(p.zonas) ? p.zonas : []).filter((z) => z in ZONAS)
  const precauciones = escribirPrecauciones({
    tiene: zonasElegidas.length ? 'si' : 'no',
    zonas: Object.fromEntries(zonasElegidas.map((z) => [z, 'leve'])),
  })

  const perfil = {
    objetivo: p.objetivo,
    nivel: p.nivel,
    dias_entrenamiento: Number(p.dias_entrenamiento) || 3,
    tiempo_sesion_min: Number(p.tiempo_sesion_min) || 60,
    peso_kg: Number(String(p.peso_kg || '').replace(',', '.')) || null,
    estatura_cm: Number(String(p.estatura_cm || '').replace(',', '.')) || null,
    edad: Number(p.edad) || null,
    limitaciones: precauciones.limitaciones,
    observaciones: conSecundario(precauciones.observaciones, p.objetivo_secundario || '', p.objetivo),
  }

  try {
    const [equipamiento, personalizados] = await Promise.all([
      cargarEquipamiento(),
      cargarPersonalizados(),
    ])
    const rutina = generarRutina(perfil, { equipamiento, personalizados })
    return NextResponse.json({ ok: true, rutina })
  } catch (e) {
    console.error('SIMULADOR ENTRENADOR:', e)
    return error('No se pudo generar la rutina.', 500)
  }
}
