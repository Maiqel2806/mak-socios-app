// Demostraciones visuales de ejercicios.
// Funciona con el motor v4 (trae `imagenes`) y también con rutinas del
// motor anterior: si el ejercicio no trae imagen, se busca la demo por
// código o por similitud de nombre en la biblioteca.

import { EJERCICIOS, MOVILIDAD, ESTIRAMIENTOS } from './ejercicios.js'

const VACIAS = new Set(['de', 'con', 'en', 'la', 'el', 'a', 'al', 'y', 'para', 'del', 'las', 'los', 'una', 'un'])

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim()
}

function tokens(texto) {
  return normalizar(texto)
    .split(/\s+/)
    .filter((t) => t && !VACIAS.has(t))
    .map((t) =>
      t.length > 5 && t.endsWith('es')
        ? t.slice(0, -2)
        : t.length > 4 && t.endsWith('s')
          ? t.slice(0, -1)
          : t
    )
}

const BIBLIOTECA = [...EJERCICIOS, ...MOVILIDAD, ...ESTIRAMIENTOS]
  .filter((x) => x.demo)
  .map((x) => ({
    codigo: x.codigo,
    demo: x.demo,
    nombreNorm: normalizar(x.nombre),
    tokens: new Set(tokens(x.nombre)),
  }))

const POR_CODIGO = new Map(BIBLIOTECA.map((x) => [x.codigo, x]))

// Nombres habituales del motor anterior que no coinciden por palabras
const ALIAS = [
  [/remo.*polea|polea baja/, 'remo_sentado'],
  [/jalon.*triceps|triceps.*polea|pushdown/, 'jalon_triceps_barra'],
  [/curl.*barra/, 'curl_barra_z'],
  [/abdominal|crunch/, 'crunch'],
  [/bicicleta|spinning/, 'bicicleta'],
  [/eliptica/, 'eliptica'],
  [/trote|correr|caminar|caminadora|cinta/, 'caminadora_inclinada'],
  [/lumbar|hiperextension|silla romana/, 'hiperextension_silla_romana'],
  [/dominada/, 'dominadas'],
  [/sentadilla/, 'sentadilla_goblet'],
]
const cache = new Map()

function rutas(demo) {
  return [`/ejercicios/${demo}/0.webp`, `/ejercicios/${demo}/1.webp`]
}

function buscarPorNombre(nombre) {
  const clave = normalizar(nombre)
  if (!clave) return null
  if (cache.has(clave)) return cache.get(clave)

  const exacto = BIBLIOTECA.find((x) => x.nombreNorm === clave)
  if (exacto) {
    cache.set(clave, exacto.demo)
    return exacto.demo
  }

  const t = new Set(tokens(nombre))
  let mejor = null
  let puntaje = 0
  for (const x of BIBLIOTECA) {
    let comunes = 0
    for (const tk of t) if (x.tokens.has(tk)) comunes++
    const union = new Set([...t, ...x.tokens]).size || 1
    const p = comunes / union
    if (p > puntaje) {
      puntaje = p
      mejor = x
    }
  }

  let demo = puntaje >= 0.5 ? mejor.demo : null
  if (!demo) {
    const alias = ALIAS.find(([re]) => re.test(clave))
    if (alias) demo = POR_CODIGO.get(alias[1])?.demo || null
  }
  cache.set(clave, demo)
  return demo
}

/** Devuelve la lista de fotogramas a mostrar para un ejercicio. */
export function imagenesDeEjercicio(ejercicio) {
  if (!ejercicio) return []
  if (Array.isArray(ejercicio.imagenes) && ejercicio.imagenes.length) return ejercicio.imagenes.filter(Boolean)

  const url = ejercicio.imagen_url
  if (url && !/^\/ejercicios\//.test(url)) return [url]

  const porCodigo = POR_CODIGO.get(ejercicio.codigo)
  if (porCodigo) return rutas(porCodigo.demo)

  const demo = buscarPorNombre(ejercicio.nombre || ejercicio.nombre_programado || ejercicio.nombre_realizado)
  if (demo) return rutas(demo)

  return url ? [url] : []
}
