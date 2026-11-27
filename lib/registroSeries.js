/**
 * Cómo se registra cada serie según el tipo de ejercicio:
 *
 *  - 'tiempo'   → cardio, planchas, escaladores por segundos…: solo se marca
 *                 como hecha (sin kilos ni repeticiones).
 *  - 'corporal' → con el propio peso (dead bug, superman, crunch, flexiones,
 *                 burpees, dominadas…): solo repeticiones; el peso extra es
 *                 opcional.
 *  - 'carga'    → máquinas, barras, mancuernas, poleas: peso y repeticiones.
 *
 * Funciona con los ejercicios del motor v4 y con los del sistema anterior
 * (se reconocen por nombre, grupo y equipamiento).
 */

const RE_TIEMPO = /(^|[^a-z])(seg|segundos|min|minutos)($|[^a-z])/i

// Cardio y actividades que se miden por tiempo aunque traigan un número
const RE_CARDIO = new RegExp(
  [
    'escaladora', 'stair ?climber', 'caminadora', 'cinta', 'trotadora',
    'bicicleta', 'spinning', 'el[ií]ptica', 'remo ergom', 'ergómetro',
    'caminata(?! del granjero)', 'trote', 'correr', 'saltar la cuerda',
    'salto de cuerda', 'plancha', 'isom[eé]tric', 'wall ?sit', 'sentadilla isom',
    'colgado pasivo', 'dead hang',
  ].join('|'),
  'i'
)

// Ejercicios que llevan carga aunque su nombre se parezca a uno corporal
const RE_CON_CARGA = new RegExp(
  [
    'lastrad', 'con barra', 'con mancuerna', 'con disco', 'con kettlebell',
    'con pesa', 'con bal[oó]n', 'polea', 'm[aá]quina', 'smith', 'prensa',
    'goblet', 'landmine', 'jal[oó]n', 'con banda el[aá]stica',
  ].join('|'),
  'i'
)

// Ejercicios con el propio peso corporal
const RE_CORPORAL = new RegExp(
  [
    'escalador', 'mountain', 'dead ?bug', 'bicho muerto', 'superman',
    'bird ?dog', 'burpee', 'jumping', 'tijeras', 'skipping', 'rodillas al pecho',
    'flexi[oó]n', 'push ?up', 'crunch', 'abdominal', 'encogimiento', 'hollow',
    'v-?up', 'elevaci[oó]n de (piernas|rodillas)', 'russian', 'giro ruso',
    'dominada', 'pull ?up', 'chin ?up', 'fondos', 'dips', 'remo invertido',
    'puente de gl[uú]teo', 'hip bridge', 'patada de burro', 'patada de gl[uú]teo en (el )?suelo',
    'hiperextensi', 'extensi[oó]n lumbar', 'sentadilla (con peso corporal|libre|al aire)',
    'sentadilla al banco', 'sentadilla con salto', 'zancadas? (caminando|alternas|libres)',
    'subida al banco', 'step ?up', 'salto', 'sprawl', 'oso', 'cangrejo', 'inchworm',
    'gusano', 'estrella',
  ].join('|'),
  'i'
)

const RE_EQUIPO_CORPORAL =
  /(peso corporal|colchoneta|sin equipo|ninguno|barras? paralelas|barra de dominadas|silla romana)/i
const RE_EQUIPO_CARGA =
  /(mancuerna|barra ol|barra z|barra recta|disco|kettlebell|polea|m[aá]quina|smith|prensa)/i

function nombreDe(ejercicio) {
  return String(
    ejercicio?.nombre_realizado ||
    ejercicio?.nombre ||
    ejercicio?.nombre_programado ||
    ''
  )
}

function patronDe(ejercicio) {
  return String(
    ejercicio?.patron_movimiento ||
    ejercicio?.snapshot_programado?.patron_movimiento ||
    ''
  ).toLowerCase()
}

export function modoRegistro(ejercicio) {
  const reps = String(ejercicio?.repeticiones_objetivo || ejercicio?.repeticiones || '')
  const nombre = nombreDe(ejercicio)
  const grupo = String(ejercicio?.grupo_muscular || '').toLowerCase()
  const equipo = String(ejercicio?.equipamiento || '')

  if (RE_TIEMPO.test(reps)) return 'tiempo'
  if (grupo === 'cardio' || patronDe(ejercicio) === 'cardio') return 'tiempo'
  if (RE_CARDIO.test(nombre)) return 'tiempo'

  if (RE_CON_CARGA.test(nombre)) return 'carga'
  if (RE_CORPORAL.test(nombre)) return 'corporal'

  if (RE_EQUIPO_CORPORAL.test(equipo) && !RE_EQUIPO_CARGA.test(equipo)) {
    return 'corporal'
  }

  return 'carga'
}

/** Primer número de la prescripción ("12-15" → 12), mínimo 1. */
export function repeticionesBase(ejercicio) {
  const n = Number(String(ejercicio?.repeticiones_objetivo || '').match(/\d+/)?.[0])
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 999) : 1
}
