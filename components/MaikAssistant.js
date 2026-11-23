'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown, Download, X } from 'lucide-react'
import MaikPose from '@/components/MaikPose'

// MAIK: ayuda contextual con respuestas rápidas, acceso al recorrido
// e instalación de la app en el teléfono o el computador.

const PREGUNTAS = {
  '/inicio': [
    ['¿Cómo creo mi rutina?', 'Toca “Mi rutina” o “Crear mi rutina” en el panel de arriba. Responde 4 pasos (cuerpo, meta, días y salud) y la app arma tu plan.'],
    ['Tengo una lesión, ¿puedo entrenar?', 'Sí. En el paso “Tu salud primero” marca la zona. Si es una molestia leve, la rutina evita los ejercicios que la cargan. Si es un dolor actual, el entrenador revisa tu caso y te decimos qué puedes hacer mientras tanto.'],
    ['¿Cómo registro mis series?', 'Abre tu rutina y toca “Iniciar entrenamiento”. En cada ejercicio escribe el peso y las repeticiones y toca “Completar serie”: el descanso empieza solo.'],
    ['¿Cómo veo cómo se hace un ejercicio?', 'En cada ejercicio toca “Ver ejecución”: se abre la demostración en pantalla completa.'],
    ['La máquina está ocupada', 'Toca “Ver alternativas” en el ejercicio y elige otra opción que trabaja lo mismo.'],
  ],
  '/progreso': [
    ['¿Qué es el 1RM estimado?', 'Es el peso que podrías levantar una sola vez, calculado con tus series. Sirve para comparar tu fuerza en el tiempo, no para intentarlo.'],
    ['¿Qué es el volumen?', 'Peso × repeticiones de todas tus series. Si sube semana a semana, estás progresando.'],
    ['¿Por qué no veo mis datos?', 'Solo cuentan los entrenamientos finalizados con peso y repeticiones registrados.'],
  ],
}

export default function MaikAssistant() {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)
  const [pregunta, setPregunta] = useState(null)
  const [instalador, setInstalador] = useState(null)
  const [instalada, setInstalada] = useState(false)
  const [esIOS, setEsIOS] = useState(false)

  useEffect(() => {
    const alPreparar = (e) => {
      e.preventDefault()
      setInstalador(e)
    }
    window.addEventListener('beforeinstallprompt', alPreparar)
    setInstalada(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
    setEsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent))
    return () => window.removeEventListener('beforeinstallprompt', alPreparar)
  }, [])

  useEffect(() => {
    if (!abierto) return
    const alTeclado = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [abierto])

  if (pathname === '/login' || pathname?.startsWith('/admin')) return null

  const preguntas = PREGUNTAS[pathname] || PREGUNTAS['/inicio']

  async function instalar() {
    if (!instalador) return
    instalador.prompt()
    const r = await instalador.userChoice.catch(() => null)
    if (r?.outcome === 'accepted') setInstalada(true)
    setInstalador(null)
  }

  return (
    <div className="maik-helper">
      {abierto && (
        <div className="maik-helper-panel maik-helper-panel-v2" role="dialog" aria-label="Ayuda de MAIK">
          <button
            type="button"
            className="maik-helper-close"
            aria-label="Cerrar ayuda"
            onClick={() => setAbierto(false)}
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <MaikPose pose={pathname === '/progreso' ? 'celebra' : 'explica'} size={64} />
            <div>
              <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-300">MAIK · tu asistente</p>
              <h3 className="mak-display text-xl leading-tight">¿En qué te ayudo?</h3>
            </div>
          </div>

          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-white/10">
            {preguntas.map(([q, r], i) => (
              <li key={q}>
                <button
                  type="button"
                  aria-expanded={pregunta === i}
                  onClick={() => setPregunta(pregunta === i ? null : i)}
                  className="flex min-h-11 w-full items-center justify-between gap-2 py-2 text-left text-sm font-semibold"
                >
                  {q}
                  <ChevronDown size={16} className={`shrink-0 transition ${pregunta === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {pregunta === i && <p className="pb-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{r}</p>}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            {pathname === '/inicio' && (
              <button
                type="button"
                className="maik-helper-tour"
                onClick={() => {
                  setAbierto(false)
                  window.dispatchEvent(new Event('mak:abrir-guia'))
                }}
              >
                Ver recorrido <ArrowRight size={14} />
              </button>
            )}
            {!instalada && instalador && (
              <button type="button" className="maik-helper-tour" onClick={instalar}>
                <Download size={14} /> Instalar la app
              </button>
            )}
          </div>

          {!instalada && !instalador && esIOS && (
            <p className="mt-3 rounded-xl bg-cyan-50 p-2.5 text-xs leading-5 text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-100">
              Para instalarla en tu iPhone: toca Compartir en Safari y luego “Agregar a inicio”.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="maik-helper-trigger"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar ayuda de MAIK' : 'Abrir ayuda de MAIK'}
      >
        <span className="maik-helper-trigger-figure">
          <MaikPose pose="saluda" size={58} />
        </span>

        <span className="maik-helper-trigger-label">
          {abierto ? 'Cerrar' : '¿Te ayudo?'}
        </span>

        {!abierto && <ArrowRight size={14} />}
      </button>
    </div>
  )
}
