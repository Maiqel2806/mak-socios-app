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
      className="mak-tile mak-tile-progreso group"
    >
      <TrendingUp aria-hidden="true" className="mak-tile-deco" strokeWidth={1.2} />

      <div className="flex items-start justify-between">
        <div className="mak-tile-icono">
          <TrendingUp size={24} />
        </div>

        <ArrowUpRight
          size={22}
          className="mak-tile-flecha"
        />
      </div>

      <div>
        <p className="mak-tile-titulo">
          Mi progreso
        </p>

        <p className="mak-tile-sub">
          Récords y constancia
        </p>
      </div>
    </Link>
  )
}
