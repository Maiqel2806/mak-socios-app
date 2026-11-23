'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Dumbbell, Maximize2, Pause, Play, X } from 'lucide-react'

// Muestra la ejecución del ejercicio alternando la posición inicial y
// final (efecto GIF ligero, ~25 KB por ejercicio). Si el gimnasio carga
// un GIF o imagen propia, se muestra tal cual.

const TAMANOS = {
  sm: 'h-16 w-16 rounded-xl',
  md: 'aspect-[4/3] w-full rounded-2xl',
  lg: 'aspect-[4/3] w-full rounded-3xl',
}

export default function ExerciseDemo({
  imagenes = [],
  nombre = '',
  tecnica = '',
  tamano = 'md',
  ampliable = true,
}) {
  const cuadros = (imagenes || []).filter(Boolean)
  const contenedor = useRef(null)
  const [cuadro, setCuadro] = useState(0)
  const [visible, setVisible] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [fallo, setFallo] = useState(false)

  // Reproduce solo cuando está en pantalla
  useEffect(() => {
    const nodo = contenedor.current
    if (!nodo || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' })
    obs.observe(nodo)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setPausado(true)
  }, [])

  useEffect(() => {
    if (cuadros.length < 2 || pausado || (!visible && !abierto)) return
    const id = setInterval(() => setCuadro((c) => (c + 1) % cuadros.length), 1100)
    return () => clearInterval(id)
  }, [cuadros.length, pausado, visible, abierto])

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [abierto])

  const sinImagen = !cuadros.length || fallo

  const lienzo = (clase, grande = false) => (
    <div className={`relative overflow-hidden bg-white ${clase}`}>
      {sinImagen ? (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-400 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-600">
          <Dumbbell size={grande ? 40 : 22} />
        </div>
      ) : (
        cuadros.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? `Demostración: ${nombre}` : ''}
            aria-hidden={i !== 0}
            loading="lazy"
            decoding="async"
            onError={() => setFallo(true)}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
            style={{ opacity: i === cuadro ? 1 : 0 }}
          />
        ))
      )}
    </div>
  )

  return (
    <>
      <div ref={contenedor} className={`group relative shrink-0 ${tamano === 'sm' ? '' : 'w-full'}`}>
        {ampliable && !sinImagen ? (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label={`Ver cómo se hace: ${nombre}`}
            className="mak-interactive block w-full"
          >
            {lienzo(`${TAMANOS[tamano]} ring-1 ring-black/5 dark:ring-white/10`)}
          </button>
        ) : (
          lienzo(`${TAMANOS[tamano]} ring-1 ring-black/5 dark:ring-white/10`)
        )}

        {tamano !== 'sm' && !sinImagen && (
          <>
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-zinc-950/75 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
              {cuadros.length > 1 ? (cuadro === 0 ? 'Inicio' : 'Final') : 'Técnica'}
            </span>
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full bg-zinc-950/70 text-white backdrop-blur">
              <Maximize2 size={14} />
            </span>
          </>
        )}
      </div>

      {abierto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Técnica: ${nombre}`}
            className="mak-modal-backdrop fixed inset-0 z-[90] flex items-end justify-center bg-zinc-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setAbierto(false)}
          >
            <div
              className="mak-modal-sheet w-full max-w-lg overflow-hidden rounded-t-3xl bg-white text-zinc-950 shadow-2xl dark:bg-zinc-900 dark:text-white sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                <div className="min-w-0">
                  <p className="mak-eyebrow">Cómo se hace</p>
                  <h3 className="mak-display truncate text-xl">{nombre}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-100 dark:bg-white/10"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5">{lienzo('aspect-[4/3] w-full rounded-2xl ring-1 ring-black/5', true)}</div>

              {cuadros.length > 1 && (
                <div className="flex items-center justify-between gap-3 px-5 pt-3">
                  <div className="flex gap-1.5">
                    {cuadros.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPausado(true)
                          setCuadro(i)
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${i === cuadro ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'}`}
                      >
                        {i === 0 ? 'Posición inicial' : 'Posición final'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPausado((p) => !p)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#02AFBB] text-white"
                    aria-label={pausado ? 'Reproducir' : 'Pausar'}
                  >
                    {pausado ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                </div>
              )}

              {tecnica && (
                <p className="px-5 pt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{tecnica}</p>
              )}

              <p className="px-5 pb-6 pt-3 text-[11px] text-zinc-400">
                Ilustración de referencia. Ante cualquier duda, pide al entrenador que revise tu técnica.
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
