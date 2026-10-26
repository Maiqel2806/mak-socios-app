'use client'

import Link from 'next/link'
import { ArrowUpRight, TrendingUp } from 'lucide-react'
import ExclusiveBenefitCard from './ExclusiveBenefitCard'

export default function ProgressEntryCard({
  activo,
  estadoMembresia,
}) {
  if (!activo) {
    return (
      <ExclusiveBenefitCard
        tipo="progreso"
        titulo="Progreso"
        subtitulo="Mis resultados"
        activo={false}
        estadoMembresia={estadoMembresia}
      />
    )
  }

  return (
    <Link
      href="/progreso"
      className="mak-interactive group flex min-h-[136px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-cyan-400/50 dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
          <TrendingUp size={23} />
        </div>

        <ArrowUpRight
          size={20}
          className="text-zinc-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-600"
        />
      </div>

      <div>
        <p className="font-black text-zinc-950 dark:text-white">
          Progreso
        </p>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Mis resultados
        </p>
      </div>
    </Link>
  )
}
