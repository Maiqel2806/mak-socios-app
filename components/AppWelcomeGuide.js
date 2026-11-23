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
    subtitulo: 'Tu guía en MAK Clientes',
    texto:
      'En menos de un minuto te muestro lo que puedes hacer aquí. Puedes saltar el recorrido cuando quieras.',
    objetivo: null,
  },
  {
    id: 'hoy',
    pose: 'motiva',
    titulo: 'Tu día, de un vistazo',
    subtitulo: 'Qué te toca y cómo vas',
    texto:
      'Aquí ves el entrenamiento que te toca hoy, los días que entrenaste esta semana y tu racha. Toca “Empezar” y vas directo a tu rutina.',
    objetivo: '.mak-hoy',
  },
  {
    id: 'codigo',
    pose: 'explica',
    titulo: 'Tu código de ingreso',
    subtitulo: 'Para recepción',
    texto:
      'Muéstralo en recepción para registrar tu ingreso al gimnasio.',
    objetivo: '.mak-home-body > section:first-child',
  },
  {
    id: 'membresia',
    pose: 'piensa',
    titulo: 'Mi membresía',
    subtitulo: 'Plan, vigencia y pagos',
    texto:
      'Revisa cuántos días te quedan y las formas de pago para renovar sin filas.',
    objetivo: '.mak-home-grid > :nth-child(1)',
  },
  {
    id: 'rutina',
    pose: 'entrena',
    titulo: 'Mi rutina',
    subtitulo: 'Hecha para ti',
    texto:
      'Se arma con tu objetivo, tu nivel y las máquinas del gimnasio. Si tienes una lesión, la rutina la cuida. En cada ejercicio toca “Ver ejecución” para ver cómo se hace.',
    objetivo: '.mak-home-grid > :nth-child(2)',
  },
  {
    id: 'entreno',
    pose: 'motiva',
    titulo: 'Mientras entrenas',
    subtitulo: 'Te acompaño en cada serie',
    texto:
      'Anota peso y repeticiones: te mostraré lo que hiciste la vez anterior, cuánto subir y el descanso con cuenta regresiva.',
    objetivo: null,
  },
  {
    id: 'progreso',
    pose: 'celebra',
    titulo: 'Mi progreso',
    subtitulo: 'Tus récords y tu constancia',
    texto:
      'Mira tus récords personales, el volumen de cada semana y tus últimos entrenamientos.',
    objetivo: '.mak-home-grid > :nth-child(3)',
  },
  {
    id: 'snack',
    pose: 'descansa',
    titulo: 'Snack Bar',
    subtitulo: 'Nutrición MAK',
    texto:
      'Consulta el menú del snack bar para recargar energía antes o después de entrenar.',
    objetivo: '.mak-home-grid > :nth-child(4)',
  },
  {
    id: 'fin',
    pose: 'aprueba',
    titulo: '¡Listo para entrenar!',
    subtitulo: 'Un consejo final',
    texto:
      'Instala la app en tu celular desde el menú del navegador (“Agregar a pantalla de inicio”). Si me necesitas, toca mi botón abajo a la derecha.',
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
    () => `mak-clientes-onboarding-v6-${clienteId}`,
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

    // Si el elemento no está en pantalla (p. ej. sin membresía activa), sigue sin resaltar

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

  useEffect(() => {
    if (!abierto) return
    const alTeclado = (e) => {
      if (e.key === 'ArrowRight') siguiente()
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'Escape') finalizar()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  })

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
              <button
                type="button"
                className="maik-game-close"
                aria-label="Cerrar guía"
                onClick={finalizar}
              >
                <X size={18}/>
              </button>

              <div className="maik-game-head">
                <div className="maik-game-kicker">Recorrido</div>
                <div className="maik-game-step">
                  {paso + 1} de {PASOS.length}
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
                {paso === 0 ? (
                  <button
                    type="button"
                    className="maik-game-btn maik-game-btn-secondary"
                    onClick={finalizar}
                  >
                    <span>Saltar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="maik-game-btn maik-game-btn-secondary"
                    onClick={anterior}
                  >
                    <ArrowLeft size={16} />
                    <span>Anterior</span>
                  </button>
                )}

                <button
                  type="button"
                  className="maik-game-btn maik-game-btn-primary"
                  onClick={siguiente}
                  autoFocus
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
