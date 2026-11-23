// Utilidades numéricas compartidas (cliente y servidor).
// Aceptan coma o punto como separador decimal: en teclados de
// Ecuador/Latam el decimal suele salir como coma y los
// <input type="number"> lo rechazaban o lo convertían en vacío.

/**
 * Limpia lo que el usuario escribe en un campo decimal.
 * - Solo dígitos y un separador (coma o punto).
 * - Limita la cantidad de decimales.
 * Devuelve el texto tal como debe verse en el input.
 */
export function limpiarDecimal(valor, maxDecimales = 2) {
  let texto = String(valor ?? '')
    .replace(/\s+/g, '')
    .replace(/[^0-9.,]/g, '')

  const indice = texto.search(/[.,]/)

  if (indice === -1) {
    return texto.slice(0, 6)
  }

  const entero = texto.slice(0, indice).slice(0, 4)
  const separador = texto[indice]
  const decimales = texto
    .slice(indice + 1)
    .replace(/[.,]/g, '')
    .slice(0, maxDecimales)

  if (maxDecimales === 0) {
    return entero
  }

  return `${entero}${separador}${decimales}`
}

/**
 * Convierte texto con coma o punto a Number.
 * '' / null / undefined -> null ; texto inválido -> NaN
 */
export function aNumero(valor) {
  if (valor === null || valor === undefined) return null

  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : NaN
  }

  const texto = String(valor).trim().replace(',', '.')

  if (!texto) return null
  if (!/^-?\d+(\.\d+)?$/.test(texto) && !/^-?\d+\.$/.test(texto)) {
    return NaN
  }

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : NaN
}

/** Redondea a n decimales evitando errores de coma flotante. */
export function redondear(numero, decimales = 2) {
  const factor = 10 ** decimales
  return Math.round((Number(numero) + Number.EPSILON) * factor) / factor
}

/** Muestra un número con coma decimal (es-EC) sin ceros sobrantes. */
export function mostrarDecimal(numero, decimales = 2) {
  if (numero === null || numero === undefined || numero === '') return ''
  const n = Number(numero)
  if (!Number.isFinite(n)) return ''
  return redondear(n, decimales).toLocaleString('es-EC', {
    maximumFractionDigits: decimales,
  })
}
