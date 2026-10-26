'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'

export default function MakConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Volver',
  loadingText = 'Procesando...',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const anterior = document.activeElement
    const overflowAnterior = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    function teclado(evento) {
      if (evento.key === 'Escape' && !busy) {
        evento.preventDefault()
        onCancel()
      }

      if (evento.key === 'Tab') {
        const botones = Array.from(
          document.querySelectorAll(
            '[data-mak-confirm] button:not(:disabled)'
          )
        )

        if (!botones.length) return

        const primero = botones[0]
        const ultimo = botones[botones.length - 1]

        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault()
          ultimo.focus()
        } else if (
          !evento.shiftKey &&
          document.activeElement === ultimo
        ) {
          evento.preventDefault()
          primero.focus()
        }
      }
    }

    document.addEventListener('keydown', teclado)

    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', teclado)
      anterior?.focus?.()
    }
  }, [open, busy, onCancel])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-black/65 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !busy) {
          onCancel()
        }
      }}
    >
      <div
        data-mak-confirm
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="mak-modal-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-zinc-900 sm:rounded-[28px] sm:p-7"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={26} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar confirmación"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 disabled:opacity-40 dark:bg-white/10 dark:text-zinc-300"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
          MAK FITNESS
        </p>

        <h2
          id={titleId}
          className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white"
        >
          {title}
        </h2>

        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300"
        >
          {description}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="mak-interactive min-h-12 rounded-2xl border border-zinc-200 px-3 py-3 text-sm font-bold text-zinc-700 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="mak-interactive flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={17} className="animate-spin" />}
            {busy ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
