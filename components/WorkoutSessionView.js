'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  X,
} from 'lucide-react'


function formatoTiempo(segundos) {
  const total =
    Math.max(
      0,
      Number(segundos || 0)
    )

  const horas =
    Math.floor(total / 3600)

  const minutos =
    Math.floor(
      (total % 3600) / 60
    )

  const segundosRestantes =
    total % 60

  if (horas > 0) {
    return [
      horas,
      minutos,
      segundosRestantes,
    ]
      .map(
        (valor) =>
          String(valor).padStart(2, '0')
      )
      .join(':')
  }

  return [
    minutos,
    segundosRestantes,
  ]
    .map(
      (valor) =>
        String(valor).padStart(2, '0')
    )
    .join(':')
}


export default function WorkoutSessionView({
  entrenamiento,
  rutinaDia,
  onCerrar,
}) {

  const ejercicios =
    Array.isArray(
      entrenamiento?.ejercicios
    )
      ? entrenamiento.ejercicios
      : []


  const primerPendiente =
    ejercicios.findIndex(
      (ejercicio) =>
        !ejercicio?.completado
    )


  const [
    indiceActivo,
    setIndiceActivo,
  ] = useState(
    primerPendiente >= 0
      ? primerPendiente
      : 0
  )


  const [
    segundosTranscurridos,
    setSegundosTranscurridos,
  ] = useState(0)


  useEffect(
    () => {

      function actualizarTiempo() {
        if (
          !entrenamiento?.fecha_inicio
        ) {
          setSegundosTranscurridos(0)
          return
        }

        const inicio =
          new Date(
            entrenamiento.fecha_inicio
          ).getTime()

        const ahora =
          Date.now()

        setSegundosTranscurridos(
          Math.max(
            0,
            Math.floor(
              (ahora - inicio) / 1000
            )
          )
        )
      }

      actualizarTiempo()

      const timer =
        setInterval(
          actualizarTiempo,
          1000
        )

      return () =>
        clearInterval(timer)

    },
    [
      entrenamiento?.fecha_inicio,
    ]
  )


  useEffect(
    () => {

      const pendiente =
        ejercicios.findIndex(
          (ejercicio) =>
            !ejercicio?.completado
        )

      setIndiceActivo(
        pendiente >= 0
          ? pendiente
          : 0
      )

    },
    [
      entrenamiento
        ?.entrenamiento_id,
    ]
  )


  const ejercicio =
    ejercicios[
      indiceActivo
    ] ||
    null


  const total =
    ejercicios.length


  const progreso =
    total > 0
      ? (
          (
            indiceActivo + 1
          )
          /
          total
        ) * 100
      : 0


  if (
    typeof document ===
    'undefined'
  ) {
    return null
  }


  return createPortal(

    <div className="fixed inset-0 z-[1200] flex flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="shrink-0 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">

          <div className="min-w-0">

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              Entrenamiento en curso
            </p>

            <h2 className="mt-0.5 truncate text-lg font-black sm:text-xl">
              {entrenamiento
                ?.nombre_dia ||
                'Entrenamiento MAK'}
            </h2>

          </div>


          <div className="flex items-center gap-2">

            <div className="flex h-10 items-center gap-2 rounded-xl bg-zinc-100 px-3 font-black tabular-nums dark:bg-white/[0.06]">

              <Clock3
                size={16}
                className="text-cyan-600 dark:text-cyan-400"
              />

              <span>
                {formatoTiempo(
                  segundosTranscurridos
                )}
              </span>

            </div>


            <button
              type="button"
              onClick={onCerrar}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition active:scale-95 dark:bg-white/[0.06] dark:text-zinc-300"
              aria-label="Cerrar entrenamiento"
            >
              <X size={19} />
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          PROGRESO
      ====================================================== */}

      <div className="shrink-0 bg-white px-4 pb-3 dark:bg-zinc-950 sm:px-6">

        <div className="mx-auto max-w-3xl">

          <div className="flex items-center justify-between py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">

            <span>
              Ejercicio {
                Math.min(
                  indiceActivo + 1,
                  total
                )
              } de {total}
            </span>

            <span>
              Día {
                entrenamiento?.dia
              }
            </span>

          </div>


          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">

            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-300"
              style={{
                width:
                  `${progreso}%`,
              }}
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">

        <div className="mx-auto max-w-3xl">

          {rutinaDia
            ?.calentamiento && (

            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">

              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-300">
                Calentamiento · {
                  rutinaDia
                    .calentamiento
                    .duracion_min
                } min
              </p>

              <p className="mt-1 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
                {
                  rutinaDia
                    .calentamiento
                    .indicacion
                }
              </p>

            </div>

          )}


          {!ejercicio ? (

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-white/[0.04]">

              <Dumbbell
                size={34}
                className="mx-auto text-zinc-300"
              />

              <p className="mt-3 font-black">
                No hay ejercicios disponibles
              </p>

            </div>

          ) : (

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black text-white dark:bg-white dark:text-zinc-950">
                  {indiceActivo + 1}
                </div>


                <div className="min-w-0 flex-1">

                  <p className="text-xl font-black leading-tight sm:text-2xl">
                    {
                      ejercicio
                        ?.nombre_realizado
                    }
                  </p>

                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">

                    {
                      ejercicio
                        ?.grupo_muscular
                    }

                    {
                      ejercicio
                        ?.equipamiento
                        ? ` · ${ejercicio.equipamiento}`
                        : ''
                    }

                  </p>

                </div>

              </div>


              <div className="mt-5 grid grid-cols-3 gap-2">

                <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                  <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Series
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {
                      ejercicio
                        ?.series_objetivo ??
                      '—'
                    }
                  </p>

                </div>


                <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                  <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Reps
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {
                      ejercicio
                        ?.repeticiones_objetivo ||
                      '—'
                    }
                  </p>

                </div>


                <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                  <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                    Descanso
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {
                      ejercicio
                        ?.descanso_seg ??
                      0
                    }s
                  </p>

                </div>

              </div>


              {ejercicio
                ?.intensidad && (

                <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {
                    ejercicio
                      .intensidad
                  }
                </div>

              )}


              {/* ===============================================
                  SERIES
                  La escritura en BD se añadirá en el siguiente
                  bloque. Ya dejamos preparada la UX.
              ================================================ */}

              {Number(
                ejercicio
                  ?.series_objetivo
              ) > 0 && (

                <div className="mt-6">

                  <div className="flex items-center justify-between gap-3">

                    <p className="font-black">
                      Series
                    </p>

                    <p className="text-xs font-semibold text-zinc-400">
                      Registro de entrenamiento
                    </p>

                  </div>


                  <div className="mt-3 space-y-2">

                    {Array.from({
                      length:
                        Number(
                          ejercicio
                            .series_objetivo
                        ),
                    }).map(
                      (
                        _,
                        indiceSerie
                      ) => {

                        const realizada =
                          (
                            ejercicio
                              ?.series ||
                            []
                          ).find(
                            (serie) =>
                              Number(
                                serie
                                  ?.numero_serie
                              ) ===
                              indiceSerie + 1
                          )

                        return (

                          <div
                            key={
                              indiceSerie
                            }
                            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-white/10"
                          >

                            <div>

                              <p className="text-sm font-black">
                                Serie {
                                  indiceSerie + 1
                                }
                              </p>

                              {realizada ? (

                                <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  Registrada
                                </p>

                              ) : (

                                <p className="mt-0.5 text-xs text-zinc-400">
                                  Pendiente
                                </p>

                              )}

                            </div>


                            {realizada ? (

                              <div className="text-right">

                                <p className="text-sm font-black">
                                  {
                                    realizada
                                      ?.peso_kg ??
                                    '—'
                                  } kg · {
                                    realizada
                                      ?.repeticiones ??
                                    '—'
                                  } reps
                                </p>

                                {
                                  realizada
                                    ?.rir !==
                                    null &&
                                  realizada
                                    ?.rir !==
                                    undefined && (

                                  <p className="mt-0.5 text-xs text-zinc-400">
                                    RIR {
                                      realizada
                                        .rir
                                    }
                                  </p>

                                )}

                              </div>

                            ) : (

                              <span className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-400 dark:bg-white/[0.05]">
                                —
                              </span>

                            )}

                          </div>

                        )
                      }
                    )}

                  </div>

                </div>

              )}

            </div>

          )}


          {rutinaDia
            ?.cierre && (

            <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-white/[0.035]">

              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                Cierre · {
                  rutinaDia
                    .cierre
                    .duracion_min
                } min
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-300">
                {
                  rutinaDia
                    .cierre
                    .indicacion
                }
              </p>

            </div>

          )}

        </div>

      </main>


      {/* =====================================================
          NAVEGACIÓN
      ====================================================== */}

      <footer className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">

          <button
            type="button"
            disabled={
              indiceActivo <= 0
            }
            onClick={() =>
              setIndiceActivo(
                (actual) =>
                  Math.max(
                    0,
                    actual - 1
                  )
              )
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3.5 text-sm font-black disabled:opacity-30 dark:border-white/10"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>


          <button
            type="button"
            disabled={
              indiceActivo >=
              total - 1
            }
            onClick={() =>
              setIndiceActivo(
                (actual) =>
                  Math.min(
                    total - 1,
                    actual + 1
                  )
              )
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3.5 text-sm font-black text-white disabled:opacity-30"
          >
            Siguiente
            <ChevronRight size={18} />
          </button>

        </div>

      </footer>

    </div>,

    document.body
  )
}
