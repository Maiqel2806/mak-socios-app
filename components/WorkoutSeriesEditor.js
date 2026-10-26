'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Save,
} from 'lucide-react'

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
}) {
  const total = Number(ejercicio?.series_objetivo)

  const cantidadValida =
    Number.isSafeInteger(total) &&
    total >= 1 &&
    total <= 30

  const actividad = esActividadPorTiempo(ejercicio)

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

      if (
        peso !== null &&
        Math.abs(peso / 2.5 - Math.round(peso / 2.5)) >
          0.0000001
      ) {
        setErrores((actual) => ({
          ...actual,
          [fila.numero]:
            'El peso debe ser múltiplo de 2,5 kg: 20, 22,5, 25, 27,5, 30...',
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
          peso_kg: peso,
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
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {actividad
                  ? 'Marca la actividad cuando la hayas realizado. No se registran tiempos individuales.'
                  : 'Introduce el peso realmente utilizado y las repeticiones de cada serie. Usa incrementos de 2,5 kg.'}
              </p>

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

                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="2.5"
                          placeholder="0"
                          value={fila.peso}
                          disabled={guardando !== null}
                          onChange={(e) =>
                            cambiar(fila.numero, 'peso', e.target.value)
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-base font-bold tabular-nums text-zinc-950 outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/15 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                        />
                      </label>

                      <label>
                        <span className="mb-1.5 block text-xs font-bold text-zinc-500 dark:text-zinc-400">
                          Repeticiones
                        </span>

                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          placeholder="12"
                          value={fila.reps}
                          disabled={guardando !== null}
                          onChange={(e) =>
                            cambiar(fila.numero, 'reps', e.target.value)
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-base font-bold tabular-nums text-zinc-950 outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/15 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                        />
                      </label>

                    </div>
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
