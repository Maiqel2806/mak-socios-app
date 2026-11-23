'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, SkipForward, Trophy, X } from 'lucide-react'

// Acompañante del entrenamiento en curso:
//  - Temporizador de descanso automático al completar una serie
//    (evento `mak:descanso`), con aviso por vibración y sonido.
//  - Aviso de récord personal (evento `mak:record`).
//  - Mantiene la pantalla encendida mientras se entrena (Wake Lock).

export function avisarDescanso(segundos, ejercicio) {
  if (typeof window === 'undefined' || !(Number(segundos) > 0)) return
  window.dispatchEvent(new CustomEvent('mak:descanso', { detail: { segundos: Number(segundos), ejercicio } }))
}

export function avisarRecord(detalle) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('mak:record', { detail: detalle }))
}

function formato(seg) {
  const s = Math.max(0, Math.ceil(seg))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function RestTimer() {
  const [fin, setFin] = useState(null)
  const [total, setTotal] = useState(0)
  const [ejercicio, setEjercicio] = useState('')
  const [ahora, setAhora] = useState(() => Date.now())
  const [listo, setListo] = useState(false)
  const [record, setRecord] = useState(null)
  const audio = useRef(null)
  const avisado = useRef(false)

  const pitar = useCallback(() => {
    try {
      const ctx = audio.current
      if (!ctx) return
      ;[0, 0.22].forEach((t) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = 880
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
        o.connect(g).connect(ctx.destination)
        o.start(ctx.currentTime + t)
        o.stop(ctx.currentTime + t + 0.2)
      })
    } catch {}
  }, [])

  // Eventos
  useEffect(() => {
    function alDescansar(e) {
      const seg = Number(e.detail?.segundos) || 0
      if (!seg) return
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (Ctx && !audio.current) audio.current = new Ctx()
        audio.current?.resume?.()
      } catch {}
      avisado.current = false
      setListo(false)
      setTotal(seg)
      setEjercicio(e.detail?.ejercicio || '')
      setFin(Date.now() + seg * 1000)
      setAhora(Date.now())
    }

    function alRecord(e) {
      setRecord(e.detail || {})
      try { navigator.vibrate?.([60, 40, 60, 40, 120]) } catch {}
      window.setTimeout(() => setRecord(null), 5000)
    }

    window.addEventListener('mak:descanso', alDescansar)
    window.addEventListener('mak:record', alRecord)
    return () => {
      window.removeEventListener('mak:descanso', alDescansar)
      window.removeEventListener('mak:record', alRecord)
    }
  }, [])

  // Reloj
  useEffect(() => {
    if (!fin) return
    const id = window.setInterval(() => setAhora(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [fin])

  const restante = fin ? (fin - ahora) / 1000 : 0

  useEffect(() => {
    if (!fin || restante > 0 || avisado.current) return
    avisado.current = true
    setListo(true)
    pitar()
    try { navigator.vibrate?.([250, 120, 250]) } catch {}
    const id = window.setTimeout(() => {
      setFin(null)
      setListo(false)
    }, 4000)
    return () => window.clearTimeout(id)
  }, [fin, restante, pitar])

  // Pantalla siempre encendida durante el entrenamiento
  useEffect(() => {
    let bloqueo = null
    let activo = true

    async function pedir() {
      try {
        if (activo && document.visibilityState === 'visible' && navigator.wakeLock) {
          bloqueo = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }

    pedir()
    document.addEventListener('visibilitychange', pedir)
    return () => {
      activo = false
      document.removeEventListener('visibilitychange', pedir)
      try { bloqueo?.release?.() } catch {}
    }
  }, [])

  const ajustar = (delta) => {
    setFin((f) => (f ? Math.max(Date.now() + 1000, f + delta * 1000) : f))
    setTotal((t) => Math.max(1, t + delta))
  }

  const progreso = total ? Math.min(1, Math.max(0, 1 - restante / total)) : 0

  // Se dibuja en <body>: así siempre queda en primer plano, aunque la
  // rutina esté dentro de una ventana con animación (que rompe position: fixed).
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  if (!montado) return null

  return createPortal(
    <>
      {record && (
        <div
          role="status"
          aria-live="polite"
          className="mak-modal-sheet fixed left-1/2 top-4 z-[310] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3 text-amber-950 shadow-xl"
        >
          <Trophy className="shrink-0" size={26} />
          <div className="min-w-0 flex-1">
            <p className="mak-display text-lg">¡Nuevo récord personal!</p>
            <p className="truncate text-xs font-semibold">
              {record.ejercicio}: {String(record.peso).replace('.', ',')} kg × {record.reps}
            </p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={() => setRecord(null)} className="grid h-8 w-8 place-items-center rounded-full bg-black/10">
            <X size={15} />
          </button>
        </div>
      )}

      {fin && (
        <div
          role="timer"
          aria-live="off"
          aria-label={listo ? 'Descanso terminado' : `Descanso: ${formato(restante)}`}
          className="fixed inset-x-0 bottom-0 z-[300] px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <div className={`mx-auto max-w-xl overflow-hidden rounded-3xl shadow-2xl ring-1 ${listo ? 'bg-[#02AFBB] text-[#04232a] ring-cyan-300' : 'bg-[#0D1417] text-white ring-white/10'}`}>
            <div className="h-1.5 bg-white/10">
              <div className="h-full bg-[#5FE3EA] transition-[width] duration-200" style={{ width: `${progreso * 100}%` }} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold ${listo ? '' : 'text-zinc-400'}`}>
                  {listo ? '¡A la siguiente serie!' : 'Descanso'}
                  {ejercicio && !listo ? ` · ${ejercicio}` : ''}
                </p>
                <p className="mak-cifra text-4xl tabular-nums">{listo ? '¡Ya!' : formato(restante)}</p>
              </div>
              {!listo && (
                <>
                  <button type="button" onClick={() => ajustar(-15)} aria-label="Restar 15 segundos" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <Minus size={18} />
                  </button>
                  <button type="button" onClick={() => ajustar(15)} aria-label="Sumar 15 segundos" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <Plus size={18} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => { setFin(null); setListo(false) }}
                className={`inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${listo ? 'bg-black/15' : 'bg-[#02AFBB] text-[#04232a]'}`}
              >
                {listo ? 'Cerrar' : (<><SkipForward size={16} /> Saltar</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
