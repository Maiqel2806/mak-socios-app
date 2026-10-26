'use client'

import { useCallback, useState } from 'react'
import MakConfirmDialog from './MakConfirmDialog'

export default function WorkoutCancelControl({
  onCancelado,
}) {
  const [abierto, setAbierto] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const cerrar = useCallback(() => {
    if (procesando) return

    setAbierto(false)
    setError('')
  }, [procesando])

  function abrir() {
    if (procesando) return

    setError('')
    setAbierto(true)
  }

  async function confirmar() {
    if (procesando) return

    setProcesando(true)
    setError('')

    try {
      const respuesta = await fetch('/api/entrenamiento', {
        method: 'DELETE',
      })

      const datos = await respuesta.json().catch(() => null)

      if (!respuesta.ok || datos?.ok !== true) {
        throw new Error(
          datos?.error ||
          'No fue posible cancelar el entrenamiento.'
        )
      }

      setAbierto(false)
      onCancelado?.()

    } catch (fallo) {
      setError(
        fallo?.message ||
        'No se pudo cancelar la sesión. Intenta nuevamente.'
      )
    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        disabled={procesando}
        className="mak-interactive min-h-12 w-full rounded-2xl border border-red-200 px-4 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Cancelar entrenamiento
      </button>

      <MakConfirmDialog
        open={abierto}
        title="¿Cancelar entrenamiento?"
        description="Tu sesión quedará registrada como cancelada y no contará como un entrenamiento completado. Si deseas continuar, regresa a tus ejercicios."
        confirmText="Sí, cancelar"
        cancelText="Continuar"
        loadingText="Cancelando..."
        busy={procesando}
        error={error}
        onConfirm={confirmar}
        onCancel={cerrar}
      />
    </>
  )
}
