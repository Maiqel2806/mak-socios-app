// Progresión de cargas (doble progresión), 1RM estimado y récords.
// Se usa en cliente (registro de series) y servidor (historial).

/** 1RM estimado (fórmula de Epley). Válido hasta ~12 repeticiones. */
export function unoRM(peso, reps) {
  const p = Number(peso)
  const r = Number(reps)
  if (!(p > 0) || !(r > 0)) return 0
  if (r === 1) return p
  return Math.round(p * (1 + Math.min(r, 15) / 30) * 10) / 10
}

/** Rango "8-12" -> { min: 8, max: 12 }. "15" -> { min: 15, max: 15 } */
export function rangoReps(texto) {
  const n = String(texto || '').match(/\d+/g)?.map(Number) || []
  if (!n.length) return null
  return { min: Math.min(...n), max: Math.max(...n) }
}

function redondearA(valor, paso) {
  if (!(paso > 0)) return Math.round(valor * 100) / 100
  return Math.round(Math.round(valor / paso) * paso * 100) / 100
}

/**
 * Sugerencia para hoy a partir de la última sesión del ejercicio.
 * Doble progresión:
 *  - Si todas las series llegaron al tope del rango → subir un incremento.
 *  - Si alguna quedó por debajo del mínimo → mantener (o bajar si fue muy por debajo).
 *  - Si no → mismo peso, intentar +1 repetición.
 */
export function sugerirCarga({ ultimaSesion, repeticionesObjetivo, incremento = 2.5 }) {
  const series = (ultimaSesion?.series || []).filter(
    (s) => s.completada && Number(s.peso_kg) >= 0 && Number(s.repeticiones) > 0
  )
  if (!series.length) return null

  const rango = rangoReps(repeticionesObjetivo)
  const pesoTrabajo = Math.max(...series.map((s) => Number(s.peso_kg)))
  const deTrabajo = series.filter((s) => Number(s.peso_kg) === pesoTrabajo)
  const repsMin = Math.min(...deTrabajo.map((s) => Number(s.repeticiones)))

  if (pesoTrabajo === 0) {
    return {
      peso: 0,
      motivo: rango && repsMin >= rango.max
        ? 'Sin carga externa: intenta añadir repeticiones o una variante más difícil.'
        : 'Peso corporal: intenta sumar 1 repetición por serie.',
      tipo: 'mantener',
    }
  }

  if (!rango) {
    return { peso: pesoTrabajo, motivo: 'Repite el peso de la última vez.', tipo: 'mantener' }
  }

  if (repsMin >= rango.max) {
    return {
      peso: redondearA(pesoTrabajo + incremento),
      motivo: `La última vez completaste ${rango.max}+ repeticiones en todas las series: sube el peso.`,
      tipo: 'subir',
    }
  }

  if (repsMin < rango.min - 2) {
    return {
      peso: redondearA(Math.max(0, pesoTrabajo - incremento)),
      motivo: 'La última vez quedaste lejos del rango: baja un poco para hacerlo con buena técnica.',
      tipo: 'bajar',
    }
  }

  return {
    peso: pesoTrabajo,
    motivo: `Mismo peso que la última vez: intenta llegar a ${Math.min(repsMin + 1, rango.max)} repeticiones.`,
    tipo: 'mantener',
  }
}

/** Texto compacto "40 kg × 10 · 10 · 9" */
export function resumenSeries(series = []) {
  const validas = series.filter((s) => s.completada && Number(s.repeticiones) > 0)
  if (!validas.length) return ''
  const mismoPeso = validas.every((s) => Number(s.peso_kg) === Number(validas[0].peso_kg))
  const kg = (v) => String(Number(v)).replace('.', ',')
  if (mismoPeso) {
    return `${kg(validas[0].peso_kg)} kg × ${validas.map((s) => s.repeticiones).join(' · ')}`
  }
  return validas.map((s) => `${kg(s.peso_kg)}×${s.repeticiones}`).join(' · ')
}
