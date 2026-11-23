// =============================================================
// MOTOR DE RUTINAS MAK v4  (mak-adaptativo-v4)
//
// Reemplaza al motor SQL determinista v3, que generaba la misma
// rutina para cualquier nivel y solo 5 ejercicios.
//
// Principios:
//  - El nivel cambia la división semanal, la selección de ejercicios
//    (guiados vs. peso libre / calistenia avanzada), series,
//    repeticiones, RIR, descansos y técnicas de intensidad.
//  - Cada generación usa una semilla distinta: dos rutinas nunca son
//    idénticas, y dentro de la semana se evita repetir ejercicios.
//  - Mínimo 7 ejercicios principales por día, ajustados al tiempo
//    máximo de la sesión (calentamiento + trabajo + cierre).
//  - Incluye bloques de fuerza, hipertrofia, funcional/core y un
//    finalizador cardiovascular según el objetivo.
//  - Solo usa equipamiento ACTIVO del gimnasio. Al activar una máquina
//    nueva, sus ejercicios se vuelven elegibles automáticamente.
// =============================================================

import {
  EJERCICIOS,
  MOVILIDAD,
  ESTIRAMIENTOS,
  GRUPOS,
} from './ejercicios.js'

import {
  indexarEquipamiento,
} from './equipamiento.js'

import {
  ZONAS,
  nombresZonas,
  zonaEnRiesgo,
  zonasDelPerfil,
} from '../precauciones.js'

import { extraerSecundario } from '../objetivos.js'

export const VERSION_MOTOR = 'mak-adaptativo-v4'

export const NIVELES = {
  principiante: 1,
  intermedio: 2,
  avanzado: 3,
}

const NOMBRE_NIVEL = { 1: 'Principiante', 2: 'Intermedio', 3: 'Avanzado' }

const NOMBRE_OBJETIVO = {
  bajar_grasa: 'Pérdida de grasa',
  ganar_musculo: 'Hipertrofia',
  fuerza: 'Fuerza',
  tonificacion: 'Tonificación',
  resistencia: 'Resistencia',
  mantenerse: 'Mantenimiento',
}

export const MINIMO_EJERCICIOS = 7
const MAXIMO_EJERCICIOS = 10

// -------------------------------------------------------------
// Utilidades: PRNG con semilla, hash y UUID determinista
// -------------------------------------------------------------

export function hashTexto(texto) {
  let h = 0x811c9dc5
  const s = String(texto)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function crearAleatorio(semilla) {
  let a = hashTexto(semilla) || 1
  return function aleatorio() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** UUID estable a partir del código del ejercicio (formato v5). */
export function uuidDesdeCodigo(codigo) {
  const partes = [0, 1, 2, 3].map((i) =>
    hashTexto(`mak-ejercicio:${i}:${codigo}`).toString(16).padStart(8, '0')
  )
  const hex = partes.join('')
  const variante = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variante}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-')
}

function rutaDemo(demo, cuadro = 0) {
  return demo ? `/ejercicios/${demo}/${cuadro}.webp` : null
}

// -------------------------------------------------------------
// Biblioteca: ejercicios base + personalizados del gimnasio
// -------------------------------------------------------------

export function construirBiblioteca(personalizados = []) {
  const mapa = new Map(EJERCICIOS.map((x) => [x.codigo, x]))

  for (const p of personalizados || []) {
    if (!p?.codigo || p.activo === false) continue
    const equipo = Array.isArray(p.equipo)
      ? p.equipo
      : String(p.equipo || p.equipamiento_codigo || 'peso_corporal')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)

    mapa.set(p.codigo, {
      codigo: String(p.codigo),
      nombre: String(p.nombre || p.codigo),
      grupo: p.grupo in GRUPOS ? p.grupo : 'cuerpo',
      patron: String(p.patron || 'funcional'),
      equipo,
      nivel_min: Number(p.nivel_min) || 1,
      nivel_max: Number(p.nivel_max) || 3,
      tipo: p.tipo || 'fuerza',
      demo: null,
      imagen_url: p.imagen_url || null,
      video_url: p.video_url || null,
      tecnica: p.tecnica || '',
      guiado: Boolean(p.guiado),
      compuesto: Boolean(p.compuesto),
      seg: Boolean(p.seg),
      unilateral: Boolean(p.unilateral),
      personalizado: true,
    })
  }

  return [...mapa.values()]
}

function disponible(ejercicio, equipos) {
  return ejercicio.equipo.every((codigo) => equipos.get(codigo)?.activo)
}

// -------------------------------------------------------------
// Prescripción por objetivo y nivel
// -------------------------------------------------------------

const REPS = {
  ganar_musculo: { principal: '6-10', secundario: '8-12', accesorio: '10-15', core: '12-15' },
  fuerza: { principal: '4-6', secundario: '6-8', accesorio: '8-12', core: '10-12' },
  bajar_grasa: { principal: '10-12', secundario: '12-15', accesorio: '12-15', core: '15-20' },
  tonificacion: { principal: '10-12', secundario: '12-15', accesorio: '12-15', core: '15' },
  resistencia: { principal: '12-15', secundario: '15-20', accesorio: '15-20', core: '20' },
  mantenerse: { principal: '8-12', secundario: '10-12', accesorio: '12-15', core: '12-15' },
}

// Principiantes nunca trabajan por debajo de 8 repeticiones
const REPS_PRINCIPIANTE = {
  fuerza: { principal: '8-10', secundario: '10-12', accesorio: '12-15', core: '10-12' },
  ganar_musculo: { principal: '10-12', secundario: '10-12', accesorio: '12-15', core: '12' },
}

const DESCANSO = {
  ganar_musculo: { principal: 120, secundario: 90, accesorio: 60, core: 45 },
  fuerza: { principal: 180, secundario: 120, accesorio: 75, core: 45 },
  bajar_grasa: { principal: 75, secundario: 60, accesorio: 45, core: 30 },
  tonificacion: { principal: 75, secundario: 60, accesorio: 45, core: 30 },
  resistencia: { principal: 60, secundario: 45, accesorio: 30, core: 30 },
  mantenerse: { principal: 90, secundario: 75, accesorio: 60, core: 45 },
}

const SERIES = {
  1: { principal: 3, secundario: 3, accesorio: 2, core: 2, funcional: 2 },
  2: { principal: 4, secundario: 3, accesorio: 3, core: 3, funcional: 3 },
  3: { principal: 5, secundario: 4, accesorio: 3, core: 3, funcional: 3 },
}

const SEGUNDOS_TIEMPO = { 1: 30, 2: 40, 3: 45 }
const RIR = { 1: 3, 2: 2, 3: 1 }

// -------------------------------------------------------------
// Plantillas de día: [rol, patrones aceptados]
// -------------------------------------------------------------

const PLANTILLAS = {
  full_a: {
    titulo: 'Cuerpo completo A', zona: 'todo',
    slots: [
      ['principal', ['sentadilla']],
      ['principal', ['emp_h']],
      ['secundario', ['tir_v']],
      ['secundario', ['cadera', 'bisagra']],
      ['accesorio', ['emp_v']],
      ['accesorio', ['tir_h']],
      ['core', ['core_anti']],
      ['funcional', ['funcional']],
      ['core', ['lumbar']],
    ],
  },
  full_b: {
    titulo: 'Cuerpo completo B', zona: 'todo',
    slots: [
      ['principal', ['bisagra', 'cadera']],
      ['principal', ['emp_h_inc', 'emp_h']],
      ['secundario', ['tir_h']],
      ['secundario', ['zancada']],
      ['accesorio', ['hombro_lat']],
      ['accesorio', ['biceps']],
      ['accesorio', ['triceps']],
      ['core', ['core_rot']],
      ['funcional', ['funcional']],
    ],
  },
  full_c: {
    titulo: 'Cuerpo completo C', zona: 'todo',
    slots: [
      ['principal', ['cadera']],
      ['principal', ['tir_v']],
      ['secundario', ['emp_h_dec', 'fondos', 'emp_h']],
      ['secundario', ['sentadilla', 'zancada']],
      ['accesorio', ['hombro_post']],
      ['accesorio', ['isquio_ais', 'cuad_ais']],
      ['core', ['core_flex']],
      ['funcional', ['funcional']],
      ['core', ['lumbar']],
    ],
  },
  torso_a: {
    titulo: 'Torso: pecho y espalda', zona: 'torso',
    slots: [
      ['principal', ['emp_h']],
      ['principal', ['tir_v']],
      ['secundario', ['emp_h_inc']],
      ['secundario', ['tir_h']],
      ['accesorio', ['emp_v']],
      ['accesorio', ['hombro_lat']],
      ['accesorio', ['triceps']],
      ['accesorio', ['biceps']],
      ['core', ['core_anti']],
    ],
  },
  torso_b: {
    titulo: 'Torso: espalda y hombro', zona: 'torso',
    slots: [
      ['principal', ['tir_h']],
      ['principal', ['emp_h_inc', 'emp_v']],
      ['secundario', ['tir_v']],
      ['secundario', ['emp_h_dec', 'fondos']],
      ['accesorio', ['hombro_post']],
      ['accesorio', ['ais_pecho']],
      ['accesorio', ['biceps']],
      ['accesorio', ['triceps']],
      ['core', ['core_rot']],
    ],
  },
  pierna_a: {
    titulo: 'Pierna: cuádriceps', zona: 'pierna',
    slots: [
      ['principal', ['sentadilla']],
      ['principal', ['bisagra']],
      ['secundario', ['zancada']],
      ['secundario', ['cadera']],
      ['accesorio', ['cuad_ais']],
      ['accesorio', ['isquio_ais']],
      ['accesorio', ['gemelos']],
      ['core', ['core_flex']],
    ],
  },
  pierna_b: {
    titulo: 'Pierna: glúteo e isquios', zona: 'pierna',
    slots: [
      ['principal', ['cadera']],
      ['principal', ['bisagra']],
      ['secundario', ['sentadilla']],
      ['secundario', ['zancada']],
      ['accesorio', ['abductor', 'isquio_ais']],
      ['accesorio', ['isquio_ais', 'cuad_ais']],
      ['core', ['lumbar']],
      ['core', ['core_anti']],
    ],
  },
  empuje: {
    titulo: 'Empuje: pecho, hombro y tríceps', zona: 'torso',
    slots: [
      ['principal', ['emp_h']],
      ['principal', ['emp_v']],
      ['secundario', ['emp_h_inc', 'emp_h_dec']],
      ['secundario', ['fondos']],
      ['accesorio', ['ais_pecho']],
      ['accesorio', ['hombro_lat']],
      ['accesorio', ['triceps']],
      ['core', ['core_flex']],
    ],
  },
  tiron: {
    titulo: 'Tirón: espalda y bíceps', zona: 'torso',
    slots: [
      ['principal', ['tir_v']],
      ['principal', ['tir_h']],
      ['secundario', ['tir_v']],
      ['secundario', ['tir_h']],
      ['accesorio', ['hombro_post']],
      ['accesorio', ['biceps']],
      ['accesorio', ['biceps']],
      ['core', ['lumbar']],
      ['core', ['core_rot']],
    ],
  },
  metabolico: {
    titulo: 'Funcional y acondicionamiento', zona: 'todo', circuito: true,
    slots: [
      ['secundario', ['sentadilla', 'zancada']],
      ['secundario', ['emp_h']],
      ['secundario', ['tir_h', 'tir_v']],
      ['funcional', ['funcional']],
      ['funcional', ['funcional']],
      ['accesorio', ['cadera']],
      ['core', ['core_anti']],
      ['core', ['core_rot', 'core_flex']],
      ['funcional', ['funcional']],
    ],
  },
}

// División semanal por días y nivel
const DIVISIONES = {
  1: { 1: ['full_a'], 2: ['full_a'], 3: ['full_b'] },
  2: { 1: ['full_a', 'full_b'], 2: ['torso_a', 'pierna_a'], 3: ['torso_a', 'pierna_b'] },
  3: { 1: ['full_a', 'full_b', 'full_c'], 2: ['torso_a', 'pierna_a', 'full_c'], 3: ['empuje', 'tiron', 'pierna_a'] },
  4: { 1: ['full_a', 'full_b', 'full_c', 'metabolico'], 2: ['torso_a', 'pierna_a', 'torso_b', 'pierna_b'], 3: ['empuje', 'pierna_a', 'tiron', 'pierna_b'] },
  5: { 1: ['full_a', 'full_b', 'metabolico', 'full_c', 'metabolico'], 2: ['torso_a', 'pierna_a', 'metabolico', 'torso_b', 'pierna_b'], 3: ['empuje', 'tiron', 'pierna_a', 'torso_b', 'pierna_b'] },
}

const OBJETIVOS_METABOLICOS = new Set(['bajar_grasa', 'resistencia', 'tonificacion'])

// Ejercicios evitados si el socio reporta limitaciones físicas
const EVITAR_CON_LIMITACIONES = new Set([
  'peso_muerto', 'buenos_dias', 'sentadilla_frontal', 'zancada_atras_barra',
  'dominadas_lastradas', 'rueda_abdominal', 'elevacion_piernas_colgado',
])

// -------------------------------------------------------------
// Tiempo
// -------------------------------------------------------------

function repsPromedio(texto) {
  const numeros = String(texto).match(/\d+/g)?.map(Number) || [10]
  return numeros.reduce((a, b) => a + b, 0) / numeros.length
}

function segundosSerie(item) {
  if (item.seg) return item.segundos
  const base = repsPromedio(item.reps) * 3.5
  return item.unilateral ? base * 1.8 : base
}

/** Duración estimada en segundos de un bloque (individual o superserie). */
function duracionBloque(items) {
  if (items[0].finalizador) return items[0].minutos * 60 + 60
  const series = Math.max(...items.map((x) => x.series))
  const trabajo = items.reduce((t, x) => t + segundosSerie(x), 0)
  const entre = (items.length - 1) * 15
  const descanso = items[items.length - 1].descanso
  return series * (trabajo + entre) + (series - 1) * descanso + 60
}

function agruparBloques(items) {
  const bloques = []
  const vistos = new Set()
  for (const item of items) {
    if (vistos.has(item)) continue
    if (item.pareja) {
      bloques.push([item, item.pareja])
      vistos.add(item.pareja)
    } else {
      bloques.push([item])
    }
    vistos.add(item)
  }
  return bloques
}

function duracionTotal(items) {
  return agruparBloques(items).reduce((t, b) => t + duracionBloque(b), 0)
}

// -------------------------------------------------------------
// Selección de ejercicios
// -------------------------------------------------------------

function puntuar(ej, ctx, rol) {
  const { nivel, objetivo, usadosSemana, aleatorio, equipos } = ctx
  let p = aleatorio() * 2.6

  if (rol === 'principal' && ej.compuesto) p += 3
  if (rol === 'core' && ej.tipo === 'core') p += 1

  if (nivel === 1) {
    if (ej.guiado) p += 3
    if (ej.nivel_max === 1 || ej.nivel_min === 1) p += 0.8
    if (ej.explosivo) p -= 4
  } else if (nivel === 2) {
    if (!ej.guiado) p += 1
    if (ej.nivel_min === 2) p += 1.2
  } else {
    if (!ej.guiado && ej.compuesto) p += 2.5
    if (ej.nivel_min === 3) p += 2
    if (ej.tipo === 'calistenia') p += 1
    if (ej.guiado && rol === 'principal') p -= 2
  }

  // En niveles 2-3 el ejercicio principal debe tener carga externa o ser
  // calistenia de nivel intermedio/avanzado (dominadas, fondos...)
  const soloPesoCorporal = ej.equipo.every((c) => c === 'peso_corporal' || c === 'colchoneta' || c === 'banco_plano')
  if (rol === 'principal' && nivel >= 2 && soloPesoCorporal && ej.nivel_min === 1) p -= 5

  // Variedad dentro del día: penaliza repetir la misma familia (flexiones, curl, remo...)
  const familia = ej.codigo.split('_')[0]
  p -= (ctx.familiasHoy?.get(familia) || 0) * 2.2

  if (OBJETIVOS_METABOLICOS.has(objetivo)) {
    if (ej.compuesto) p += 0.8
    if (ej.tipo === 'funcional' && nivel > 1) p += 1
  }

  if (objetivo === 'fuerza' && rol === 'principal' && !ej.guiado) p += 1.5

  // Fomenta el uso de equipamiento recién incorporado
  if (ej.equipo.some((c) => equipos.get(c)?.nuevo)) p += 0.9

  const usos = usadosSemana.get(ej.codigo) || 0
  p -= usos * 6

  // Reparto entre socios: si muchos tienen ya este ejercicio en su rutina
  // activa, baja su prioridad (menos coincidencias y menos filas en la máquina)
  if (ctx.popularidad?.size) {
    const max = ctx.popularidadMax || 1
    p -= 2.2 * ((ctx.popularidad.get(ej.codigo) || 0) / max)
  }

  return p
}

function elegir(patrones, rol, ctx, usadosHoy) {
  const { biblioteca, equipos, nivel, limitaciones } = ctx
  let mejor = null
  let mejorPuntaje = -Infinity

  for (const ej of biblioteca) {
    if (!patrones.includes(ej.patron)) continue
    if (usadosHoy.has(ej.codigo)) continue
    if (!disponible(ej, equipos)) continue
    if (nivel < ej.nivel_min) continue
    // Regresiones solo hasta un nivel por encima de su máximo
    if (nivel > ej.nivel_max + 1) continue
    if (nivel > ej.nivel_max && rol === 'principal') continue
    if (limitaciones && (ej.explosivo || EVITAR_CON_LIMITACIONES.has(ej.codigo))) continue
    // Zonas a cuidar (lesiones leves o recuperadas): nunca cargarlas
    if (ctx.zonas.length && zonaEnRiesgo(ej, ctx.zonas)) continue
    // Evita dos ejercicios del mismo patrón principal y mismo grupo el mismo día salvo en tirón
    const puntaje = puntuar(ej, ctx, rol)
    if (puntaje > mejorPuntaje) {
      mejor = ej
      mejorPuntaje = puntaje
    }
  }

  return mejor
}

function prescribir(ej, rol, ctx) {
  const { nivel, objetivo } = ctx
  const rolBase = rol === 'funcional' ? 'accesorio' : rol
  const tabla =
    (nivel === 1 && REPS_PRINCIPIANTE[objetivo]) || REPS[objetivo] || REPS.mantenerse
  const descansos = DESCANSO[objetivo] || DESCANSO.mantenerse

  let series = SERIES[nivel][rol] ?? 3
  if (objetivo === 'fuerza' && rol === 'principal' && nivel >= 2) series = 5
  if (OBJETIVOS_METABOLICOS.has(objetivo) && rol === 'principal') series = Math.min(series, 4)

  const seg = ej.seg || ej.tipo === 'cardio'
  let segundos = SEGUNDOS_TIEMPO[nivel]
  if (ej.patron === 'funcional' && seg) segundos += 5

  let descanso = rol === 'funcional'
    ? Math.max(30, descansos.core)
    : descansos[rolBase] ?? 60

  let reps = tabla[rolBase] || '10-12'
  const sec = ctx.secundario

  // Objetivo secundario: ajusta sin cambiar la base del principal
  if (sec === 'fuerza' && rolBase === 'principal' && nivel >= 2 && objetivo !== 'fuerza') {
    reps = '5-8'
    descanso = Math.max(descanso, 150)
  }
  if (sec === 'ganar_musculo' && rolBase === 'accesorio') {
    reps = '10-12'
    series = Math.min(4, series + 1)
  }
  if ((sec === 'resistencia' || sec === 'tonificacion' || sec === 'bajar_grasa') && rolBase === 'accesorio') {
    descanso = Math.max(30, descanso - 15)
  }

  // Principiantes: cargas moderadas, no necesitan descansos tan largos
  if (nivel === 1) descanso = Math.min(descanso, rolBase === 'principal' ? 90 : 75)

  return {
    series,
    reps: seg ? `${segundos} seg` : reps,
    segundos,
    seg,
    descanso,
  }
}

// -------------------------------------------------------------
// Textos
// -------------------------------------------------------------

function textoIntensidad(item, nivel, objetivo) {
  if (item.finalizador) return item.intensidadTexto
  if (item.seg) {
    return nivel === 1
      ? 'Ritmo controlado: prioriza la postura sobre la velocidad.'
      : 'Ritmo alto y constante, sin perder la técnica.'
  }
  const rir = objetivo === 'fuerza' && item.rol === 'principal'
    ? Math.max(1, RIR[nivel])
    : RIR[nivel]
  const frase = rir === 1 ? '1 repetición' : `${rir} repeticiones`
  return `RIR ${rir} · termina cada serie sintiendo que podrías hacer ${frase} más con buena técnica.`
}

function textoRecomendacion(item, nivel) {
  if (item.finalizador) return item.recomendacionTexto
  const partes = []

  if (item.rol === 'principal') {
    partes.push(
      nivel === 1
        ? 'Empieza con un peso que te permita completar todas las series con técnica perfecta.'
        : 'Haz 1-2 series de aproximación con menos peso antes de las series efectivas.'
    )
  }

  if (item.superserie) {
    partes.push(
      item.circuito
        ? 'Circuito: pasa al siguiente ejercicio sin descanso y descansa al completar la vuelta.'
        : `Superserie ${item.superserie}: alterna con su pareja sin descanso; descansa al terminar ambos.`
    )
  }

  if (item.tecnicaIntensidad) partes.push(item.tecnicaIntensidad)

  if (nivel === 1 && item.rol !== 'core') {
    partes.push('Sube el peso cuando completes todas las series en el tope del rango de repeticiones.')
  }

  return partes.join(' ')
}

function nombreEquipo(ej, equipos) {
  const nombres = ej.equipo
    .filter((c) => c !== 'peso_corporal' && c !== 'colchoneta')
    .map((c) => equipos.get(c)?.nombre || c)
  return nombres.length ? nombres.join(' + ') : 'Peso corporal'
}

function incrementoDe(ej, equipos) {
  for (const codigo of ej.equipo) {
    const inc = equipos.get(codigo)?.incremento_kg
    if (Number.isFinite(inc) && inc > 0) return inc
  }
  return null
}

// -------------------------------------------------------------
// Construcción de un día
// -------------------------------------------------------------

function tiemposFijos(tiempo) {
  if (tiempo <= 30) return { calentamiento: 5, cierre: 3 }
  if (tiempo <= 45) return { calentamiento: 6, cierre: 4 }
  return { calentamiento: 8, cierre: 5 }
}

const POOL_EXTRA = [
  ['core', ['core_anti']],
  ['core', ['core_rot']],
  ['funcional', ['funcional']],
  ['core', ['core_flex']],
  ['core', ['lumbar']],
  ['accesorio', ['hombro_post']],
  ['accesorio', ['gemelos']],
]

function crearFinalizador(ctx, presupuestoMin) {
  const { biblioteca, equipos, nivel, objetivo, aleatorio, usadosSemana, limitaciones } = ctx
  const metabolico = OBJETIVOS_METABOLICOS.has(objetivo)
  const minutos = Math.max(5, Math.min(metabolico ? 12 : 8, presupuestoMin))

  const intervalos = nivel >= 2 && !limitaciones
  const candidatos = biblioteca.filter(
    (ej) =>
      ej.patron === 'cardio' &&
      disponible(ej, equipos) &&
      !(ctx.zonas.length && zonaEnRiesgo(ej, ctx.zonas)) &&
      nivel >= ej.nivel_min &&
      (intervalos ? true : !ej.codigo.startsWith('intervalos'))
  )

  if (!candidatos.length) return null

  candidatos.sort((a, b) => {
    const pa = (intervalos && a.codigo.startsWith('intervalos') ? 2 : 0) - (usadosSemana.get(a.codigo) || 0) * 3 + aleatorio()
    const pb = (intervalos && b.codigo.startsWith('intervalos') ? 2 : 0) - (usadosSemana.get(b.codigo) || 0) * 3 + aleatorio()
    return pb - pa
  })

  const ej = candidatos[0]
  const esIntervalo = ej.codigo.startsWith('intervalos')

  return {
    ej,
    rol: 'cardio',
    finalizador: true,
    minutos,
    series: 1,
    reps: `${minutos} min`,
    seg: true,
    segundos: minutos * 60,
    descanso: 0,
    intensidadTexto: esIntervalo
      ? nivel === 3
        ? 'Intervalos de alta intensidad: 20-30 s al 90 % y 40-60 s suave.'
        : 'Intervalos: 30 s rápido y 60 s suave, a un esfuerzo de 7-8 sobre 10.'
      : 'Intensidad moderada: puedes hablar con frases cortas (zona 2).',
    recomendacionTexto: metabolico
      ? 'Finalizador metabólico: mantén el ritmo durante todo el bloque para aumentar el gasto calórico.'
      : 'Finalizador cardiovascular corto para mejorar tu capacidad aeróbica sin afectar la recuperación.',
  }
}

function emparejar(items, ctx, plantilla) {
  const { nivel } = ctx
  const candidatos = items.filter(
    (x) => !x.finalizador && (x.rol === 'accesorio' || x.rol === 'core' || x.rol === 'funcional')
  )

  if (plantilla.circuito) {
    // En el día funcional, agrupa todo (salvo el finalizador) en pares de circuito
    const lista = items.filter((x) => !x.finalizador)
    for (let i = 0; i + 1 < lista.length; i += 2) {
      lista[i].pareja = lista[i + 1]
      lista[i].circuito = true
      lista[i + 1].circuito = true
      lista[i + 1].esPareja = true
    }
    return
  }

  if (nivel === 1) return

  for (let i = 0; i + 1 < candidatos.length; i += 2) {
    const a = candidatos[i]
    const b = candidatos[i + 1]
    if (a.pareja || b.pareja || a.esPareja || b.esPareja) continue
    a.pareja = b
    b.esPareja = true
  }
}

function forzarEmparejamiento(items, incluirPrincipales = false) {
  const libres = items.filter(
    (x) =>
      !x.finalizador &&
      !x.pareja &&
      !x.esPareja &&
      (incluirPrincipales || x.rol !== 'principal')
  )
  for (let i = 0; i + 1 < libres.length; i += 2) {
    libres[i].pareja = libres[i + 1]
    libres[i + 1].esPareja = true
    return true
  }
  return false
}

function ajustarAlTiempo(items, presupuestoSeg, ctx) {
  const prioridad = { core: 1, funcional: 2, accesorio: 3, secundario: 4, principal: 5 }
  let guardia = 0

  while (duracionTotal(items) > presupuestoSeg && guardia++ < 80) {
    const fin = items.find((x) => x.finalizador)
    if (fin && fin.minutos > 5) {
      fin.minutos -= 1
      fin.reps = `${fin.minutos} min`
      continue
    }

    const principales = items.filter((x) => !x.finalizador)

    // 1) Quitar ejercicios de menor prioridad mientras sobren
    if (principales.length > MINIMO_EJERCICIOS) {
      const quitar = [...principales]
        .filter((x) => !x.esPareja)
        .sort((a, b) => prioridad[a.rol] - prioridad[b.rol])[0]
      if (quitar) {
        if (quitar.pareja) {
          quitar.pareja.esPareja = false
          quitar.pareja = null
        }
        items.splice(items.indexOf(quitar), 1)
        // Si quitamos el segundo de una pareja, deshacer el enlace
        for (const x of items) if (x.pareja === quitar) x.pareja = null
        continue
      }
    }

    // 2) Agrupar en superseries
    if (forzarEmparejamiento(items)) continue

    // 3) Reducir series (accesorios → secundarios → principales)
    const reducible = ['core', 'funcional', 'accesorio', 'secundario', 'principal']
      .flatMap((rol) => principales.filter((x) => x.rol === rol))
      .find((x) => x.series > (x.rol === 'principal' ? (ctx.tiempo <= 30 ? 2 : 3) : 2))
    if (reducible) {
      reducible.series -= 1
      continue
    }

    // 4) Reducir descansos
    const conDescanso = principales.find((x) => x.descanso > (x.rol === 'principal' ? 60 : 30))
    if (conDescanso) {
      conDescanso.descanso -= 15
      continue
    }

    // 5) Quitar finalizador
    if (fin) {
      items.splice(items.indexOf(fin), 1)
      continue
    }

    // 6) Superseries antagonistas también en los ejercicios principales
    if (forzarEmparejamiento(items, true)) continue

    // 7) Descansos mínimos para sesiones muy cortas
    const minimo = principales.find((x) => x.descanso > (x.rol === 'principal' ? 45 : 20))
    if (minimo) {
      minimo.descanso -= 5
      continue
    }

    // 8) Rangos de repeticiones / tiempos algo más cortos
    const largo = principales.find((x) =>
      x.seg ? x.segundos > 25 : repsPromedio(x.reps) > 12
    )
    if (largo) {
      if (largo.seg) {
        largo.segundos -= 5
        largo.reps = `${largo.segundos} seg`
      } else {
        largo.reps = repsPromedio(largo.reps) > 15 ? '12-15' : '10-12'
      }
      continue
    }

    break
  }
}

function construirDia(numero, clavePlantilla, ctx) {
  const plantilla = PLANTILLAS[clavePlantilla]
  const usadosHoy = new Set()
  ctx.familiasHoy = new Map()
  const items = []
  const tiempo = ctx.tiempo
  const fijos = { ...tiemposFijos(tiempo) }
  const presupuestoSeg = (tiempo - fijos.calentamiento - fijos.cierre) * 60

  const agregar = ([rol, patrones]) => {
    const ej = elegir(patrones, rol, ctx, usadosHoy)
    if (!ej) return false
    usadosHoy.add(ej.codigo)
    const familia = ej.codigo.split('_')[0]
    ctx.familiasHoy.set(familia, (ctx.familiasHoy.get(familia) || 0) + 1)
    items.push({ ej, rol, ...prescribir(ej, rol, ctx), unilateral: ej.unilateral })
    return true
  }

  for (const slot of plantilla.slots) agregar(slot)

  // Garantiza el mínimo de ejercicios con el pool de respaldo
  let indicePool = Math.floor(ctx.aleatorio() * POOL_EXTRA.length)
  let intentos = 0
  while (items.length < MINIMO_EJERCICIOS && intentos++ < POOL_EXTRA.length * 2) {
    agregar(POOL_EXTRA[indicePool % POOL_EXTRA.length])
    indicePool++
  }

  // Finalizador cardiovascular
  const quiereFinalizador =
    OBJETIVOS_METABOLICOS.has(ctx.objetivo) ||
    OBJETIVOS_METABOLICOS.has(ctx.secundario) ||
    plantilla.circuito ||
    tiempo >= 50
  if (quiereFinalizador) {
    const fin = crearFinalizador(ctx, Math.floor(presupuestoSeg / 60 / 5))
    if (fin) items.push(fin)
  }

  emparejar(items, ctx, plantilla)

  // Técnicas de intensidad para avanzados (una por día, en un accesorio)
  if (ctx.nivel === 3) {
    const acc = items.filter((x) => x.rol === 'accesorio' && !x.seg)
    const elegido = acc[Math.floor(ctx.aleatorio() * acc.length)]
    if (elegido) {
      const tecnicas = [
        'Última serie: drop set (baja 20-30 % el peso y continúa hasta el fallo técnico).',
        'Última serie: rest-pause (al llegar al fallo, descansa 15 s y saca 2-4 repeticiones más).',
        'Tempo 3-0-1: baja en 3 segundos para aumentar el tiempo bajo tensión.',
      ]
      elegido.tecnicaIntensidad = tecnicas[Math.floor(ctx.aleatorio() * tecnicas.length)]
    }
  } else if (ctx.nivel === 1) {
    const principal = items.find((x) => x.rol === 'principal' && !x.seg)
    if (principal) principal.tecnicaIntensidad = 'Tempo 3-1-1: baja en 3 segundos y controla cada repetición.'
  }

  ajustarAlTiempo(items, presupuestoSeg, ctx)

  // Último recurso: acortar calentamiento/cierre (máx. 3 min en total)
  const excesoMin = Math.ceil((duracionTotal(items) - presupuestoSeg) / 60)
  if (excesoMin > 0) {
    const recorteCal = Math.min(2, excesoMin, fijos.calentamiento - 3)
    fijos.calentamiento -= recorteCal
    fijos.cierre -= Math.min(1, Math.max(0, excesoMin - recorteCal), fijos.cierre - 2)
  }

  // Si sobra tiempo, añade un ejercicio más (rutinas más completas)
  while (
    items.filter((x) => !x.finalizador).length < MAXIMO_EJERCICIOS &&
    duracionTotal(items) < presupuestoSeg - 6 * 60
  ) {
    const antes = items.length
    const fin = items.find((x) => x.finalizador)
    if (fin) items.splice(items.indexOf(fin), 1)
    agregar(POOL_EXTRA[indicePool++ % POOL_EXTRA.length])
    if (fin) items.push(fin)
    if (items.length === antes) break
    if (duracionTotal(items) > presupuestoSeg) {
      const ultimo = items.filter((x) => !x.finalizador).pop()
      items.splice(items.indexOf(ultimo), 1)
      break
    }
  }

  // Orden final: principales → secundarios → accesorios/core (parejas juntas) → finalizador
  const orden = { principal: 0, secundario: 1, accesorio: 2, funcional: 3, core: 4, cardio: 9 }
  const bloquesOrdenados = agruparBloques(items).sort(
    (a, b) => Math.min(...a.map((x) => orden[x.rol])) - Math.min(...b.map((x) => orden[x.rol]))
  )

  // Registrar usos de la semana
  for (const x of items) {
    ctx.usadosSemana.set(x.ej.codigo, (ctx.usadosSemana.get(x.ej.codigo) || 0) + 1)
  }

  // Etiquetas de bloque
  const letras = 'ABCDEFGHIJ'
  let indiceBloque = 0
  const ejercicios = []
  let orden_ = 1

  for (const bloque of bloquesOrdenados) {
    const letra = letras[indiceBloque++]
    const titulo = bloque[0].finalizador
      ? 'Finalizador cardio'
      : bloque[0].circuito
        ? 'Circuito funcional'
        : bloque.length > 1
          ? 'Superserie'
          : bloque[0].rol === 'principal'
            ? 'Fuerza principal'
            : bloque[0].rol === 'secundario'
              ? 'Trabajo complementario'
              : bloque[0].rol === 'core'
                ? 'Core'
                : 'Accesorio'

    if (bloque.length > 1) {
      const seriesPar = Math.min(...bloque.map((x) => x.series))
      bloque.forEach((x) => { x.series = seriesPar })
    }

    bloque.forEach((item, i) => {
      if (bloque.length > 1) item.superserie = `${letra}${i + 1}`
      const ej = item.ej
      const descansoFinal = bloque.length > 1 && i < bloque.length - 1 ? 0 : item.descanso
      ejercicios.push({
        orden: orden_++,
        ejercicio_id: uuidDesdeCodigo(ej.codigo),
        codigo: ej.codigo,
        nombre: ej.nombre,
        grupo_muscular: GRUPOS[ej.grupo] || ej.grupo,
        patron_movimiento: ej.patron,
        tipo: ej.tipo,
        rol: item.rol,
        equipamiento: nombreEquipo(ej, ctx.equipos),
        bloque: letra,
        bloque_titulo: titulo,
        superserie: item.superserie || null,
        series: item.series,
        series_objetivo: item.series,
        repeticiones: item.reps,
        repeticiones_objetivo: item.reps,
        descanso_seg: descansoFinal,
        intensidad: textoIntensidad(item, ctx.nivel, ctx.objetivo),
        tecnica: ej.tecnica,
        recomendacion: textoRecomendacion(item, ctx.nivel),
        imagen_url: ej.imagen_url || rutaDemo(ej.demo, 0),
        imagenes: ej.demo ? [rutaDemo(ej.demo, 0), rutaDemo(ej.demo, 1)] : ej.imagen_url ? [ej.imagen_url] : [],
        video_url: ej.video_url || null,
        incremento_kg: incrementoDe(ej, ctx.equipos),
        duracion_estimada_seg: Math.round(duracionBloque([item]) ),
      })
    })
  }

  const trabajoMin = Math.ceil(duracionTotal(items) / 60)
  const zona = plantilla.zona

  const movilidad = MOVILIDAD.filter((m) => m.zona === zona || m.zona === 'todo')
  const estiramientos = ESTIRAMIENTOS.filter((m) => m.zona === zona || m.zona === 'todo')
  const cardioSuave = ctx.equipos.get('bicicleta_estatica')?.activo
    ? 'bicicleta'
    : ctx.equipos.get('caminadora')?.activo
      ? 'caminadora'
      : 'trote suave en el sitio'

  const minutosCardioCal = Math.max(2, fijos.calentamiento - 3)

  return {
    dia: numero,
    plantilla: clavePlantilla,
    titulo:
      clavePlantilla === 'pierna_a' && ctx.zonas.includes('rodilla')
        ? 'Pierna: glúteo y femoral (rodilla protegida)'
        : plantilla.titulo,
    duracion_estimada_min: Math.min(tiempo, fijos.calentamiento + trabajoMin + fijos.cierre),
    regla_tiempo: `Calentamiento ${fijos.calentamiento} min · trabajo ${trabajoMin} min · cierre ${fijos.cierre} min (máx. ${tiempo} min)`,
    calentamiento: {
      duracion_min: fijos.calentamiento,
      indicacion: `${minutosCardioCal} min de ${cardioSuave} a ritmo suave y luego movilidad: ${movilidad.slice(0, 3).map((m) => m.nombre.toLowerCase()).join(', ')} (30 s cada uno).`,
      ejercicios: movilidad.slice(0, 3).map((m) => ({
        nombre: m.nombre,
        duracion: '30 seg',
        imagen_url: rutaDemo(m.demo, 0),
        imagenes: [rutaDemo(m.demo, 0), rutaDemo(m.demo, 1)],
      })),
    },
    ejercicios,
    cierre: {
      duracion_min: fijos.cierre,
      indicacion: `Respiración profunda y estiramientos suaves: ${estiramientos.slice(0, 3).map((m) => m.nombre.toLowerCase()).join(', ')} (30-40 s cada uno).`,
      ejercicios: estiramientos.slice(0, 3).map((m) => ({
        nombre: m.nombre,
        duracion: '30-40 seg',
        imagen_url: rutaDemo(m.demo, 0),
        imagenes: [rutaDemo(m.demo, 0), rutaDemo(m.demo, 1)],
      })),
    },
  }
}

// -------------------------------------------------------------
// API pública
// -------------------------------------------------------------

/**
 * Genera una rutina semanal completa.
 *
 * @param {object} perfil  { objetivo, nivel, dias_entrenamiento, tiempo_sesion_min, limitaciones, peso_kg, edad }
 * @param {object} opciones { equipamiento: [], personalizados: [], semilla: string }
 */
export function generarRutina(perfil, opciones = {}) {
  const nivel = NIVELES[perfil?.nivel] || 1
  const objetivo = REPS[perfil?.objetivo] ? perfil.objetivo : 'mantenerse'
  const dias = Math.min(5, Math.max(1, Number(perfil?.dias_entrenamiento) || 3))
  const tiempo = Math.min(60, Math.max(30, Number(perfil?.tiempo_sesion_min) || 60))
  const limitaciones = String(perfil?.limitaciones || '').trim()
  const semilla = String(opciones.semilla || `${Date.now()}-${Math.random()}`)

  const equipos = indexarEquipamiento(opciones.equipamiento)
  const biblioteca = construirBiblioteca(opciones.personalizados)

  const zonas = zonasDelPerfil(perfil)

  const popularidad = new Map(Object.entries(opciones.popularidad || {}))
  const secundarioLeido = extraerSecundario(perfil?.observaciones).secundario
  const secundario = secundarioLeido && secundarioLeido !== objetivo ? secundarioLeido : ''

  const ctx = {
    secundario,
    popularidad,
    popularidadMax: Math.max(1, ...popularidad.values()),
    zonas,
    nivel,
    objetivo,
    tiempo,
    limitaciones: Boolean(limitaciones),
    equipos,
    biblioteca,
    aleatorio: crearAleatorio(`${semilla}|${nivel}|${objetivo}|${dias}|${tiempo}`),
    usadosSemana: new Map(),
  }

  let division = [...DIVISIONES[dias][nivel]]

  // Objetivos metabólicos: asegura un día funcional desde 3 días
  if (OBJETIVOS_METABOLICOS.has(objetivo) && dias >= 3 && !division.includes('metabolico')) {
    division[division.length - 1] = 'metabolico'
  } else if (OBJETIVOS_METABOLICOS.has(secundario) && dias >= 5 && !division.includes('metabolico')) {
    division[division.length - 1] = 'metabolico'
  }

  const diasRutina = division.map((clave, i) => construirDia(i + 1, clave, ctx))

  const totalEjercicios = diasRutina.reduce((t, d) => t + d.ejercicios.length, 0)

  return {
    motor: VERSION_MOTOR,
    semilla,
    generada_en: new Date().toISOString(),
    nombre: `${NOMBRE_OBJETIVO[objetivo]}${secundario ? ` + ${NOMBRE_OBJETIVO[secundario]}` : ''} · ${NOMBRE_NIVEL[nivel]} · ${dias} ${dias === 1 ? 'día' : 'días'}`,
    objetivo,
    objetivo_secundario: secundario || null,
    nivel: perfil?.nivel || 'principiante',
    dias_semana: dias,
    tiempo_maximo_sesion_min: tiempo,
    tiempo_trabajo_objetivo_min: tiempo - tiemposFijos(tiempo).calentamiento - tiemposFijos(tiempo).cierre,
    total_ejercicios: totalEjercicios,
    recomendacion_general: recomendacionGeneral(nivel, objetivo) + (secundario ? ` Como también buscas ${NOMBRE_OBJETIVO[secundario].toLowerCase()}, ajustamos ${secundario === 'fuerza' ? 'los ejercicios principales a menos repeticiones y más peso' : secundario === 'ganar_musculo' ? 'los accesorios para sumar más volumen' : 'los descansos y añadimos trabajo cardiovascular al final'}.` : ''),
    recomendacion_descanso: recomendacionDescanso(dias),
    precauciones: zonas,
    advertencia: zonas.length && !limitaciones
      ? `Tu rutina cuida tu ${nombresZonas(zonas)}: evitamos los ejercicios que cargan esa zona. ${zonas.map((z) => ZONAS[z].consejo).join(' ')}`
      : limitaciones
      ? 'Indicaste limitaciones físicas. Hemos evitado ejercicios explosivos y de alta carga sobre la columna. Muestra esta rutina al entrenador de turno antes de empezar y detente si sientes dolor (no es lo mismo que el esfuerzo muscular).'
      : null,
    dias: diasRutina,
  }
}

function recomendacionGeneral(nivel, objetivo) {
  const progreso = {
    1: 'Durante las primeras 4 semanas prioriza aprender la técnica. Usa progresión doble: cuando completes todas las series en el tope del rango de repeticiones, sube el peso al siguiente incremento disponible.',
    2: 'Usa progresión doble y registra tus pesos: intenta superar repeticiones o peso cada semana en los ejercicios principales. Cada 6-8 semanas haz una semana más ligera.',
    3: 'Trabaja cerca del fallo en accesorios y con RIR 1-2 en los básicos. Rota variantes cada 4-6 semanas y programa una semana de descarga cada 5-7 semanas.',
  }[nivel]

  const foco = {
    bajar_grasa: 'Mantén descansos cortos y completa el finalizador: el déficit calórico lo marca la nutrición, el entrenamiento preserva tu músculo.',
    ganar_musculo: 'Come suficiente proteína (aprox. 1,6-2 g por kg de peso) y duerme 7-9 horas para crecer.',
    fuerza: 'Respeta los descansos largos en los ejercicios principales: la calidad de cada repetición importa más que la fatiga.',
    tonificacion: 'Combina la fuerza con el trabajo funcional para mejorar composición corporal y definición.',
    resistencia: 'Mantén el ritmo en circuitos y superseries; la capacidad de trabajo mejora semana a semana.',
    mantenerse: 'La constancia es la clave: mantén la técnica y ve sumando pequeñas mejoras.',
  }[objetivo]

  return `${progreso} ${foco}`
}

function recomendacionDescanso(dias) {
  if (dias <= 2) return 'Deja al menos 2 días entre sesiones. En los días libres camina 20-30 minutos.'
  if (dias === 3) return 'Entrena en días alternos (por ejemplo lunes, miércoles y viernes) para recuperar bien.'
  if (dias === 4) return 'Ejemplo: lunes, martes, jueves y viernes. Usa miércoles y fin de semana para descansar o caminar.'
  return 'Con 5 días, duerme bien y escucha a tu cuerpo: si un músculo sigue muy adolorido, baja una serie ese día.'
}

/** Variantes compatibles para un ejercicio (mismo patrón, equipo disponible). */
export function obtenerVariantes(codigo, opciones = {}) {
  const equipos = indexarEquipamiento(opciones.equipamiento)
  const biblioteca = construirBiblioteca(opciones.personalizados)
  const nivel = NIVELES[opciones.nivel] || 2
  const original = biblioteca.find((x) => x.codigo === codigo)
  if (!original) return []

  return biblioteca
    .filter(
      (x) =>
        x.codigo !== codigo &&
        x.patron === original.patron &&
        disponible(x, equipos) &&
        nivel >= x.nivel_min
    )
    .map((x) => ({
      x,
      p: (x.grupo === original.grupo ? 3 : 0) - Math.abs(x.nivel_min - original.nivel_min) + (x.guiado === original.guiado ? 0.5 : 0),
    }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 3)
    .map(({ x }) => ({
      ejercicio_id: uuidDesdeCodigo(x.codigo),
      codigo: x.codigo,
      nombre: x.nombre,
      grupo_muscular: GRUPOS[x.grupo] || x.grupo,
      patron_movimiento: x.patron,
      equipamiento: nombreEquipo(x, equipos),
      tecnica: x.tecnica,
      imagen_url: x.imagen_url || rutaDemo(x.demo, 0),
      imagenes: x.demo ? [rutaDemo(x.demo, 0), rutaDemo(x.demo, 1)] : [],
      incremento_kg: incrementoDe(x, equipos),
    }))
}
