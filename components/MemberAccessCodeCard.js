'use client'

import { useState } from 'react'
import { Check, ClipboardCopy, ScanLine, ShieldCheck } from 'lucide-react'

export default function MemberAccessCodeCard({ codigo }) {
  const [copiado, setCopiado] = useState(false)
  const codigoVisible = String(codigo || '').trim()

  async function copiarCodigo() {
    if (!codigoVisible) return

    try {
      await navigator.clipboard.writeText(codigoVisible)
    } catch {
      // Respaldo compatible con navegadores sin Clipboard API.
      const input = document.createElement('textarea')
      input.value = codigoVisible
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      const exito = document.execCommand('copy')
      input.remove()
      if (!exito) return
    }

    setCopiado(true)
  }

  return (
    <section
      aria-label="Código personal de ingreso al gimnasio"
      className="relative mb-3 overflow-hidden rounded-[22px] bg-zinc-950 px-4 py-4 text-white shadow-lg shadow-zinc-300/30 dark:bg-zinc-900 dark:shadow-black/20 sm:px-5"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#02AFBB]/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#8AE0DB]">
            <ScanLine size={17} aria-hidden="true" />
            <p className="text-[11px] font-black uppercase tracking-[0.12em]">
              Mi código de ingreso
            </p>
          </div>
          {codigoVisible ? (
            <p className="mt-2 break-all font-mono text-[clamp(1.7rem,8vw,2.2rem)] font-extrabold leading-none tracking-[0.08em] tabular-nums text-white">
              {codigoVisible}
            </p>
          ) : (
            <p className="mt-2 text-sm font-bold text-white">
              Código pendiente de asignación
            </p>
          )}
        </div>
        {codigoVisible && (
          <button
            type="button"
            onClick={copiarCodigo}
            aria-label="Copiar mi código de ingreso"
            className="mak-interactive flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-bold text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8AE0DB]"
          >
            {copiado ? <Check size={18} /> : <ClipboardCopy size={18} />}
            <span className="hidden min-[355px]:inline">{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
        )}
      </div>
      <p aria-live="polite" className="relative mt-3 flex items-center gap-2 text-[11px] leading-4 text-zinc-300">
        <ShieldCheck size={14} className="shrink-0 text-[#8AE0DB]" aria-hidden="true" />
        {codigoVisible
          ? 'Preséntalo en recepción para registrar tu ingreso.'
          : 'Solicítalo al personal de recepción de MAK FITNESS.'}
        {copiado && codigoVisible ? <span className="sr-only">Código copiado correctamente.</span> : null}
      </p>
    </section>
  )
}
