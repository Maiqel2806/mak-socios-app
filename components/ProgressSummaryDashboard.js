'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarCheck2,
  Dumbbell,
  Flame,
  RefreshCw,
  Repeat2,
  Trophy,
  TrendingUp,
} from 'lucide-react'

const formato = new Intl.NumberFormat('es-EC', {
  maximumFractionDigits: 1,
})

function mostrarNumero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? formato.format(numero) : '—'
}

function Metrica({ Icono, titulo, valor, nota }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <Icono
        size={21}
        className="text-[#02AFBB]"
        aria-hidden="true"
      />
      <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {titulo}
      </p>
      <p className="mt-1 text-3xl font-black tabular-nums text-zinc-950 dark:text-white">
        {valor}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {nota}
      </p>
    </div>
  )
}

export default function ProgressSummaryDashboard({
  datos,
  error = '',
}) {
  const router = useRouter()

  const resumen = datos?.ok === true
    ? datos?.resumen
    : null

  const destacado = datos?.ejercicio_destacado ?? null

  const porcentaje = resumen?.cumplimiento_semana == null
    ? null
    : Number(resumen.cumplimiento_semana)

  const progreso = Number.isFinite(porcentaje)
    ? Math.max(0, Math.min(100, porcentaje))
    : 0

  const series = Number(resumen?.series_semana || 0)
  const repeticiones = Number(
    resumen?.repeticiones_semana || 0
  )
  const sesiones = Number(resumen?.sesiones_semana || 0)
  const estimadas = Number(
    resumen?.sesiones_calorias_estimadas || 0
  )

  const calorias = resumen?.calorias_aprox_semana == null
    ? null
    : Number(resumen.calorias_aprox_semana)

  const mensaje = sesiones === 0
    ? 'Tu siguiente logro empieza cuando completes y registres tu primera sesión de la semana.'
    : progreso >= 100
      ? '¡Cumpliste los días de tu plan! Sigue registrando tus entrenamientos para medir tu evolución.'
      : 'Cada serie registrada te ayuda a conocer tu rendimiento. La constancia construye el camino hacia tus objetivos.'

  return (
    <main className="min-h-screen bg-zinc-100 pb-20 text-zinc-950 dark:bg-zinc-950 dark:text-white">

      <header className="border-b border-zinc-200 bg-white px-4 py-5 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/inicio"
              aria-label="Volver al inicio"
              className="mak-interactive flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
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
            aria-label="Actualizar mi progreso"
            className="mak-interactive flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-5">

        {(error || !resumen) ? (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-zinc-900 dark:text-red-300"
          >
            {error ||
              'No pudimos cargar tu resumen. Actualiza la página para intentarlo nuevamente.'}
          </section>
        ) : (
          <>

            <section className="rounded-3xl bg-zinc-950 p-5 text-white shadow-lg sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-400">
                  Tu constancia esta semana
                </p>
                <CalendarCheck2
                  size={23}
                  className="text-[#02AFBB]"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-4xl font-black tabular-nums sm:text-5xl">
                    {porcentaje == null
                      ? '—'
                      : `${mostrarNumero(progreso)}%`}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {Number(resumen.dias_plan) > 0
                      ? `${mostrarNumero(resumen.dias_cumplidos_semana)} de ${mostrarNumero(resumen.dias_plan)} días del plan`
                      : 'Sin programación activa para calcular el cumplimiento'}
                  </p>
                </div>

                <TrendingUp
                  size={44}
                  className="text-[#02AFBB]"
                  strokeWidth={1.4}
                  aria-hidden="true"
                />
              </div>

              <div
                role="progressbar"
                aria-label="Cumplimiento semanal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  porcentaje == null ? undefined : progreso
                }
                className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full rounded-full bg-[#02AFBB]"
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-400">
                Cada día programado cuenta una sola vez,
                aunque repitas la sesión.
              </p>
            </section>

            <section
              className="grid grid-cols-2 gap-3"
              aria-label="Trabajo de esta semana"
            >
              <Metrica
                Icono={Dumbbell}
                titulo="Series realizadas"
                valor={mostrarNumero(series)}
                nota="En sesiones finalizadas"
              />

              <Metrica
                Icono={Repeat2}
                titulo="Repeticiones"
                valor={mostrarNumero(repeticiones)}
                nota="Registradas esta semana"
              />
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Flame
                  size={22}
                  className="text-orange-500"
                  aria-hidden="true"
                />
                <h2 className="font-black">
                  Gasto energético aproximado
                </h2>
              </div>

              <p className="mt-3 text-3xl font-black tabular-nums">
                {calorias == null
                  ? '—'
                  : `≈ ${mostrarNumero(calorias)} kcal`}
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {calorias == null
                  ? 'Sin datos suficientes para estimar esta semana.'
                  : estimadas < sesiones
                    ? `Estimación parcial para ${estimadas} de ${sesiones} sesiones finalizadas.`
                    : `Estimación basada en ${estimadas} sesiones finalizadas.`}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                Estimación por peso, tiempo y MET. No mide grasa perdida.
              </p>
            </section>

            <section className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm dark:border-cyan-500/20 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <Trophy size={25} aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                    Tu ejercicio destacado
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    {destacado?.nombre || 'Tu próximo logro'}
                  </h2>
                </div>
              </div>

              {destacado ? (
                <>
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                    Mejor serie registrada esta semana
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-white/5">
                      <p className="text-2xl font-black">
                        {mostrarNumero(destacado.peso_kg)} kg
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Carga
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-white/5">
                      <p className="text-2xl font-black">
                        {mostrarNumero(destacado.mejor_serie_reps)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Repeticiones
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Registraste{' '}
                    <strong>
                      {mostrarNumero(destacado.series)} series
                    </strong>
                    {' '}esta semana. Esta fue tu mejor serie registrada.
                    Sigue entrenando para comparar tu evolución.
                  </p>

                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Registra series con peso y repeticiones
                  en sesiones finalizadas para descubrir
                  tu ejercicio destacado.
                </p>
              )}
            </section>

            <p className="rounded-2xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
              {mensaje}
            </p>

            <p className="px-3 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              MAK FITNESS · Entrenamiento real, para resultados reales.
            </p>

          </>
        )}

      </div>
    </main>
  )
}
