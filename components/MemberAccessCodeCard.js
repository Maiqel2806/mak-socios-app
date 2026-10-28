import { ScanLine, ShieldCheck } from 'lucide-react'

export default function MemberAccessCodeCard({ codigo }) {
  const codigoVisible = String(codigo || '').trim()

  return (
    <section
      aria-label="Código personal de ingreso al gimnasio"
      className="relative mb-3 overflow-hidden rounded-[22px] bg-zinc-950 px-4 py-4 text-white shadow-lg shadow-zinc-300/30 dark:bg-zinc-900 dark:shadow-black/20 sm:px-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#02AFBB]/10 blur-2xl"
      />

      <div className="relative">
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

      <p className="relative mt-3 flex items-center gap-2 text-[11px] leading-4 text-zinc-300">
        <ShieldCheck
          size={14}
          className="shrink-0 text-[#8AE0DB]"
          aria-hidden="true"
        />
        {codigoVisible
          ? 'Preséntalo en recepción para registrar tu ingreso.'
          : 'Solicítalo al personal de recepción de MAK FITNESS.'}
      </p>
    </section>
  )
}
