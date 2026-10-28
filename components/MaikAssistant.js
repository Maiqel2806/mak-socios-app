'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import MaikPose from '@/components/MaikPose'

const MENSAJES = {
  '/inicio': {
    pose: 'saluda',
    titulo: '¡Hola! Soy MAIK',
    texto:
      'Si necesitas ayuda, puedo orientarte dentro de la app.',
  },
  '/progreso': {
    pose: 'celebra',
    titulo: 'Tu progreso',
    texto:
      'Aquí podrás revisar cómo vas avanzando en tus entrenamientos.',
  },
  default: {
    pose: 'explica',
    titulo: 'MAIK te acompaña',
    texto:
      'Estoy aquí para ayudarte a entender cada sección de la app.',
  },
}

export default function MaikAssistant() {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)

  if (pathname === '/login') return null

  const contenido = MENSAJES[pathname] || MENSAJES.default

  return (
    <div className="maik-helper">
      {abierto && (
        <div className="maik-helper-panel">
          <button
            type="button"
            className="maik-helper-close"
            aria-label="Cerrar ayuda"
            onClick={() => setAbierto(false)}
          >
            <X size={16} />
          </button>

          <div className="maik-helper-character">
            <MaikPose pose={contenido.pose} size={78} />
          </div>

          <div className="maik-helper-copy">
            <div className="maik-helper-kicker">MAIK · TU ASISTENTE</div>
            <h3>{contenido.titulo}</h3>
            <p>{contenido.texto}</p>
            {pathname === '/inicio' && (
              <button
                type="button"
                className="maik-helper-tour"
                onClick={() => {
                  setAbierto(false)
                  window.dispatchEvent(new Event('mak:abrir-guia'))
                }}
              >
                Ver recorrido <ArrowRight size={14}/>
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="maik-helper-trigger"
        onClick={() => setAbierto((v) => !v)}
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
