'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Mensaje de error siempre visible (arriba de la pantalla), sin importar
// en qué parte de la rutina esté el socio.
export default function AvisoFlotante({ mensaje, detalle, onCerrar }) {
  const [montado, setMontado] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)

  useEffect(() => setMontado(true), [])

  if (!montado || !mensaje) return null

  return createPortal(
    <div
      role="alert"
      className="fixed inset-x-3 top-3 z-[450] mx-auto max-w-lg rounded-2xl border-2 border-red-400 bg-white p-4 text-zinc-950 shadow-2xl dark:bg-zinc-900 dark:text-white"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-base font-bold leading-6">{mensaje}</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="-mr-1 -mt-1 rounded-lg px-2 py-1 text-xl font-black text-zinc-500"
        >
          ×
        </button>
      </div>
      {detalle && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setVerDetalle((v) => !v)}
            className="text-sm font-semibold text-red-700 underline dark:text-red-300"
          >
            {verDetalle ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
          </button>
          {verDetalle && (
            <p className="mt-2 max-h-40 overflow-auto break-words rounded-lg bg-zinc-100 p-2 font-mono text-xs leading-5 text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
              {detalle}
            </p>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
