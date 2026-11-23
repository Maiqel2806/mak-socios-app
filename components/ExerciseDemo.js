'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dumbbell, Pause, Play, PlayCircle, X } from 'lucide-react'

// Demostración de la técnica de un ejercicio.
//
// modo="boton"  (por defecto): muestra un botón "Ver ejecución". Al tocarlo
//               abre la animación a pantalla completa, superpuesta, sin
//               mover ni tapar permanentemente la rutina.
// modo="miniatura": miniatura animada (solo para el panel de administración).
//
// La animación alterna posición inicial y final. Si el gimnasio carga un
// GIF o video propio en el futuro, se muestra igual.

function Lienzo({ cuadros, cuadro, nombre, clase, onError, fallo }) {
  return (
    <div className={`relative overflow-hidden bg-white ${clase}`}>
      {!cuadros.length || fallo ? (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-400 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-600">
          <Dumbbell size={36} />
        </div>
      ) : (
        cuadros.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? `Ejecución de ${nombre}` : ''}
            aria-hidden={i !== 0}
            decoding="async"
            onError={onError}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
            style={{ opacity: i === cuadro ? 1 : 0 }}
          />
        ))
      )}
    </div>
  )
}

export default function ExerciseDemo({
  imagenes = [],
  nombre = '',
  tecnica = '',
  modo = 'boton',
  etiqueta = 'Ver ejecución',
  className = '',
}) {
  const cuadros = (imagenes || []).filter(Boolean)
  const [abierto, setAbierto] = useState(false)
  const [cuadro, setCuadro] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [fallo, setFallo] = useState(false)
  const botonCerrar = useRef(null)
  const disparador = useRef(null)

  const animando = modo === 'miniatura' || abierto

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setPausado(true)
  }, [])

  useEffect(() => {
    if (!animando || pausado || cuadros.length < 2) return
    const id = window.setInterval(() => setCuadro((c) => (c + 1) % cuadros.length), 1000)
    return () => window.clearInterval(id)
  }, [animando, pausado, cuadros.length])

  useEffect(() => {
    if (!abierto) return
    const alTeclado = (e) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === ' ' && cuadros.length > 1) {
        e.preventDefault()
        setPausado((p) => !p)
      }
    }
    window.addEventListener('keydown', alTeclado)
    window.setTimeout(() => botonCerrar.current?.focus(), 30)
    return () => window.removeEventListener('keydown', alTeclado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  function cerrar() {
    setAbierto(false)
    setCuadro(0)
    window.setTimeout(() => disparador.current?.focus(), 30)
  }

  if (modo === 'miniatura') {
    return (
      <Lienzo
        cuadros={cuadros}
        cuadro={cuadro}
        nombre={nombre}
        fallo={fallo}
        onError={() => setFallo(true)}
        clase={`h-16 w-16 shrink-0 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      />
    )
  }

  if (!cuadros.length) return null

  return (
    <>
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierto(true)}
        className={`mak-interactive inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-bold text-cyan-800 hover:border-cyan-400 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-200 ${className}`}
      >
        <PlayCircle size={17} aria-hidden="true" />
        {etiqueta}
      </button>

      {abierto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Ejecución: ${nombre}`}
            className="mak-visor fixed inset-0 z-[400] flex flex-col bg-zinc-950/95 text-white backdrop-blur-sm"
            onClick={cerrar}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(16px,env(safe-area-inset-top))] sm:px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-cyan-300">Así se hace</p>
                <h3 className="mak-display truncate text-2xl sm:text-3xl">{nombre}</h3>
              </div>
              <button
                ref={botonCerrar}
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center px-3 sm:px-8" onClick={(e) => e.stopPropagation()}>
              <Lienzo
                cuadros={cuadros}
                cuadro={cuadro}
                nombre={nombre}
                fallo={fallo}
                onError={() => setFallo(true)}
                clase="aspect-[4/3] max-h-full w-full max-w-4xl rounded-3xl"
              />
            </div>

            <div
              className="mx-auto w-full max-w-4xl px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:px-8"
              onClick={(e) => e.stopPropagation()}
            >
              {cuadros.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {cuadros.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPausado(true)
                        setCuadro(i)
                      }}
                      aria-pressed={i === cuadro}
                      className={`min-h-10 rounded-full px-4 text-xs font-bold ${i === cuadro ? 'bg-white text-zinc-950' : 'bg-white/10 text-white'}`}
                    >
                      {i === 0 ? 'Inicio' : 'Final'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPausado((p) => !p)}
                    aria-label={pausado ? 'Reproducir' : 'Pausar'}
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#02AFBB] text-[#04232a]"
                  >
                    {pausado ? <Play size={17} /> : <Pause size={17} />}
                  </button>
                </div>
              )}

              {tecnica && (
                <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-zinc-200 sm:text-base">
                  {tecnica}
                </p>
              )}

              <p className="mt-3 text-center text-xs text-zinc-400">
                Imagen de referencia. Si tienes dudas, pide al entrenador que revise tu técnica.
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
