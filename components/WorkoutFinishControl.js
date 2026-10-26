'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react'

function esActividad(ejercicio) {
  const objetivo = String(
    ejercicio?.repeticiones_objetivo || ''
  )

  return (
    /(^|[^a-z])(seg|segundos|min|minutos)($|[^a-z])/i.test(
      objetivo
    ) ||
    String(
      ejercicio?.grupo_muscular || ''
    ).trim().toLowerCase() === 'cardio'
  )
}

function ejercicioValido(ejercicio) {
  const total = Number(ejercicio?.series_objetivo)

  if (
    !Number.isSafeInteger(total) ||
    total < 1 ||
    total > 30
  ) return false

  const series = Array.isArray(ejercicio?.series)
    ? ejercicio.series
    : []

  const actividad = esActividad(ejercicio)

  for (let numero = 1; numero <= total; numero++) {
    const serie = series.find(
      (item) => Number(item.numero_serie) === numero
    )

    if (!serie?.completada) return false

    if (!actividad) {
      if (
        serie.peso_kg === null ||
        serie.peso_kg === undefined ||
        serie.repeticiones === null ||
        serie.repeticiones === undefined
      ) return false

      const peso = Number(serie.peso_kg)
      const reps = Number(serie.repeticiones)

      if (
        !Number.isFinite(peso) ||
        peso < 0 ||
        !Number.isSafeInteger(reps) ||
        reps < 1
      ) return false

      if (
        Math.abs(
          peso / 2.5 - Math.round(peso / 2.5)
        ) > 0.0000001
      ) return false
    }
  }

  return true
}

export default function WorkoutFinishControl({
  entrenamiento,
  onFinalizado,
}) {
  const [lectura, setLectura] = useState(null)
  const [revisando, setRevisando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLectura(null)
  }, [entrenamiento])

  const sesion =
    lectura?.entrenamiento_id ===
    entrenamiento?.entrenamiento_id
      ? lectura
      : entrenamiento

  const ejercicios = Array.isArray(sesion?.ejercicios)
    ? sesion.ejercicios
    : []

  const pendientes = ejercicios.filter(
    (ejercicio) => !ejercicioValido(ejercicio)
  )

  const terminados =
    ejercicios.length - pendientes.length

  const listo =
    ejercicios.length > 0 &&
    pendientes.length === 0 &&
    sesion?.tiene_entrenamiento === true

  async function consultarSesion() {
    const respuesta = await fetch(
      '/api/entrenamiento',
      { cache: 'no-store' }
    )

    const datos = await respuesta.json().catch(() => null)

    if (!respuesta.ok) {
      throw new Error(
        datos?.error ||
        'No fue posible consultar el entrenamiento.'
      )
    }

    if (!datos?.entrenamiento?.tiene_entrenamiento) {
      throw new Error(
        'Esta sesión ya no está activa. Vuelve a Mi rutina.'
      )
    }

    setLectura(datos.entrenamiento)

    return datos.entrenamiento
  }

  async function actualizar() {
    if (revisando || finalizando) return

    setRevisando(true)
    setError('')

    try {
      await consultarSesion()
    } catch (err) {
      setError(
        err?.message ||
        'No fue posible actualizar el progreso.'
      )
    } finally {
      setRevisando(false)
    }
  }

  async function finalizar() {
    if (
      !listo ||
      revisando ||
      finalizando
    ) return

    setFinalizando(true)
    setError('')

    try {
      // Recuperar primero el estado real.
      const actual = await consultarSesion()

      const lista = Array.isArray(actual.ejercicios)
        ? actual.ejercicios
        : []

      if (
        lista.length === 0 ||
        !lista.every(ejercicioValido)
      ) {
        throw new Error(
          'Hay series incompletas o datos que debes corregir. Revisa el listado.'
        )
      }

      // La RPC verifica nuevamente en la base de datos.
      const respuesta = await fetch(
        '/api/entrenamiento',
        { method: 'PUT' }
      )

      const datos = await respuesta.json().catch(() => null)

      if (
        !respuesta.ok ||
        datos?.ok !== true ||
        datos?.resultado?.ok !== true
      ) {
        throw new Error(
          datos?.error ||
          'No se pudo confirmar la finalización.'
        )
      }

      setResultado(datos.resultado)

    } catch (err) {
      setError(
        err?.message ||
        'No fue posible finalizar el entrenamiento.'
      )
    } finally {
      setFinalizando(false)
    }
  }

  const nivel = resultado?.nivel

  const titulo =
    nivel === 'excelente'
      ? '¡Eso fue genial!'
      : nivel === 'medio'
        ? '¡Buen trabajo!'
        : nivel === 'bajo'
          ? '¡Seguimos mejorando!'
          : '¡Entrenamiento completado!'

  const mensaje =
    nivel === 'excelente'
      ? 'Cumpliste tus objetivos de repeticiones. ¡Excelente esfuerzo y constancia!'
      : nivel === 'medio'
        ? 'Fue un buen entrenamiento. Todavía tienes margen para mejorar y seguir creciendo.'
        : nivel === 'bajo'
          ? 'Hoy algunas series costaron más. Sigue entrenando con constancia y mejora poco a poco, sin descuidar tu técnica.'
          : 'Has completado tus actividades programadas. ¡Cada sesión suma!'

  return (
    <section className="mb-4 rounded-3xl border border-cyan-200 bg-white p-4 shadow-sm dark:border-cyan-500/20 dark:bg-zinc-900 sm:p-5">

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">
            Progreso del entrenamiento
          </p>

          <h3 className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
            {terminados} de {ejercicios.length} ejercicios
          </h3>
        </div>

        <button
          type="button"
          onClick={actualizar}
          disabled={revisando || finalizando}
          aria-label="Actualizar progreso"
          className="mak-interactive flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 disabled:opacity-50 dark:bg-white/10 dark:text-zinc-300"
        >
          <RefreshCw
            size={18}
            className={revisando ? 'animate-spin' : ''}
          />
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="Ejercicios completados"
        aria-valuemin={0}
        aria-valuemax={ejercicios.length}
        aria-valuenow={terminados}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[#02AFBB] transition-all duration-300"
          style={{
            width: `${
              ejercicios.length
                ? (terminados / ejercicios.length) * 100
                : 0
            }%`,
          }}
        />
      </div>

      {!listo && (
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {pendientes.length
            ? `Por revisar: ${pendientes
                .slice(0, 3)
                .map((item) => item.nombre_realizado)
                .join(', ')}${pendientes.length > 3 ? '…' : ''}.`
            : 'Consulta el estado de la sesión.'}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={finalizar}
        disabled={!listo || revisando || finalizando}
        className="mak-interactive mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#02AFBB] px-4 py-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-white/10 dark:disabled:text-zinc-400"
      >
        <CheckCircle2 size={20} />

        {finalizando
          ? 'Finalizando entrenamiento...'
          : 'Finalizar entrenamiento'}
      </button>

      {resultado &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[4px]">

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="resultado-entrenamiento-mak"
              className="mak-view-enter w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-2xl dark:bg-zinc-950 sm:p-8"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                <Trophy size={40} />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                MAK FITNESS
              </p>

              <h2
                id="resultado-entrenamiento-mak"
                className="mt-2 text-2xl font-black text-zinc-950 dark:text-white"
              >
                {titulo}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {mensaje}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.05]">
                  <p className="text-xl font-black text-zinc-950 dark:text-white">
                    {resultado.ejercicios_completados}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Ejercicios
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.05]">
                  <p className="text-xl font-black text-zinc-950 dark:text-white">
                    {resultado.cumplimiento_porcentaje == null
                      ? '—'
                      : `${resultado.cumplimiento_porcentaje}%`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Objetivo de reps
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onFinalizado}
                className="mak-interactive mt-6 min-h-12 w-full rounded-2xl bg-[#02AFBB] px-5 py-3.5 text-sm font-black text-white"
              >
                Volver a mi rutina
              </button>

            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
