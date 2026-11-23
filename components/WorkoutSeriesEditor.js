'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Save,
  Copy,
  Minus,
  Plus,
} from 'lucide-react'

import {
  limpiarDecimal,
  redondear,
} from '@/lib/numeros'

import {
  resumenSeries,
  sugerirCarga,
  unoRM,
} from '@/lib/progresion'

import {
  avisarDescanso,
  avisarRecord,
} from './RestTimer'

// Cualquier peso es válido (máquinas en múltiplos de 2,5 kg, 3 kg,
// mancuernas de 1 kg, etc.). El incremento solo se usa para los
// botones + / − y puede venir definido por ejercicio/máquina.
const PESO_MAXIMO_KG = 500
const INCREMENTO_POR_DEFECTO_KG = 2.5

function incrementoDe(ejercicio) {
  const valor = Number(ejercicio?.incremento_kg)
  return Number.isFinite(valor) && valor > 0
    ? valor
    : INCREMENTO_POR_DEFECTO_KG
}

function esActividadPorTiempo(ejercicio) {
  const objetivo = String(
    ejercicio?.repeticiones_objetivo || ''
  )

  return (
    /(^|[^a-z])(seg|segundos|min|minutos)($|[^a-z])/i.test(objetivo) ||
    String(ejercicio?.grupo_muscular || '').toLowerCase() === 'cardio'
  )
}

function texto(valor) {
  return valor === null || valor === undefined
    ? ''
    : String(valor)
}

function inicializarFilas(ejercicio, total) {
  const guardadas = Array.isArray(ejercicio?.series)
    ? ejercicio.series
    : []

  return Array.from({ length: total }, (_, indice) => {
    const numero = indice + 1
    const guardada = guardadas.find(
      (item) => Number(item.numero_serie) === numero
    )

    return {
      numero,
      peso: texto(guardada?.peso_kg),
      reps: texto(guardada?.repeticiones),
      completada: Boolean(guardada?.completada),
      modificada: false,
    }
  })
}

function numero(valor, entero = false) {
  const normalizado = String(valor ?? '')
    .trim()
    .replace(',', '.')

  if (!normalizado) return null

  const resultado = Number(normalizado)

  if (
    !Number.isFinite(resultado) ||
    resultado < 0 ||
    (entero && !Number.isSafeInteger(resultado))
  ) return NaN

  return resultado
}

export default function WorkoutSeriesEditor({
  ejercicio,
  abiertoInicial = false,
  onGuardado,
  onEdicionPendiente,
  historial = null,
}) {
  const total = Number(ejercicio?.series_objetivo)

  const cantidadValida =
    Number.isSafeInteger(total) &&
    total >= 1 &&
    total <= 30

  const actividad = esActividadPorTiempo(ejercicio)
  const incremento = incrementoDe(ejercicio)

  const sugerencia = actividad
    ? null
    : sugerirCarga({
        ultimaSesion: historial?.ultima,
        repeticionesObjetivo: ejercicio?.repeticiones_objetivo,
        incremento,
      })

  const pesoSugerido =
    sugerencia && sugerencia.peso !== null && sugerencia.peso !== undefined
      ? String(sugerencia.peso).replace('.', ',')
      : ''

  const [filas, setFilas] = useState(() =>
    inicializarFilas(ejercicio, cantidadValida ? total : 0)
  )

  const [abierto, setAbierto] = useState(abiertoInicial)
  const [guardando, setGuardando] = useState(null)
  const [errores, setErrores] = useState({})

  const completadas = filas.filter(
    (fila) => fila.completada
  ).length

  const pendientes = filas.some(
    (fila) => fila.modificada
  )

  const ejercicioListo =
    cantidadValida &&
    completadas === total &&
    !pendientes

  function cambiar(numeroSerie, campo, valor) {
    if (guardando !== null) return

    setFilas((actual) =>
      actual.map((fila) =>
        fila.numero === numeroSerie
          ? {
              ...fila,
              [campo]: valor,
              modificada: true,
            }
          : fila
      )
    )

    onEdicionPendiente?.(ejercicio.id, true)

    setErrores((actual) => ({
      ...actual,
      [numeroSerie]: '',
    }))
  }

  function ajustarPeso(fila, direccion) {
    const actual = numero(fila.peso)
    const base = Number.isFinite(actual) && actual !== null ? actual : 0
    const siguiente = Math.max(
      0,
      Math.min(PESO_MAXIMO_KG, redondear(base + direccion * incremento, 2))
    )
    cambiar(fila.numero, 'peso', String(siguiente).replace('.', ','))
  }

  function copiarAnterior(fila) {
    const anterior = filas.find((item) => item.numero === fila.numero - 1)
    if (!anterior) return
    setFilas((actual) =>
      actual.map((item) =>
        item.numero === fila.numero
          ? { ...item, peso: anterior.peso, reps: anterior.reps, modificada: true }
          : item
      )
    )
    onEdicionPendiente?.(ejercicio.id, true)
  }

  async function guardarSerie(fila, completar) {
    if (!cantidadValida || guardando !== null) return

    const peso = actividad ? null : numero(fila.peso)
    const reps = actividad ? null : numero(fila.reps, true)

    if (!actividad) {
      if (
        Number.isNaN(peso) ||
        Number.isNaN(reps) ||
        (completar && (peso === null || !(reps > 0)))
      ) {
        setErrores((actual) => ({
          ...actual,
          [fila.numero]:
            'Registra un peso válido y las repeticiones realizadas. Usa 0 kg si no añadiste carga externa.',
        }))
        return
      }

      if (peso !== null && peso > PESO_MAXIMO_KG) {
        setErrores((actual) => ({
          ...actual,
          [fila.numero]: `Revisa el peso: el máximo permitido es ${PESO_MAXIMO_KG} kg.`,
        }))
        return
      }
    }

    setGuardando(fila.numero)
    onEdicionPendiente?.(ejercicio.id, true)

    setErrores((actual) => ({
      ...actual,
      [fila.numero]: '',
    }))

    try {
      const respuesta = await fetch('/api/entrenamiento', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ejercicio_id: ejercicio.id,
          numero_serie: fila.numero,
          peso_kg: peso === null ? null : redondear(peso, 2),
          repeticiones: reps,
          actividad_sin_repeticiones: actividad,
          completada: completar,
        }),
      })

      const data = await respuesta.json().catch(() => null)

      if (!respuesta.ok || data?.ok !== true || !data.serie) {
        throw new Error(
          data?.error || 'No se pudo guardar la serie.'
        )
      }

      setFilas((actual) =>
        actual.map((item) =>
          item.numero === fila.numero
            ? {
                ...item,
                peso: texto(data.serie.peso_kg),
                reps: texto(data.serie.repeticiones),
                completada: Boolean(data.serie.completada),
                modificada: false,
              }
            : item
        )
      )

      // Descanso automático y detección de récord personal
      if (completar && data.serie.completada) {
        const nombre = ejercicio?.nombre_realizado || ''
        const esUltima = fila.numero === total
        if (!esUltima) avisarDescanso(ejercicio?.descanso_seg, nombre)

        const e1rm = unoRM(data.serie.peso_kg, data.serie.repeticiones)
        if (
          historial?.sesiones > 0 &&
          e1rm > (Number(historial?.mejor_e1rm) || 0) + 0.01 &&
          !historial.__recordAvisado
        ) {
          historial.__recordAvisado = true
          avisarRecord({ ejercicio: nombre, peso: data.serie.peso_kg, reps: data.serie.repeticiones })
        }
      }

      if (typeof onGuardado === 'function') {
        await onGuardado()
      }

      onEdicionPendiente?.(ejercicio.id, false)

    } catch (error) {
      setErrores((actual) => ({
        ...actual,
        [fila.numero]:
          error?.message || 'No se pudo guardar el registro.',
      }))
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 dark:border-white/10 dark:bg-white/[0.035]">

      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="mak-interactive flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">

          {ejercicioListo ? (
            <CheckCircle2
              size={22}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />
          ) : (
            <Circle
              size={22}
              className="shrink-0 text-cyan-600 dark:text-cyan-400"
            />
          )}

          <div>
            <p className="text-sm font-black text-zinc-950 dark:text-white">
              {ejercicioListo
                ? 'Ejercicio completado'
                : actividad
                  ? 'Registrar actividad'
                  : 'Registrar series'}
            </p>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {cantidadValida
                ? `${completadas} de ${total} series completadas`
                : 'Series no configuradas'}
            </p>
          </div>
        </div>

        {abierto
          ? <ChevronUp size={20} className="text-zinc-400" />
          : <ChevronDown size={20} className="text-zinc-400" />}
      </button>

      {abierto && (
        <div className="space-y-3 border-t border-zinc-200 p-3 dark:border-white/10 sm:p-4">

          {!cantidadValida && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              El ejercicio no tiene series válidas.
            </p>
          )}

          {cantidadValida && (
            <>
              {!actividad && historial?.ultima ? (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 text-xs leading-5 text-cyan-950 dark:border-cyan-500/20 dark:bg-cyan-500/[0.07] dark:text-cyan-100">
                  <p>
                    <span className="font-bold">Última vez:</span> {resumenSeries(historial.ultima.series)}
                    {historial.mejor_peso > 0 && (
                      <span className="text-cyan-800/70 dark:text-cyan-200/70"> · Mejor: {String(historial.mejor_peso).replace('.', ',')} kg</span>
                    )}
                  </p>
                  {sugerencia && (
                    <p className="mt-1">
                      <span className="font-bold">
                        {sugerencia.tipo === 'subir' ? '↑ ' : sugerencia.tipo === 'bajar' ? '↓ ' : ''}Hoy: {pesoSugerido} kg.
                      </span>{' '}
                      {sugerencia.motivo}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {actividad
                    ? 'Marca la actividad cuando la hayas realizado.'
                    : 'Anota el peso que usaste y tus repeticiones. Puedes escribir cualquier peso (ej. 21, 22,5 o 24 kg). Al completar una serie empieza el descanso.'}
                </p>
              )}

              {filas.map((fila) => (
                <div
                  key={fila.numero}
                  className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-900 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-zinc-950 dark:text-white">
                      {actividad
                        ? `Actividad ${fila.numero}`
                        : `Serie ${fila.numero}`}
                    </p>

                    <span className={`text-xs font-bold ${
                      fila.modificada
                        ? 'text-amber-600'
                        : fila.completada
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                    }`}>
                      {fila.modificada
                        ? 'Sin guardar'
                        : fila.completada
                          ? 'Completada'
                          : 'Pendiente'}
                    </span>
                  </div>

                  {!actividad && (
                    <div className="mt-3 grid grid-cols-2 gap-3">

                      <label>
                        <span className="mb-1.5 block text-xs font-bold text-zinc-500 dark:text-zinc-400">
                          Peso (kg)
                        </span>

                        <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus-within:border-[#02AFBB] focus-within:ring-2 focus-within:ring-cyan-500/15 dark:border-white/10 dark:bg-zinc-800">
                          <button
                            type="button"
                            aria-label={`Restar ${String(incremento).replace('.', ',')} kg`}
                            disabled={guardando !== null}
                            onClick={() => ajustarPeso(fila, -1)}
                            className="mak-interactive grid w-10 shrink-0 place-items-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/5"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder={pesoSugerido || '0'}
                            value={fila.peso}
                            disabled={guardando !== null}
                            onChange={(e) =>
                              cambiar(fila.numero, 'peso', limpiarDecimal(e.target.value, 2))
                            }
                            className="min-w-0 flex-1 bg-transparent text-center text-base font-bold tabular-nums text-zinc-950 outline-none disabled:opacity-50 dark:text-white"
                          />
                          <button
                            type="button"
                            aria-label={`Sumar ${String(incremento).replace('.', ',')} kg`}
                            disabled={guardando !== null}
                            onClick={() => ajustarPeso(fila, 1)}
                            className="mak-interactive grid w-10 shrink-0 place-items-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/5"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </label>

                      <label>
                        <span className="mb-1.5 block text-xs font-bold text-zinc-500 dark:text-zinc-400">
                          Repeticiones
                        </span>

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="12"
                          value={fila.reps}
                          disabled={guardando !== null}
                          onChange={(e) =>
                            cambiar(fila.numero, 'reps', limpiarDecimal(e.target.value, 0).slice(0, 3))
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-base font-bold tabular-nums text-zinc-950 outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/15 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                        />
                      </label>

                    </div>
                  )}

                  {!actividad &&
                    pesoSugerido &&
                    !fila.completada &&
                    !fila.peso &&
                    !(fila.numero > 1 && (filas[fila.numero - 2]?.peso || filas[fila.numero - 2]?.reps)) && (
                      <button
                        type="button"
                        disabled={guardando !== null}
                        onClick={() => cambiar(fila.numero, 'peso', pesoSugerido)}
                        className="mak-interactive mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#028894] hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
                      >
                        Usar peso sugerido ({pesoSugerido} kg)
                      </button>
                    )}

                  {!actividad &&
                    fila.numero > 1 &&
                    !fila.completada &&
                    !fila.peso &&
                    !fila.reps &&
                    (filas[fila.numero - 2]?.peso || filas[fila.numero - 2]?.reps) && (
                      <button
                        type="button"
                        disabled={guardando !== null}
                        onClick={() => copiarAnterior(fila)}
                        className="mak-interactive mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#028894] hover:bg-cyan-50 disabled:opacity-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
                      >
                        <Copy size={13} />
                        Igual que la serie {fila.numero - 1}
                        {filas[fila.numero - 2]?.peso ? ` (${filas[fila.numero - 2].peso} kg)` : ''}
                      </button>
                    )}

                  {errores[fila.numero] && (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300"
                    >
                      {errores[fila.numero]}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={guardando !== null}
                      onClick={() => guardarSerie(fila, true)}
                      className="mak-interactive flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#02AFBB] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Save size={16}/>

                      {guardando === fila.numero
                        ? 'Guardando...'
                        : fila.completada
                          ? 'Guardar cambios'
                          : actividad
                            ? 'Marcar realizada'
                            : 'Completar serie'}
                    </button>

                    {fila.completada && (
                      <button
                        type="button"
                        disabled={guardando !== null}
                        onClick={() => guardarSerie(fila, false)}
                        className="mak-interactive min-h-11 rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-bold text-zinc-600 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}
