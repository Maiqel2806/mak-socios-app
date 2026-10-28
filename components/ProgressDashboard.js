'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  History,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'

const FILTROS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'completado', nombre: 'Completados' },
  { id: 'cancelado', nombre: 'Cancelados' },
]

function fechaSesion(fecha) {
  if (!fecha) return 'Sin fecha'

  const valor = new Date(fecha)

  if (Number.isNaN(valor.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guayaquil',
  }).format(valor)
}

function fechaSemana(fecha) {
  if (!fecha) return '—'

  const valor = new Date(
    `${String(fecha).slice(0, 10)}T12:00:00Z`
  )

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(valor)
}

function tarjetaDato(titulo, valor, detalle, Icono) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {titulo}
        </span>

        <Icono
          size={18}
          className="text-cyan-600 dark:text-cyan-400"
        />
      </div>

      <p className="mt-3 text-2xl font-black tabular-nums text-zinc-950 dark:text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {detalle}
      </p>
    </div>
  )
}

export default function ProgressDashboard({
  datos,
  error = '',
}) {
  const router = useRouter()

  const [filtro, setFiltro] = useState('todos')
  const [abiertos, setAbiertos] = useState({})

  const resumen = datos?.resumen || {}

  const semanas = Array.isArray(datos?.semanas)
    ? datos.semanas
    : []

  const historial = Array.isArray(datos?.historial)
    ? datos.historial
    : []

  const sesionesVisibles = historial.filter(
    (sesion) =>
      filtro === 'todos' ||
      sesion.estado === filtro
  )

  const porcentaje = resumen.cumplimiento_semana

  function cambiarDetalle(id) {
    setAbiertos((actual) => ({
      ...actual,
      [id]: !actual[id],
    }))
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-24 text-zinc-950 dark:bg-zinc-950 dark:text-white">

      <header className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/inicio"
              aria-label="Volver al inicio"
              className="mak-interactive flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 dark:border-white/10 dark:text-white"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-cyan-600 dark:text-cyan-400">
                MAK FITNESS
              </p>

              <h1 className="text-xl font-black sm:text-2xl">
                Mi progreso
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            aria-label="Actualizar mis resultados"
            className="mak-interactive flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5">

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!datos && !error && (
          <p className="rounded-2xl bg-white p-5 text-sm text-zinc-500 dark:bg-zinc-900">
            Todavía no hay registros de progreso.
          </p>
        )}

        {datos && (
          <>
            <section className="overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-lg dark:border dark:border-white/10 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-400">
                Tu constancia esta semana
              </p>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tabular-nums sm:text-5xl">
                    {porcentaje === null ||
                    porcentaje === undefined
                      ? '—'
                      : `${porcentaje}%`}
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {resumen.dias_plan > 0
                      ? `${resumen.dias_cumplidos_semana} de ${resumen.dias_plan} días del plan`
                      : 'Sin rutina activa para calcular'}
                  </p>
                </div>

                <TrendingUp
                  size={48}
                  strokeWidth={1.4}
                  className="text-[#02AFBB]"
                />
              </div>

              <div
                role="progressbar"
                aria-label="Cumplimiento semanal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={porcentaje ?? 0}
                className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full rounded-full bg-[#02AFBB] transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, porcentaje ?? 0)
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-400">
                Cada día programado cuenta una sola vez,
                aunque repitas un entrenamiento.
              </p>
            </section>

            <section className="grid grid-cols-2 gap-3">
              {tarjetaDato(
                'Finalizados',
                resumen.sesiones_completadas ?? 0,
                'Sesiones registradas',
                CheckCircle2
              )}

              {tarjetaDato(
                'Series',
                resumen.series_realizadas ?? 0,
                'En sesiones finalizadas',
                Dumbbell
              )}

              {tarjetaDato(
                'Adicionales',
                resumen.sesiones_adicionales ?? 0,
                'Sin duplicar días del plan',
                ArrowUpRight
              )}

              {tarjetaDato(
                'Cancelados',
                resumen.sesiones_canceladas ?? 0,
                'No suman cumplimiento',
                History
              )}
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-6">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={19}
                  className="text-cyan-600 dark:text-cyan-400"
                />

                <h2 className="text-base font-black">
                  Últimas seis semanas
                </h2>
              </div>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Días distintos completados de la rutina actual.
              </p>

              <div className="mt-6 grid grid-cols-6 gap-2">
                {semanas.map((semana, indice) => {
                  const pct = semana.porcentaje ?? 0
                  const actual = indice === semanas.length - 1

                  return (
                    <div
                      key={semana.inicio}
                      className="flex min-w-0 flex-col items-center gap-2"
                    >
                      <span className="text-[10px] font-black tabular-nums text-zinc-500 dark:text-zinc-300">
                        {semana.porcentaje == null
                          ? '—'
                          : `${pct}%`}
                      </span>

                      <div className="flex h-28 w-full max-w-12 items-end overflow-hidden rounded-lg bg-zinc-100 dark:bg-white/[0.06]">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            actual
                              ? 'bg-[#02AFBB]'
                              : 'bg-zinc-400 dark:bg-zinc-600'
                          }`}
                          style={{
                            height: `${Math.max(
                              0,
                              Math.min(100, pct)
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {fechaSemana(semana.inicio)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black">
                    Historial
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Tus últimas 30 sesiones.
                  </p>
                </div>

                <History
                  size={20}
                  className="text-cyan-600 dark:text-cyan-400"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FILTROS.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => setFiltro(opcion.id)}
                    aria-pressed={filtro === opcion.id}
                    className={`mak-interactive min-h-10 rounded-xl px-3 py-2 text-xs font-bold ${
                      filtro === opcion.id
                        ? 'bg-[#02AFBB] text-white'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                    }`}
                  >
                    {opcion.nombre}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {sesionesVisibles.length === 0 && (
                  <p className="rounded-xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-white/[0.04]">
                    No hay sesiones en este filtro.
                  </p>
                )}

                {sesionesVisibles.map((sesion) => {
                  const completada =
                    sesion.estado === 'completado'

                  const variantes = Array.isArray(
                    sesion.variantes
                  ) ? sesion.variantes : []

                  const abierta = Boolean(
                    abiertos[sesion.id]
                  )

                  return (
                    <article
                      key={sesion.id}
                      className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-zinc-950 dark:text-white">
                            {sesion.nombre_dia ||
                              `Día ${sesion.dia}`}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {fechaSesion(sesion.fecha_inicio)}
                          </p>
                        </div>

                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          completada
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : sesion.estado === 'cancelado'
                              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        }`}>
                          {completada
                            ? 'Completado'
                            : sesion.estado === 'cancelado'
                              ? 'Cancelado'
                              : 'En curso'}
                        </span>
                      </div>

                      {sesion.adicional && completada && (
                        <p className="mt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          Sesión adicional · No duplica cumplimiento
                        </p>
                      )}

                      <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        {sesion.ejercicios_completados} de {sesion.ejercicios} ejercicios
                        {' · '}
                        {sesion.series_completadas} series registradas
                      </p>

                      {sesion.estado === 'cancelado' &&
                        sesion.series_completadas > 0 && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Sus series quedan en el historial,
                            pero no suman al total finalizado.
                          </p>
                        )}

                      {variantes.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => cambiarDetalle(sesion.id)}
                            aria-expanded={abierta}
                            className="mak-interactive mt-3 flex min-h-10 items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400"
                          >
                            {variantes.length} variante(s) utilizadas
                            {abierta
                              ? <ChevronUp size={15} />
                              : <ChevronDown size={15} />}
                          </button>

                          {abierta && (
                            <div className="mt-2 space-y-2">
                              {variantes.map((variante, indice) => (
                                <div
                                  key={indice}
                                  className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-white/[0.05]"
                                >
                                  <p className="font-bold text-zinc-900 dark:text-white">
                                    {variante.realizado}
                                  </p>
                                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                    Sustituye a: {variante.original}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>

            <p className="px-2 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Estas cifras describen tu actividad registrada.
              El progreso físico requiere comparar resultados
              equivalentes a lo largo del tiempo.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
