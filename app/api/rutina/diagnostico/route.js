import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { motorV4Activo, esAdministrador } from '@/lib/rutinas/servidor'
import {
  prepararRutinaV4,
  guardarRutinaV4,
  detalleError,
} from '@/lib/rutinas/generacion'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico del generador de rutinas (no cambia la rutina del socio).
 * Abrir /api/rutina/diagnostico con la sesión del socio iniciada.
 * Hace una prueba de guardado (inserta y borra una fila inactiva).
 */
export async function GET() {
  const pasos = []
  const anotar = (paso, ok, info = null) => pasos.push({ paso, ok, info })

  try {
    anotar('motor_v4_activo', motorV4Activo())
    anotar(
      'clave_privada_supabase',
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    )

    const supabase = await createClient()
    const { data: claims } = await supabase.auth.getClaims()
    const userId = claims?.claims?.sub
    anotar('sesion', Boolean(userId), userId ? null : 'Inicia sesión en la app y vuelve a abrir esta página.')
    if (!userId) return NextResponse.json({ ok: false, pasos })

    // En producción, solo administradores (MAK_ADMIN_CODIGOS)
    if (process.env.VERCEL_ENV === 'production') {
      const permiso = await esAdministrador(supabase).catch(() => ({ ok: false }))
      if (!permiso?.ok) {
        return NextResponse.json(
          { ok: false, error: 'Disponible solo para administradores.' },
          { status: 403 }
        )
      }
    }

    const preparada = await prepararRutinaV4(supabase, userId)
    if (!preparada.ok) {
      anotar(`preparar:${preparada.paso}`, false, preparada.detalle || preparada.error)
      return NextResponse.json({ ok: false, pasos })
    }

    const { rutina, perfil, admin, miembroId } = preparada
    anotar('perfil', true, {
      objetivo: perfil.objetivo,
      nivel: perfil.nivel,
      peso_kg: perfil.peso_kg,
      estatura_cm: perfil.estatura_cm,
      edad: perfil.edad || null,
      dias: perfil.dias_entrenamiento,
      minutos: perfil.tiempo_sesion_min,
    })
    anotar('rutina_generada', true, {
      nombre: rutina.nombre,
      imc: rutina.perfil_corporal?.imc,
      categoria: rutina.perfil_corporal?.categoria,
      dias: rutina.dias.map(
        (d) => `Día ${d.dia} · ${d.titulo}: ${d.ejercicios.length} ejercicios`
      ),
      contiene_dominadas: rutina.dias.some((d) =>
        d.ejercicios.some((e) => /dominad/i.test(e.nombre))
      ),
    })

    // ¿Están los ejercicios v4 registrados en app_ejercicios?
    const ids = [
      ...new Set(
        rutina.dias.flatMap((d) => d.ejercicios.map((e) => e.ejercicio_id))
      ),
    ].filter(Boolean)
    const { data: existentes, error: errorEj } = await admin
      .from('app_ejercicios')
      .select('id')
      .in('id', ids)
    const faltan = ids.length - (existentes?.length || 0)
    anotar(
      'ejercicios_en_base_de_datos',
      !errorEj && faltan === 0,
      errorEj
        ? detalleError(errorEj)
        : faltan
          ? `Faltan ${faltan} de ${ids.length}. Ejecuta 20261123_motor_v4_ejercicios.sql en Supabase.`
          : `${ids.length} de ${ids.length} registrados`
    )

    // Rutina activa actual
    const { data: activa } = await admin
      .from('socio_rutinas_generadas')
      .select('id, motor_version, origen, fecha_registro')
      .eq('miembro_id', miembroId)
      .eq('activa', true)
    anotar('rutinas_activas_actuales', true, activa || [])

    // Prueba de guardado (inserta inactiva y la borra)
    const prueba = await guardarRutinaV4(
      admin,
      { miembroId, perfil, rutina },
      { soloPrueba: true }
    )
    anotar(
      'prueba_de_guardado',
      prueba.ok,
      { intento_que_funciono: prueba.intento || null, errores: prueba.errores }
    )

    return NextResponse.json({
      ok: pasos.every((p) => p.ok),
      pasos,
    })
  } catch (e) {
    anotar('excepcion', false, String(e?.message || e))
    return NextResponse.json({ ok: false, pasos }, { status: 500 })
  }
}
