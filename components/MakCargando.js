'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Pantalla de carga con muñequitos MAK entrenando en bucle:
// dominadas, flexiones, abdominales, sentadillas y jumping jacks.
// Personajes originales (líneas simples con los colores de la marca).

const EJERCICIOS = ['dominadas', 'flexiones', 'abdominales', 'sentadillas', 'saltos']

const NOMBRES = {
  dominadas: 'Dominadas',
  flexiones: 'Flexiones',
  abdominales: 'Abdominales',
  sentadillas: 'Sentadillas',
  saltos: 'Jumping jacks',
}

const FRASES = [
  'Ajustando el pin…',
  'Cargando las placas…',
  'Calentando motores…',
  'Una repetición más…',
  'Contando tus series…',
  'Ajustando la barra…',
]

/* Cada figura usa grupos animados por CSS (clases mk-*) */
function Figura({ ejercicio }) {
  const trazo = { stroke: 'currentColor', strokeWidth: 6, strokeLinecap: 'round', fill: 'none' }
  const torso = { ...trazo, stroke: 'var(--mk-acento, #02AFBB)', strokeWidth: 8 }
  const cabeza = { fill: 'currentColor' }

  if (ejercicio === 'dominadas') {
    return (
      <svg viewBox="0 0 120 120" className="mk-figura" aria-hidden="true">
        <line x1="24" y1="14" x2="24" y2="108" {...trazo} strokeWidth="4" opacity=".35" />
        <line x1="96" y1="14" x2="96" y2="108" {...trazo} strokeWidth="4" opacity=".35" />
        <line x1="18" y1="18" x2="102" y2="18" {...trazo} strokeWidth="5" opacity=".7" />
        <g className="mk-dom-brazo">
          <line x1="49" y1="18" x2="53" y2="50" {...trazo} />
          <line x1="71" y1="18" x2="67" y2="50" {...trazo} />
        </g>
        <g className="mk-dom-cuerpo">
          <circle cx="60" cy="40" r="7.5" {...cabeza} />
          <line x1="60" y1="50" x2="60" y2="74" {...torso} />
          <line x1="60" y1="74" x2="55" y2="97" {...trazo} />
          <line x1="60" y1="74" x2="65" y2="97" {...trazo} />
        </g>
      </svg>
    )
  }

  if (ejercicio === 'flexiones') {
    return (
      <svg viewBox="0 0 120 120" className="mk-figura" aria-hidden="true">
        <line x1="8" y1="106" x2="112" y2="106" {...trazo} strokeWidth="3" opacity=".3" />
        <g className="mk-flex-brazo">
          <line x1="40" y1="104" x2="40" y2="84" {...trazo} />
        </g>
        <g className="mk-flex-cuerpo">
          <circle cx="29" cy="79" r="7.5" {...cabeza} />
          <line x1="40" y1="84" x2="72" y2="93" {...torso} />
          <line x1="72" y1="93" x2="100" y2="101" {...trazo} />
        </g>
      </svg>
    )
  }

  if (ejercicio === 'abdominales') {
    return (
      <svg viewBox="0 0 120 120" className="mk-figura" aria-hidden="true">
        <line x1="8" y1="106" x2="112" y2="106" {...trazo} strokeWidth="3" opacity=".3" />
        <polyline points="54,101 74,82 92,103" {...trazo} />
        <g className="mk-abd-torso">
          <line x1="54" y1="101" x2="54" y2="74" {...torso} />
          <circle cx="54" cy="64" r="7.5" {...cabeza} />
          <line x1="47" y1="80" x2="61" y2="80" {...trazo} strokeWidth="5" />
        </g>
      </svg>
    )
  }

  if (ejercicio === 'sentadillas') {
    // Vista de perfil en 3 cuadros (de pie, media, abajo), como un sprite
    const pose = (k, rodilla, cadera, hombro, cab, mano) => (
      <g className={`mk-sent-${k}`}>
        <polyline points={`60,104 ${rodilla} ${cadera}`} {...trazo} />
        <line x1={cadera.split(',')[0]} y1={cadera.split(',')[1]} x2={hombro.split(',')[0]} y2={hombro.split(',')[1]} {...torso} />
        <circle cx={cab.split(',')[0]} cy={cab.split(',')[1]} r="7.5" {...cabeza} />
        <line x1={hombro.split(',')[0]} y1={hombro.split(',')[1]} x2={mano.split(',')[0]} y2={mano.split(',')[1]} {...trazo} strokeWidth="5" />
      </g>
    )
    return (
      <svg viewBox="0 0 120 120" className="mk-figura" aria-hidden="true">
        <line x1="8" y1="106" x2="112" y2="106" {...trazo} strokeWidth="3" opacity=".3" />
        <line x1="54" y1="104" x2="70" y2="104" {...trazo} strokeWidth="5" />
        {pose('a', '61,84', '58,64', '60,42', '61,31', '80,48')}
        {pose('b', '71,87', '54,77', '62,56', '65,45', '84,58')}
        {pose('c', '78,92', '50,91', '63,70', '68,60', '88,70')}
      </svg>
    )
  }

  // Jumping jacks
  return (
    <svg viewBox="0 0 120 120" className="mk-figura" aria-hidden="true">
      <line x1="8" y1="106" x2="112" y2="106" {...trazo} strokeWidth="3" opacity=".3" />
      <g className="mk-salto-cuerpo">
        <g className="mk-salto-pierna-i"><line x1="60" y1="76" x2="54" y2="103" {...trazo} /></g>
        <g className="mk-salto-pierna-d"><line x1="60" y1="76" x2="66" y2="103" {...trazo} /></g>
        <g className="mk-salto-brazo-i"><line x1="60" y1="54" x2="48" y2="74" {...trazo} strokeWidth="5" /></g>
        <g className="mk-salto-brazo-d"><line x1="60" y1="54" x2="72" y2="74" {...trazo} strokeWidth="5" /></g>
        <line x1="60" y1="52" x2="60" y2="77" {...torso} />
        <circle cx="60" cy="42" r="7.5" {...cabeza} />
      </g>
    </svg>
  )
}

/**
 * @param pantallaCompleta  cubre toda la pantalla, por encima de todo
 * @param mensaje           texto principal (si no, frases divertidas)
 * @param ejercicio         fija un ejercicio; si no, rota cada pocos segundos
 */
export default function MakCargando({
  pantallaCompleta = false,
  mensaje = '',
  submensaje = '',
  ejercicio = null,
  compacto = false,
  portal = false,
}) {
  const [indice, setIndice] = useState(0)
  const [frase, setFrase] = useState(0)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    setIndice(Math.floor(Math.random() * EJERCICIOS.length))
    setFrase(Math.floor(Math.random() * FRASES.length))
    const a = window.setInterval(() => setIndice((i) => (i + 1) % EJERCICIOS.length), 3600)
    const b = window.setInterval(() => setFrase((i) => (i + 1) % FRASES.length), 1800)
    return () => {
      window.clearInterval(a)
      window.clearInterval(b)
    }
  }, [])

  const actual = ejercicio || EJERCICIOS[indice]

  const contenido = (
    <div
      role="status"
      aria-live="polite"
      aria-label={mensaje || 'Cargando'}
      className={`mk-cargando ${compacto ? 'mk-cargando-compacto' : ''}`}
    >
      <div className="mk-escena">
        <div key={actual} className="mk-entrada">
          <Figura ejercicio={actual} />
        </div>
        <span className="mk-sombra" aria-hidden="true" />
      </div>
      {!compacto && <p className="mk-etiqueta">{NOMBRES[actual]}</p>}
      <p className="mk-mensaje">{mensaje || FRASES[frase]}</p>
      {submensaje && !compacto && <p className="mk-submensaje">{submensaje}</p>}
      {!compacto && (
        <div className="mk-puntos" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}
    </div>
  )

  if (!pantallaCompleta) return contenido

  // Sin portal (p. ej. loading.js de una ruta): se dibuja en su lugar.
  // Con portal (dentro de ventanas con animación): se dibuja en <body>.
  if (!portal) return <div className="mk-cargando-pantalla">{contenido}</div>
  if (!montado) return null

  return createPortal(
    <div className="mk-cargando-pantalla">{contenido}</div>,
    document.body
  )
}
