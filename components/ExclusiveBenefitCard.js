'use client'

import {
  ChevronRight,
  Dumbbell,
  LockKeyhole,
  Salad,
  Sparkles,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'


function obtenerIcono(
  tipo,
  size = 23
) {
  if (
    tipo === 'rutina'
  ) {
    return (
      <Dumbbell
        size={size}
      />
    )
  }

  if (
    tipo === 'progreso'
  ) {
    return (
      <TrendingUp
        size={size}
      />
    )
  }

  return (
    <Salad
      size={size}
    />
  )
}


function obtenerMensaje(
  tipo
) {
  if (
    tipo === 'rutina'
  ) {
    return (
      'Tu entrenamiento personalizado es un beneficio exclusivo para miembros activos de MAK FITNESS.'
    )
  }

  if (
    tipo === 'progreso'
  ) {
    return (
      'Tu seguimiento, evolución y resultados forman parte de los beneficios exclusivos de MAK Socios.'
    )
  }

  return (
    'El acceso al Snack Bar, menú y beneficios para socios está disponible para miembros activos.'
  )
}


export default function ExclusiveBenefitCard({
  tipo,
  titulo,
  subtitulo,
  activo,
  estadoMembresia,
}) {
  const [
    mostrarBloqueo,
    setMostrarBloqueo,
  ] = useState(false)


  useEffect(
    () => {
      if (!mostrarBloqueo) {
        return
      }

      const anterior =
        document.body.style.overflow

      document.body.style.overflow =
        'hidden'


      function escape(
        evento
      ) {
        if (
          evento.key === 'Escape'
        ) {
          setMostrarBloqueo(false)
        }
      }


      window.addEventListener(
        'keydown',
        escape
      )


      return () => {
        document.body.style.overflow =
          anterior

        window.removeEventListener(
          'keydown',
          escape
        )
      }
    },
    [
      mostrarBloqueo,
    ]
  )


  function abrirMembresia() {
    setMostrarBloqueo(false)

    window.setTimeout(
      () => {
        window.dispatchEvent(
          new CustomEvent(
            'mak:abrir-membresia'
          )
        )
      },
      80
    )
  }


  function textoEstado() {
    if (
      estadoMembresia ===
      'vencida'
    ) {
      return (
        'Tu membresía ha caducado.'
      )
    }

    if (
      estadoMembresia ===
      'suspendida'
    ) {
      return (
        'Tu membresía se encuentra suspendida.'
      )
    }

    if (
      estadoMembresia ===
      'proxima'
    ) {
      return (
        'Tu próxima membresía todavía no ha iniciado.'
      )
    }

    return (
      'Necesitas una membresía activa para acceder.'
    )
  }


  if (activo) {
    return (
      <div className="mak-interactive flex min-h-[145px] flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">

        <div className="flex items-start justify-between gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
            {obtenerIcono(
              tipo
            )}
          </div>


          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Disponible
          </span>

        </div>


        <div>

          <p className="font-black text-zinc-950 dark:text-white">
            {titulo}
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {subtitulo}
          </p>

        </div>

      </div>
    )
  }


  return (
    <>
      <button
        type="button"
        onClick={() =>
          setMostrarBloqueo(
            true
          )
        }
        className="mak-interactive group relative flex min-h-[145px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-white/10 dark:bg-zinc-900"
      >

        <div className="absolute inset-0 bg-zinc-100/45 backdrop-blur-[1px] dark:bg-black/20" />


        <div className="relative z-10 flex items-start justify-between gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
            {obtenerIcono(
              tipo
            )}
          </div>


          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950">
            <LockKeyhole
              size={17}
            />
          </div>

        </div>


        <div className="relative z-10">

          <p className="font-black text-zinc-700 dark:text-zinc-200">
            {titulo}
          </p>

          <div className="mt-1 flex items-center gap-1.5">

            <span className="text-xs font-semibold text-zinc-500">
              Exclusivo miembros activos
            </span>

            <ChevronRight
              size={14}
              className="text-zinc-400 transition group-hover:translate-x-0.5"
            />

          </div>

        </div>

      </button>


      {mostrarBloqueo && (

        <div
          className="mak-modal-backdrop fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
          onClick={() =>
            setMostrarBloqueo(
              false
            )
          }
        >

          <div
            className="mak-modal-sheet w-full overflow-x-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-zinc-900 sm:max-w-md sm:rounded-[2rem]"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >

            <div className="p-5 pb-7 sm:p-6">

              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />


              <div className="flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setMostrarBloqueo(
                      false
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-300"
                >
                  <X size={19} />
                </button>

              </div>


              <div className="mak-view-enter text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <Sparkles
                    size={30}
                  />
                </div>


                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                  Beneficio exclusivo MAK
                </p>


                <h3 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                  Solo para miembros activos
                </h3>


                <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  {textoEstado()}
                </p>


                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {obtenerMensaje(
                    tipo
                  )}
                </p>


                <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-left dark:bg-white/[0.04]">

                  <p className="font-bold text-zinc-950 dark:text-white">
                    Sigue siendo parte de la familia MAK FITNESS
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    Renueva tu membresía y recupera el acceso a todas las funcionalidades y beneficios de MAK Socios.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    abrirMembresia
                  }
                  className="mak-interactive mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white shadow-sm transition hover:bg-cyan-600 dark:bg-cyan-400 dark:text-zinc-950"
                >
                  <WalletCards
                    size={19}
                  />

                  {estadoMembresia ===
                    'vencida'
                    ? 'Renovar membresía'
                    : 'Ver mi membresía'}
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setMostrarBloqueo(
                      false
                    )
                  }
                  className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-bold text-zinc-500 transition hover:bg-zinc-50 dark:hover:bg-white/5"
                >
                  Ahora no
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  )
}
