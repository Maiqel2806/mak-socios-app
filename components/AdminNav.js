import Link from 'next/link'

const SECCIONES = [
  { href: '/admin/accesos', texto: 'Accesos de socios' },
  { href: '/admin/equipamiento', texto: 'Equipamiento y rutinas' },
]

export default function AdminNav({ actual }) {
  return (
    <nav aria-label="Administración" className="mt-4 flex flex-wrap gap-2">
      {SECCIONES.map((s) => (
        <Link key={s.href} href={s.href}
          aria-current={actual === s.href ? 'page' : undefined}
          className={actual === s.href
            ? 'rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-zinc-950'
            : 'rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10'}>
          {s.texto}
        </Link>
      ))}
    </nav>
  )
}
