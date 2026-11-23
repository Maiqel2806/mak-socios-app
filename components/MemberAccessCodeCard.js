import { ScanLine } from 'lucide-react'

export default function MemberAccessCodeCard({ codigo }) {
  const codigoVisible = String(codigo || '').trim()

  return (
    <section
      aria-label="Código personal de ingreso al gimnasio"
      className="relative mb-3 flex items-center gap-4 overflow-hidden rounded-[22px] bg-zinc-950 px-4 py-3.5 text-white shadow-lg shadow-zinc-300/30 dark:bg-zinc-900 dark:shadow-black/20 sm:px-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#02AFBB]/10 blur-2xl"
      />

      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#02AFBB]/15 text-[#8AE0DB]">
        <ScanLine size={22} aria-hidden="true" />
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-bold text-[#8AE0DB]">Mi código de ingreso</p>
        <p className="text-sm leading-5 text-zinc-300">
          {codigoVisible ? 'Muéstralo en recepción' : 'Solicítalo en recepción'}
        </p>
      </div>

      {codigoVisible ? (
        <p className="relative shrink-0 font-mono text-[clamp(1.6rem,7.5vw,2.2rem)] font-extrabold leading-none tracking-[0.06em] tabular-nums text-white">
          {codigoVisible}
        </p>
      ) : (
        <p className="relative shrink-0 text-sm font-bold text-white">Pendiente</p>
      )}
    </section>
  )
}
