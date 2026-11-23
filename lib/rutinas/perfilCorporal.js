// =============================================================
// Evaluación corporal del socio para que la rutina sea POSIBLE
// de realizar: IMC, edad, nivel y tiempo disponible.
//
// Criterios (guías generales de entrenamiento con sobrepeso, adultos
// mayores y principiantes):
//  - Con IMC alto o siendo principiante con sobrepeso, nada que exija
//    levantar o sostener todo el peso corporal (dominadas, fondos,
//    colgarse, flexiones completas) ni impactos (saltos, trote).
//  - Prioridad a máquinas guiadas y apoyos estables.
//  - Volumen inicial moderado y cardio de bajo impacto.
//  - Adultos mayores: sin explosivos ni cargas máximas sobre la columna.
// =============================================================

// Exigen mover o sostener todo el peso del cuerpo con brazos/tronco
export const CARGA_CORPORAL_TOTAL = new Set([
  'dominadas', 'dominadas_supinas', 'dominadas_lastradas', 'dominada_negativa',
  'fondos_paralelas_pecho', 'fondos_paralelas_triceps', 'fondos_banco',
  'elevacion_piernas_colgado', 'elevacion_rodillas_paralelas',
  'flexiones', 'flexiones_pies_elevados', 'flexiones_diamante', 'flexiones_pliometricas',
  'rueda_abdominal', 'burpees', 'mountain_climbers',
])

// Colgarse de la barra (agarre y hombros soportan todo el peso)
export const COLGARSE = new Set([
  'dominadas', 'dominadas_supinas', 'dominadas_lastradas', 'dominada_negativa',
  'dominada_escapular', 'elevacion_piernas_colgado',
])

// Impacto articular (saltos, carrera)
export const IMPACTO = new Set([
  'saltar_cuerda', 'jumping_jacks', 'intervalos_caminadora', 'burpees',
  'sentadilla_salto', 'salto_cajon', 'flexiones_pliometricas', 'mountain_climbers',
])

// Mucha carga en rodilla/equilibrio a una pierna con peso corporal alto
export const UNA_PIERNA_EXIGENTE = new Set([
  'sentadilla_bulgara', 'zancadas_caminando', 'zancada_atras_barra', 'step_up',
  'puente_gluteo_unilateral', 'curl_femoral_unilateral',
])

// Carga axial pesada o técnica compleja (adultos mayores)
export const CARGA_AXIAL_COMPLEJA = new Set([
  'peso_muerto', 'buenos_dias', 'sentadilla_frontal', 'sentadilla_barra',
  'press_militar', 'zancada_atras_barra', 'remo_barra',
])

function numero(v) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function calcularImc(pesoKg, estaturaCm) {
  const p = numero(pesoKg)
  const e = numero(estaturaCm)
  if (!p || !e) return null
  return Math.round((p / (e / 100) ** 2) * 10) / 10
}

export function categoriaImc(imc) {
  if (imc === null) return null
  if (imc < 18.5) return 'bajo'
  if (imc < 25) return 'normal'
  if (imc < 30) return 'sobrepeso'
  if (imc < 35) return 'obesidad1'
  if (imc < 40) return 'obesidad2'
  return 'obesidad3'
}

const TEXTO_CATEGORIA = {
  bajo: 'bajo peso',
  normal: 'peso saludable',
  sobrepeso: 'sobrepeso',
  obesidad1: 'obesidad grado I',
  obesidad2: 'obesidad grado II',
  obesidad3: 'obesidad grado III',
}

/**
 * @returns {{
 *   imc, categoria, edad,
 *   excluir: Set<string>,        códigos de ejercicios no aptos
 *   preferirMaquinas: boolean,
 *   volumenReducido: boolean,
 *   cardioBajoImpacto: boolean,
 *   objetivoEfectivo: string,
 *   notas: string[]
 * }}
 */
export function evaluarPerfilCorporal(perfil, nivel, objetivo) {
  const imc = calcularImc(perfil?.peso_kg, perfil?.estatura_cm)
  const categoria = categoriaImc(imc)
  const edad = numero(perfil?.edad)
  const excluir = new Set()
  const notas = []
  let preferirMaquinas = false
  let volumenReducido = false
  let cardioBajoImpacto = false
  let objetivoEfectivo = objetivo

  const agregar = (conjunto) => conjunto.forEach((c) => excluir.add(c))

  const obeso = ['obesidad1', 'obesidad2', 'obesidad3'].includes(categoria)
  const severo = ['obesidad2', 'obesidad3'].includes(categoria)

  // Sobrepeso + principiante, u obesidad a cualquier nivel
  if ((categoria === 'sobrepeso' && nivel === 1) || obeso) {
    agregar(CARGA_CORPORAL_TOTAL)
    agregar(COLGARSE)
    agregar(IMPACTO)
    preferirMaquinas = true
    cardioBajoImpacto = true
  } else if (categoria === 'sobrepeso') {
    // Sobrepeso con experiencia: sin impactos ni colgarse con todo el peso
    agregar(IMPACTO)
    excluir.add('dominadas_lastradas')
    excluir.add('elevacion_piernas_colgado')
    cardioBajoImpacto = true
  }

  if (severo) {
    agregar(UNA_PIERNA_EXIGENTE)
    excluir.add('hiperextension_lastrada')
    excluir.add('hiperextension_silla_romana')
    excluir.add('superman')
    excluir.add('dead_bug')
    volumenReducido = true
  }

  if (obeso && nivel === 1) volumenReducido = true

  // Principiante con peso normal: las dominadas completas aún no
  if (nivel === 1) {
    excluir.add('dominadas')
    excluir.add('dominadas_supinas')
    excluir.add('fondos_paralelas_pecho')
    excluir.add('fondos_paralelas_triceps')
  }

  // Edad
  if (edad !== null && edad >= 55) {
    agregar(IMPACTO)
    agregar(CARGA_AXIAL_COMPLEJA)
    preferirMaquinas = true
    cardioBajoImpacto = true
  }
  if (edad !== null && edad >= 65) {
    agregar(COLGARSE)
    agregar(UNA_PIERNA_EXIGENTE)
    volumenReducido = true
  }
  if (edad !== null && edad < 16) {
    agregar(CARGA_AXIAL_COMPLEJA)
    if (objetivo === 'fuerza') objetivoEfectivo = 'tonificacion'
  }

  // Bajo peso queriendo bajar grasa: no tiene sentido fisiológico
  if (categoria === 'bajo' && objetivo === 'bajar_grasa') {
    objetivoEfectivo = 'tonificacion'
    notas.push('Tu IMC indica bajo peso, así que en lugar de un plan para bajar grasa te armamos uno de tonificación para ganar fuerza y masa muscular. Consulta tu alimentación con un profesional.')
  }

  if (imc !== null && categoria !== 'normal' && categoria !== 'bajo') {
    const partes = []
    if (excluir.has('dominadas')) partes.push('sin ejercicios donde levantes todo tu peso (dominadas o fondos)')
    if (excluir.has('saltar_cuerda')) partes.push('sin saltos ni trote')
    if (preferirMaquinas) partes.push('con máquinas guiadas para que trabajes seguro')
    if (cardioBajoImpacto) partes.push('con cardio de bajo impacto (bicicleta o caminata inclinada)')
    notas.push(
      `Tu IMC es ${String(imc).replace('.', ',')} (${TEXTO_CATEGORIA[categoria]}). Armamos la rutina ${partes.join(', ')}. A medida que progreses, la app irá sumando ejercicios más exigentes.`
    )
  }

  if (edad !== null && edad >= 55) {
    notas.push('Por tu edad priorizamos máquinas y movimientos controlados, sin saltos ni cargas pesadas sobre la columna.')
  }

  return {
    imc,
    categoria,
    edad,
    excluir,
    preferirMaquinas,
    volumenReducido,
    cardioBajoImpacto,
    objetivoEfectivo,
    notas,
  }
}
