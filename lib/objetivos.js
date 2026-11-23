// Objetivo principal + objetivo secundario opcional.
//
// Como Fitbod, la app pide UN objetivo principal (define series, repeticiones
// y descansos). Como Tonal, permite sumar un enfoque secundario que ajusta la
// rutina sin diluir lo principal.
//
// El secundario se guarda como una línea en `observaciones`
// ("Objetivo secundario: Reducir grasa") para no cambiar las funciones SQL.

export const OBJETIVOS = [
  { valor: 'bajar_grasa', titulo: 'Reducir grasa', detalle: 'Más gasto calórico, circuitos y cardio.' },
  { valor: 'ganar_musculo', titulo: 'Ganar músculo', detalle: 'Volumen de 8 a 12 repeticiones.' },
  { valor: 'fuerza', titulo: 'Aumentar fuerza', detalle: 'Básicos pesados, descansos largos.' },
  { valor: 'tonificacion', titulo: 'Tonificación', detalle: 'Músculo firme y definición.' },
  { valor: 'resistencia', titulo: 'Mejorar resistencia', detalle: 'Más repeticiones y menos pausa.' },
  { valor: 'mantenerse', titulo: 'Mantenerme activo', detalle: 'Equilibrio y salud general.' },
]

// "Mantenerme activo" no tiene sentido como enfoque adicional
export const SECUNDARIOS_VALIDOS = ['bajar_grasa', 'ganar_musculo', 'fuerza', 'tonificacion', 'resistencia']

const MARCA = 'Objetivo secundario:'

export function tituloObjetivo(valor) {
  return OBJETIVOS.find((o) => o.valor === valor)?.titulo || ''
}

/** Separa el objetivo secundario del resto de observaciones. */
export function extraerSecundario(observaciones) {
  const lineas = String(observaciones || '').split('\n')
  let secundario = ''
  const resto = []
  for (const linea of lineas) {
    if (linea.trim().startsWith(MARCA)) {
      const titulo = linea.replace(MARCA, '').trim().toLowerCase()
      secundario = OBJETIVOS.find((o) => o.titulo.toLowerCase() === titulo)?.valor || ''
    } else {
      resto.push(linea)
    }
  }
  return { secundario, resto: resto.join('\n').trim() }
}

/** Añade (o quita) la línea del objetivo secundario. */
export function conSecundario(observaciones, secundario, principal) {
  const { resto } = extraerSecundario(observaciones)
  if (!secundario || secundario === principal || !SECUNDARIOS_VALIDOS.includes(secundario)) return resto
  return [resto, `${MARCA} ${tituloObjetivo(secundario)}`].filter(Boolean).join('\n')
}
