// =============================================================
// Lesiones y precauciones del socio
//
// - "leve": molestia leve o lesión antigua ya recuperada.
//   → La rutina se genera evitando los ejercicios que cargan esa zona.
// - "activa": dolor actual, lesión reciente u operación.
//   → Requiere revisión del entrenador (se guarda en `limitaciones`).
//
// Formato guardado (legible para el personal y fácil de leer por la app):
//   limitaciones:  "Revisión: rodilla, hombro · Condición médica · Nota: ..."
//   observaciones: "Precauciones: rodilla, cuello\n<notas libres>"
// =============================================================

import { extraerSecundario } from './objetivos.js'

export const ZONAS = {
  rodilla: {
    nombre: 'Rodilla',
    evitar: /sentadilla|zancada|b[uú]lgara|salto|burpee|step|lunge|pistol|thruster|prensa|extensi[oó]n de (cu[aá]driceps|piernas)|jump|cuerda|intervalos en caminadora|trote|correr/i,
    puedes: 'Tren superior, core, hip thrust y puente de glúteo, curl femoral y bicicleta suave si no hay dolor.',
    consejo: 'Evita impactos y flexiones profundas de rodilla. Si un ejercicio duele, detente.',
  },
  hombro: {
    nombre: 'Hombro',
    evitar: /press (militar|de hombro|arnold|inclinado|franc)|press hombro|fondos|elevaci[oó]n(es)? (lateral|frontal)|remo al ment[oó]n|dominada|aperturas|cruce de poleas|pullover|flexiones pliom|pec deck|sobre la cabeza|overhead|thruster/i,
    puedes: 'Piernas, glúteos, core, remo con agarre neutro, face pull suave y cardio.',
    consejo: 'Evita llevar los brazos por encima de la cabeza y las posiciones con mucho estiramiento del hombro.',
  },
  lumbar: {
    nombre: 'Espalda baja',
    evitar: /peso muerto|buenos d[ií]as|remo con barra|sentadilla (con barra|frontal)|good morning|hiperextensi[oó]n(es)? lastrada|giros rusos|swing|zancada atr[aá]s con barra|press militar|crunch|rueda abdominal|burpee/i,
    puedes: 'Máquinas con respaldo, prensa con rango cómodo, jalón, remo sentado, plancha y dead bug.',
    consejo: 'Mantén la espalda neutra y prioriza máquinas con respaldo. Nada de cargas pesadas sobre la columna.',
  },
  cuello: {
    nombre: 'Cuello',
    evitar: /press militar|crunch|encogimiento|sentadilla con barra|buenos d[ií]as|elevaci[oó]n de piernas colgado/i,
    puedes: 'Casi todo con buena postura: máquinas, mancuernas ligeras, plancha y cardio.',
    consejo: 'Evita cargar barra sobre la espalda y tirar del cuello en abdominales.',
  },
  muneca: {
    nombre: 'Muñeca o codo',
    evitar: /flexiones|fondos|press franc[eé]s|curl con barra|burpee|mountain|escaladores|plancha lateral|dominada|rueda abdominal|kettlebell|caminata del granjero/i,
    puedes: 'Piernas en máquina, glúteos, cardio en bicicleta y ejercicios con agarre neutro y ligero.',
    consejo: 'Evita apoyar el peso del cuerpo en las manos y los agarres muy cerrados o pesados.',
  },
  tobillo: {
    nombre: 'Tobillo o pie',
    evitar: /salto|cuerda|burpee|jumping|zancadas caminando|intervalos en caminadora|step|elevaci[oó]n de talones|gemelos|sentadilla b[uú]lgara/i,
    puedes: 'Tren superior, máquinas sentado, core y bicicleta estática suave.',
    consejo: 'Evita impactos y apoyos en un solo pie.',
  },
  cadera: {
    nombre: 'Cadera',
    evitar: /b[uú]lgara|zancada|peso muerto|abductor|abducci[oó]n|sentadilla (frontal|con barra)|step|patada de gl[uú]teo|salto/i,
    puedes: 'Tren superior, core sin rotación, prensa en rango cómodo y bicicleta suave.',
    consejo: 'Evita las aperturas amplias de cadera y los ejercicios a una pierna.',
  },
}

const MARCA_REVISION = 'Revisión:'
const MARCA_PRECAUCION = 'Precauciones:'

export function nombresZonas(codigos) {
  return [...codigos].map((c) => ZONAS[c]?.nombre?.toLowerCase() || c).join(', ')
}

/** Detecta zonas mencionadas en texto libre (perfiles antiguos). */
export function detectarZonas(texto) {
  const t = String(texto || '').toLowerCase()
  const zonas = new Set()
  if (/rodill|menisco|ligamento cruzado|r[oó]tula/.test(t)) zonas.add('rodilla')
  if (/hombro|manguito|clav[ií]cula/.test(t)) zonas.add('hombro')
  if (/lumbar|espalda baja|ci[aá]tic|hernia|disco|columna/.test(t)) zonas.add('lumbar')
  if (/cuello|cervical/.test(t)) zonas.add('cuello')
  if (/mu[nñ]eca|codo|epicondil|t[uú]nel carpiano/.test(t)) zonas.add('muneca')
  if (/tobillo|pie|fascitis|aquiles/.test(t)) zonas.add('tobillo')
  if (/cadera/.test(t)) zonas.add('cadera')
  return zonas
}

/** Estado estructurado a partir de lo guardado en el perfil. */
export function leerPrecauciones(limitaciones, observaciones) {
  const lim = String(limitaciones || '').trim()
  const obs = extraerSecundario(observaciones).resto
  const zonas = {}
  let medica = false
  let nota = ''

  if (lim.startsWith(MARCA_REVISION)) {
    const partes = lim.split(' · ')
    for (const z of partes[0].replace(MARCA_REVISION, '').split(',')) {
      const codigo = Object.keys(ZONAS).find((k) => ZONAS[k].nombre.toLowerCase() === z.trim().toLowerCase())
      if (codigo) zonas[codigo] = 'activa'
    }
    medica = partes.some((p) => p.trim() === 'Condición médica')
    nota = partes.find((p) => p.startsWith('Nota:'))?.replace('Nota:', '').trim() || ''
  } else if (lim) {
    // Texto libre antiguo: lo tratamos como revisión pendiente
    for (const z of detectarZonas(lim)) zonas[z] = 'activa'
    nota = lim
  }

  let notasLibres = obs
  if (obs.startsWith(MARCA_PRECAUCION)) {
    const [linea, ...resto] = obs.split('\n')
    for (const z of linea.replace(MARCA_PRECAUCION, '').split(',')) {
      const codigo = Object.keys(ZONAS).find((k) => ZONAS[k].nombre.toLowerCase() === z.trim().toLowerCase())
      if (codigo && !zonas[codigo]) zonas[codigo] = 'leve'
    }
    notasLibres = resto.join('\n').trim()
  }

  const tiene = Object.keys(zonas).length > 0 || medica || Boolean(nota)
  return { tiene: tiene ? 'si' : null, zonas, medica, nota, notasLibres }
}

/** Convierte el estado estructurado en los dos campos del perfil. */
export function escribirPrecauciones({ tiene, zonas = {}, medica = false, nota = '', notasLibres = '' }) {
  if (tiene !== 'si') {
    return { limitaciones: '', observaciones: String(notasLibres || '').trim() }
  }

  const activas = Object.keys(zonas).filter((k) => zonas[k] === 'activa')
  const leves = Object.keys(zonas).filter((k) => zonas[k] === 'leve')

  const necesitaRevision = activas.length > 0 || medica
  const partesLim = []
  if (necesitaRevision) {
    partesLim.push(`${MARCA_REVISION} ${activas.map((k) => ZONAS[k].nombre).join(', ') || 'general'}`)
    if (medica) partesLim.push('Condición médica')
    if (String(nota).trim()) partesLim.push(`Nota: ${String(nota).trim()}`)
  }

  const lineas = []
  if (leves.length) lineas.push(`${MARCA_PRECAUCION} ${leves.map((k) => ZONAS[k].nombre).join(', ')}`)
  if (!necesitaRevision && String(nota).trim()) lineas.push(String(nota).trim())
  if (String(notasLibres).trim()) lineas.push(String(notasLibres).trim())

  return {
    limitaciones: partesLim.join(' · '),
    observaciones: lineas.join('\n'),
  }
}

/** Todas las zonas a cuidar (leves + activas) de un perfil. */
export function zonasDelPerfil(perfil) {
  const estado = leerPrecauciones(perfil?.limitaciones, perfil?.observaciones)
  return Object.keys(estado.zonas)
}

/** ¿Este ejercicio carga alguna de las zonas indicadas? Devuelve la zona o null. */
export function zonaEnRiesgo(ejercicio, zonas = []) {
  const texto = [ejercicio?.nombre, ejercicio?.nombre_realizado, ejercicio?.codigo?.replace(/_/g, ' ')]
    .filter(Boolean)
    .join(' ')
  for (const z of zonas) {
    if (ZONAS[z]?.evitar.test(texto)) return z
  }
  return null
}
