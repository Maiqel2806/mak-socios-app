'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  TimerReset,
} from 'lucide-react'


function dosDigitos(valor) {
  return String(valor).padStart(
    2,
    '0'
  )
}


function formatoTiempo(segundos) {
  const total =
    Math.max(
      0,
      Number(segundos || 0)
    )

  const horas =
    Math.floor(
      total / 3600
    )

  const minutos =
    Math.floor(
      (total % 3600) / 60
    )

  const segundosRestantes =
    total % 60

  if (horas > 0) {
    return `${dosDigitos(horas)}:${dosDigitos(
      minutos
    )}:${dosDigitos(segundosRestantes)}`
  }

  return `${dosDigitos(
    minutos
  )}:${dosDigitos(segundosRestantes)}`
}


function esTemporal(
  ejercicio
) {
  const texto =
    String(
      ejercicio
        ?.repeticiones_objetivo ||
        ''
    ).toLowerCase()

  return (
    texto.includes(' seg') ||
    texto.includes('min')
  )
}


function usaMinutos(
  ejercicio
) {
  return String(
    ejercicio
      ?.repeticiones_objetivo ||
      ''
  )
    .toLowerCase()
    .includes('min')
}


export default function WorkoutExecutionView({
  entrenamiento,
  onSalir,
  onFinalizado,
}) {
  const [
    sesion,
    setSesion,
  ] =
    useState(entrenamiento)

  const [
    indice,
    setIndice,
  ] =
    useState(0)

  const [
    ahora,
    setAhora,
  ] =
    useState(Date.now())

  const [
    capturas,
    setCapturas,
  ] =
    useState({})

  const [
    guardando,
    setGuardando,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    descanso,
    setDescanso,
  ] =
    useState(0)

  const [
    rpe,
    setRpe,
  ] =
    useState(7)


  useEffect(() => {
    const timer =
      setInterval(
        () => {
          setAhora(
            Date.now()
          )
        },
        1000
      )

    return () =>
      clearInterval(timer)
  }, [])


  useEffect(() => {
    if (descanso <= 0) {
      return
    }

    const timer =
      setInterval(
        () => {
          setDescanso(
            (actual) =>
              actual <= 1
                ? 0
                : actual - 1
          )
        },
        1000
      )

    return () =>
      clearInterval(timer)
  }, [descanso])


  useEffect(() => {
    const ejercicios =
      sesion?.ejercicios || []

    const primeroPendiente =
      ejercicios.findIndex(
        (item) =>
          !item?.completado
      )

    if (
      primeroPendiente >= 0
    ) {
      setIndice(
        primeroPendiente
      )
    }
  }, [])


  const ejercicios =
    Array.isArray(
      sesion?.ejercicios
    )
      ? sesion.ejercicios
      : []


  const ejercicio =
    ejercicios[indice] ||
    null


  const segundosTranscurridos =
    Math.max(
      0,
      Math.floor(
        (
          ahora -
          new Date(
            sesion?.fecha_inicio
          ).getTime()
        ) /
        1000
      )
    )


  const completados =
    ejercicios.filter(
      (item) =>
        item?.completado
    ).length


  const progreso =
    ejercicios.length > 0
      ? Math.round(
          (
            completados /
            ejercicios.length
          ) * 100
        )
      : 0


  const todoCompletado =
    ejercicios.length > 0 &&
    completados ===
      ejercicios.length


  const seriesObjetivo =
    Math.max(
      1,
      Number(
        ejercicio
          ?.series_objetivo ||
        1
      )
    )


  const seriesGuardadas =
    Array.isArray(
      ejercicio?.series
    )
      ? ejercicio.series
      : []


  const cantidadSeriesGuardadas =
    seriesGuardadas.filter(
      (item) =>
        item?.completada
    ).length


  const puedeCompletar =
    cantidadSeriesGuardadas >=
    seriesObjetivo


  const temporal =
    esTemporal(
      ejercicio
    )

  const temporalMinutos =
    usaMinutos(
      ejercicio
    )


  const serieMap =
    useMemo(
      () => {
        const resultado = {}

        for (
          const serie
          of seriesGuardadas
        ) {
          resultado[
            serie.numero_serie
          ] = serie
        }

        return resultado
      },
      [seriesGuardadas]
    )


  function valorCampo(
    numero,
    campo
  ) {
    const clave =
      `${ejercicio?.id}:${numero}`

    if (
      capturas[clave] &&
      capturas[clave][campo] !==
        undefined
    ) {
      return capturas[
        clave
      ][campo]
    }

    const guardada =
      serieMap[numero]

    if (!guardada) {
      return ''
    }

    if (
      campo ===
      'duracion'
    ) {
      if (
        guardada.duracion_seg ===
        null ||
        guardada.duracion_seg ===
        undefined
      ) {
        return ''
      }

      return temporalMinutos
        ? Number(
            guardada.duracion_seg
          ) / 60
        : guardada.duracion_seg
    }

    return (
      guardada[campo] ??
      ''
    )
  }


  function cambiarCampo(
    numero,
    campo,
    valor
  ) {
    const clave =
      `${ejercicio?.id}:${numero}`

    setCapturas(
      (actual) => ({
        ...actual,

        [clave]: {
          ...(
            actual[clave] ||
            {}
          ),

          [campo]:
            valor,
        },
      })
    )
  }


  async function actualizar(
    payload
  ) {
    setGuardando(true)
    setError('')

    try {
      const respuesta =
        await fetch(
          '/api/entrenamiento',
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        )

      const data =
        await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          data?.error ||
          'No fue posible guardar.'
        )
      }

      if (
        data?.entrenamiento
      ) {
        setSesion(
          data.entrenamiento
        )
      }

      return data

    } catch (
      errorPeticion
    ) {
      setError(
        errorPeticion?.message ||
        'No fue posible guardar.'
      )

      return null

    } finally {
      setGuardando(false)
    }
  }


  async function guardarSerie(
    numero
  ) {
    const peso =
      valorCampo(
        numero,
        'peso_kg'
      )

    const reps =
      valorCampo(
        numero,
        'repeticiones'
      )

    const rirSerie =
      valorCampo(
        numero,
        'rir'
      )

    const duracion =
      valorCampo(
        numero,
        'duracion'
      )


    if (
      temporal &&
      (
        duracion === '' ||
        Number(duracion) <= 0
      )
    ) {
      setError(
        'Registra la duración de la serie.'
      )
      return
    }


    if (
      !temporal &&
      (
        reps === '' ||
        Number(reps) <= 0
      )
    ) {
      setError(
        'Registra las repeticiones realizadas.'
      )
      return
    }


    const resultado =
      await actualizar({
        accion:
          'serie',

        entrenamiento_ejercicio_id:
          ejercicio.id,

        numero_serie:
          numero,

        peso_kg:
          temporal
            ? null
            : peso,

        repeticiones:
          temporal
            ? null
            : reps,

        duracion_seg:
          temporal
            ? (
                temporalMinutos
                  ? Math.round(
                      Number(
                        duracion
                      ) * 60
                    )
                  : Math.round(
                      Number(
                        duracion
                      )
                    )
              )
            : null,

        rir:
          temporal
            ? null
            : rirSerie,
      })


    if (
      resultado &&
      Number(
        ejercicio
          ?.descanso_seg ||
        0
      ) > 0 &&
      numero <
        seriesObjetivo
    ) {
      setDescanso(
        Number(
          ejercicio
            .descanso_seg
        )
      )
    }
  }


  async function completarEjercicio() {
    if (!puedeCompletar) {
      setError(
        'Completa las series programadas antes de continuar.'
      )
      return
    }

    const resultado =
      await actualizar({
        accion:
          'completar_ejercicio',

        entrenamiento_ejercicio_id:
          ejercicio.id,
      })

    if (!resultado) {
      return
    }

    const actualizados =
      resultado
        ?.entrenamiento
        ?.ejercicios ||
      []

    const siguiente =
      actualizados.findIndex(
        (
          item,
          posicion
        ) =>
          posicion >
            indice &&
          !item?.completado
      )

    if (
      siguiente >= 0
    ) {
      setIndice(
        siguiente
      )
      setDescanso(0)
    }
  }


  async function finalizar() {
    setGuardando(true)
    setError('')

    try {
      const respuesta =
        await fetch(
          '/api/entrenamiento',
          {
            method:
              'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                accion:
                  'finalizar',

                entrenamiento_id:
                  sesion
                    ?.entrenamiento_id,

                duracion_seg:
                  segundosTranscurridos,

                rpe,
              }),
          }
        )

      const data =
        await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          data?.error ||
          'No fue posible finalizar.'
        )
      }

      onFinalizado?.()

    } catch (
      errorPeticion
    ) {
      setError(
        errorPeticion?.message ||
        'No fue posible finalizar.'
      )

    } finally {
      setGuardando(false)
    }
  }


  if (!ejercicio) {
    return null
  }


  return (
    <div className="min-h-[70vh] bg-white dark:bg-zinc-950">

      {/* CABECERA */}
      <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">

          <button
            type="button"
            onClick={onSalir}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300"
            aria-label="Volver a la rutina"
          >
            <ArrowLeft
              size={19}
            />
          </button>


          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-black text-zinc-950 dark:text-white">
              {sesion?.nombre_dia}
            </p>

            <p className="mt-0.5 text-xs text-zinc-500">
              {completados} de {ejercicios.length} ejercicios
            </p>

          </div>


          <div className="flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-white dark:bg-white dark:text-zinc-950">

            <Clock3
              size={15}
            />

            <span className="font-mono text-sm font-black">
              {formatoTiempo(
                segundosTranscurridos
              )}
            </span>

          </div>

        </div>


        <div className="mx-auto mt-3 h-2 max-w-3xl overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">

          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{
              width:
                `${progreso}%`,
            }}
          />

        </div>

      </div>


      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">

        {/* DESCANSO */}
        {descanso > 0 && (

          <div className="mb-4 flex items-center justify-between rounded-2xl bg-cyan-50 p-4 text-cyan-950 dark:bg-cyan-500/10 dark:text-cyan-100">

            <div className="flex items-center gap-3">

              <TimerReset
                size={22}
              />

              <div>

                <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                  Descanso
                </p>

                <p className="text-2xl font-black">
                  {formatoTiempo(
                    descanso
                  )}
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                setDescanso(0)
              }
              className="rounded-xl border border-cyan-200 px-3 py-2 text-xs font-black dark:border-cyan-500/20"
            >
              Omitir
            </button>

          </div>

        )}


        {/* EJERCICIO */}
        <div className="rounded-3xl border border-zinc-200 p-5 dark:border-white/10 sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">

              <Dumbbell
                size={20}
              />

            </div>


            <div className="min-w-0">

              <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400">
                Ejercicio {indice + 1} de {ejercicios.length}
              </p>

              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                {ejercicio
                  ?.nombre_realizado}
              </h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {ejercicio
                  ?.grupo_muscular}

                {ejercicio
                  ?.equipamiento
                  ? ` · ${ejercicio.equipamiento}`
                  : ''}
              </p>

            </div>

          </div>


          <div className="mt-4 grid grid-cols-3 gap-2">

            <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

              <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                Series
              </p>

              <p className="mt-1 font-black">
                {seriesObjetivo}
              </p>

            </div>


            <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

              <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                Objetivo
              </p>

              <p className="mt-1 font-black">
                {ejercicio
                  ?.repeticiones_objetivo ||
                  '—'}
              </p>

            </div>


            <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

              <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                Descanso
              </p>

              <p className="mt-1 font-black">
                {ejercicio
                  ?.descanso_seg || 0}s
              </p>

            </div>

          </div>


          {ejercicio
            ?.intensidad && (

            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-bold leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              {ejercicio.intensidad}
            </p>

          )}

        </div>


        {/* SERIES */}
        <div className="mt-4 space-y-3">

          {Array.from({
            length:
              seriesObjetivo,
          }).map(
            (_, posicion) => {

              const numero =
                posicion + 1

              const guardada =
                Boolean(
                  serieMap[
                    numero
                  ]?.completada
                )

              return (

                <div
                  key={numero}
                  className={
                    guardada
                      ? 'rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                      : 'rounded-2xl border border-zinc-200 p-4 dark:border-white/10'
                  }
                >

                  <div className="mb-3 flex items-center justify-between">

                    <p className="font-black">
                      Serie {numero}
                    </p>

                    {guardada && (

                      <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                        <Check
                          size={15}
                        />
                        Guardada
                      </span>

                    )}

                  </div>


                  {temporal ? (

                    <div className="grid grid-cols-[1fr_auto] gap-2">

                      <label>

                        <span className="mb-1 block text-[10px] font-black uppercase text-zinc-400">
                          Duración ({temporalMinutos ? 'min' : 'seg'})
                        </span>

                        <input
                          type="number"
                          min="0"
                          step={
                            temporalMinutos
                              ? '0.5'
                              : '1'
                          }
                          value={
                            valorCampo(
                              numero,
                              'duracion'
                            )
                          }
                          onChange={(e) =>
                            cambiarCampo(
                              numero,
                              'duracion',
                              e.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-center text-lg font-black outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-900"
                        />

                      </label>


                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() =>
                          guardarSerie(
                            numero
                          )
                        }
                        className="mt-5 h-12 rounded-xl bg-zinc-950 px-4 font-black text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                      >
                        <Check
                          size={18}
                        />
                      </button>

                    </div>

                  ) : (

                    <div className="grid grid-cols-[1fr_1fr_0.8fr_auto] gap-2">

                      <label>

                        <span className="mb-1 block text-center text-[9px] font-black uppercase text-zinc-400">
                          kg
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          inputMode="decimal"
                          value={
                            valorCampo(
                              numero,
                              'peso_kg'
                            )
                          }
                          onChange={(e) =>
                            cambiarCampo(
                              numero,
                              'peso_kg',
                              e.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-2 text-center font-black outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-900"
                        />

                      </label>


                      <label>

                        <span className="mb-1 block text-center text-[9px] font-black uppercase text-zinc-400">
                          Reps
                        </span>

                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={
                            valorCampo(
                              numero,
                              'repeticiones'
                            )
                          }
                          onChange={(e) =>
                            cambiarCampo(
                              numero,
                              'repeticiones',
                              e.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-2 text-center font-black outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-900"
                        />

                      </label>


                      <label>

                        <span className="mb-1 block text-center text-[9px] font-black uppercase text-zinc-400">
                          RIR
                        </span>

                        <input
                          type="number"
                          min="0"
                          max="10"
                          inputMode="numeric"
                          value={
                            valorCampo(
                              numero,
                              'rir'
                            )
                          }
                          onChange={(e) =>
                            cambiarCampo(
                              numero,
                              'rir',
                              e.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-2 text-center font-black outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-900"
                        />

                      </label>


                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() =>
                          guardarSerie(
                            numero
                          )
                        }
                        className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                        aria-label={`Guardar serie ${numero}`}
                      >
                        <Check
                          size={18}
                        />
                      </button>

                    </div>

                  )}

                </div>

              )
            }
          )}

        </div>


        {error && (

          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>

        )}


        {/* NAVEGACIÓN */}
        <div className="mt-5 flex gap-2">

          <button
            type="button"
            disabled={
              indice === 0
            }
            onClick={() =>
              setIndice(
                Math.max(
                  0,
                  indice - 1
                )
              )
            }
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 disabled:opacity-30 dark:border-white/10"
          >
            <ChevronLeft
              size={20}
            />
          </button>


          {!ejercicio
            ?.completado ? (

            <button
              type="button"
              disabled={
                !puedeCompletar ||
                guardando
              }
              onClick={
                completarEjercicio
              }
              className="mak-interactive flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-black text-white disabled:opacity-40"
            >
              Completar ejercicio
              <ChevronRight
                size={18}
              />
            </button>

          ) : (

            <button
              type="button"
              disabled={
                indice >=
                ejercicios.length - 1
              }
              onClick={() =>
                setIndice(
                  Math.min(
                    ejercicios.length - 1,
                    indice + 1
                  )
                )
              }
              className="mak-interactive flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-zinc-950"
            >
              Siguiente ejercicio
              <ChevronRight
                size={18}
              />
            </button>

          )}

        </div>


        {/* FINALIZACIÓN */}
        {todoCompletado && (

          <div className="mt-6 rounded-3xl bg-zinc-950 p-5 text-white dark:bg-white dark:text-zinc-950">

            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-60">
              Entrenamiento completado
            </p>

            <h3 className="mt-1 text-xl font-black">
              ¿Qué tan exigente fue?
            </h3>

            <p className="mt-2 text-sm opacity-70">
              1 = muy fácil · 10 = esfuerzo máximo
            </p>


            <div className="mt-4 grid grid-cols-5 gap-2">

              {Array.from({
                length: 10,
              }).map(
                (_, posicion) => {

                  const valor =
                    posicion + 1

                  return (

                    <button
                      key={valor}
                      type="button"
                      onClick={() =>
                        setRpe(
                          valor
                        )
                      }
                      className={
                        valor === rpe
                          ? 'h-10 rounded-xl bg-cyan-500 text-sm font-black text-white'
                          : 'h-10 rounded-xl bg-white/10 text-sm font-black dark:bg-zinc-950/10'
                      }
                    >
                      {valor}
                    </button>

                  )
                }
              )}

            </div>


            <button
              type="button"
              disabled={guardando}
              onClick={finalizar}
              className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3.5 font-black text-white disabled:opacity-50"
            >
              Finalizar entrenamiento
            </button>

          </div>

        )}

      </div>

    </div>
  )
}
