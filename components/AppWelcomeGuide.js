'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react'
import MaikPose from '@/components/MaikPose'

const PASOS = [
  {
    id: 'intro',
    pose: 'saluda',
    titulo: '¡Hola! Soy MAIK',
    subtitulo: 'Tu guía dentro de MAK Clientes',
    texto:
      'Te mostraré rápidamente cómo usar la app para que aproveches mejor cada sección.',
    objetivo: null,
  },
  {
    id: 'codigo',
    pose: 'explica',
    titulo: 'Tu código de ingreso',
    subtitulo: 'Preséntalo en recepción',
    texto:
      'Aquí verás tu código personal para registrar tu ingreso al gimnasio.',
    objetivo: '.mak-home-body > section:first-child',
  },
  {
    id: 'membresia',
    pose: 'piensa',
    titulo: 'Mi membresía',
    subtitulo: 'Tu plan y vigencia',
    texto:
      'Consulta tu plan actual, la vigencia y los días disponibles de tu membresía.',
    objetivo: '.mak-home-grid > :nth-child(1)',
  },
  {
    id: 'rutina',
    pose: 'entrena',
    titulo: 'Mi rutina',
    subtitulo: 'Tu espacio de entrenamiento',
    texto:
      'Aquí podrás iniciar tu entrenamiento y registrar las series realizadas.',
    objetivo: '.mak-home-grid > :nth-child(2)',
  },
  {
    id: 'progreso',
    pose: 'celebra',
    titulo: 'Mi progreso',
    subtitulo: 'Tu avance real',
    texto:
      'Revisa tu constancia, tus repeticiones registradas y tu evolución general.',
    objetivo: '.mak-home-grid > :nth-child(3)',
  },
  {
    id: 'fin',
    pose: 'aprueba',
    titulo: '¡Todo listo!',
    subtitulo: 'Ya puedes empezar',
    texto:
      'Ahora ya conoces lo esencial de la app. Cuando quieras, podrás volver a abrir esta guía.',
    objetivo: null,
  },
]

function obtenerRect(selector) {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null

  const r = el.getBoundingClientRect()

  return {
    top: Math.max(10, Math.round(r.top - 8)),
    left: Math.max(10, Math.round(r.left - 8)),
    width: Math.round(r.width + 16),
    height: Math.round(r.height + 16),
  }
}

export default function AppWelcomeGuide({ clienteId }) {
  const [abierto, setAbierto] = useState(false)
  const [primeraVez, setPrimeraVez] = useState(false)
  const [paso, setPaso] = useState(0)
  const [rect, setRect] = useState(null)

  const storageKey = useMemo(
    () => `mak-clientes-onboarding-v5-${clienteId}`,
    [clienteId]
  )

  useEffect(() => {
    try {
      const visto = localStorage.getItem(storageKey)
      if (!visto) {
        setPrimeraVez(true)
        setAbierto(true)
      }
    } catch {
      setPrimeraVez(true)
      setAbierto(true)
    }
  }, [storageKey])

  useEffect(() => {
    const abrir = () => {
      setPaso(0)
      setAbierto(true)
    }

    window.addEventListener('mak:abrir-guia', abrir)

    return () =>
      window.removeEventListener('mak:abrir-guia', abrir)
  }, [])

  useEffect(() => {
    if (!abierto) {
      document.body.classList.remove('mak-onboarding-lock')
      return
    }

    document.body.classList.add('mak-onboarding-lock')

    const selector = PASOS[paso]?.objetivo

    const actualizar = () => {
      setRect(obtenerRect(selector))
    }

    if (selector) {
      const el = document.querySelector(selector)
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }

    const t = setTimeout(actualizar, 250)
    actualizar()

    window.addEventListener('resize', actualizar)
    window.addEventListener('scroll', actualizar, true)

    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', actualizar)
      window.removeEventListener('scroll', actualizar, true)
      document.body.classList.remove('mak-onboarding-lock')
    }
  }, [abierto, paso])

  const actual = PASOS[paso]
  const ultimo = paso === PASOS.length - 1
  const progreso = ((paso + 1) / PASOS.length) * 100

  function finalizar() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {}
    setPrimeraVez(false)
    setAbierto(false)
    setPaso(0)
  }

  function siguiente() {
    if (ultimo) {
      finalizar()
      return
    }
    setPaso((v) => v + 1)
  }

  function anterior() {
    if (paso <= 0) return
    setPaso((v) => v - 1)
  }

  function reabrir() {
    setPaso(0)
    setAbierto(true)
  }

  return (
    <>
      {abierto && (
        <div
          className="maik-game-guide"
          role="dialog"
          aria-modal="true"
          aria-label="Guía de MAK Clientes"
        >
          {rect ? (
            <>
              <div className="maik-game-dim"
                style={{
                  top:0, left:0, right:0,
                  height:Math.max(0, rect.top)
                }}
              />
              <div className="maik-game-dim"
                style={{
                  top:rect.top, left:0,
                  width:Math.max(0, rect.left),
                  height:rect.height
                }}
              />
              <div className="maik-game-dim"
                style={{
                  top:rect.top,
                  left:rect.left + rect.width,
                  right:0,
                  height:rect.height
                }}
              />
              <div className="maik-game-dim"
                style={{
                  top:rect.top + rect.height,
                  left:0, right:0, bottom:0
                }}
              />
            </>
          ) : (
            <div className="maik-game-dim"
              style={{inset:0}}
            />
          )}

          {rect && (
            <>
              <div
                className="maik-game-focus"
                style={{
                  top: `${rect.top}px`,
                  left: `${rect.left}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                }}
              />
            </>
          )}

          <section className="maik-game-dialog">
            <div className="maik-game-character">
              <MaikPose pose={actual.pose} size={132} />
            </div>

            <div className="maik-game-panel">
              {!primeraVez && (
                <button
                  type="button"
                  className="maik-game-close"
                  aria-label="Cerrar guía"
                  onClick={() => setAbierto(false)}
                >
                  <X size={18}/>
                </button>
              )}

              <div className="maik-game-head">
                <div className="maik-game-kicker">MAK CLIENTES · TUTORIAL</div>
                <div className="maik-game-step">
                  PASO {paso + 1} DE {PASOS.length}
                </div>
              </div>

              <div className="maik-game-progress">
                <div
                  className="maik-game-progress-fill"
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <div className="maik-game-bubble">
                <h2 key={`titulo-${paso}`} className="maik-game-title">
                  {actual.titulo}
                </h2>

                <p key={`sub-${paso}`} className="maik-game-subtitle">
                  {actual.subtitulo}
                </p>

                <p key={`txt-${paso}`} className="maik-game-text">
                  {actual.texto}
                </p>
              </div>

              <div className="maik-game-actions">
                <button
                  type="button"
                  className="maik-game-btn maik-game-btn-secondary"
                  onClick={anterior}
                  disabled={paso === 0}
                >
                  <ArrowLeft size={16} />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  className="maik-game-btn maik-game-btn-primary"
                  onClick={siguiente}
                >
                  {ultimo ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Finalizar</span>
                    </>
                  ) : (
                    <>
                      <span>Siguiente</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
