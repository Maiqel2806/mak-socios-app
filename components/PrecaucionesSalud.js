'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, HeartPulse, ShieldAlert, ShieldCheck } from 'lucide-react'

import { ZONAS, escribirPrecauciones, leerPrecauciones } from '@/lib/precauciones'

// Paso "Salud y precauciones" del perfil físico.
// En lugar de un texto libre que bloqueaba la rutina, el socio indica
// la zona y si es una molestia leve (la rutina se adapta) o un dolor
// actual (lo revisa el entrenador).

const opcion =
  'mak-interactive flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition'

export default function PrecaucionesSalud({ limitaciones, observaciones, onChange }) {
  const [estado, setEstado] = useState(() => leerPrecauciones(limitaciones, observaciones))

  useEffect(() => {
    const salida = escribirPrecauciones(estado)
    onChange(salida)
    // Solo cuando cambia el estado interno
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  const actualizar = (cambios) => setEstado((e) => ({ ...e, ...cambios }))

  const alternarZona = (codigo) =>
    setEstado((e) => {
      const zonas = { ...e.zonas }
      if (zonas[codigo]) delete zonas[codigo]
      else zonas[codigo] = 'leve'
      return { ...e, zonas }
    })

  const fijarNivel = (codigo, nivel) =>
    setEstado((e) => ({ ...e, zonas: { ...e.zonas, [codigo]: nivel } }))

  const seleccionadas = Object.keys(estado.zonas)
  const activas = seleccionadas.filter((k) => estado.zonas[k] === 'activa')
  const revision = estado.tiene === 'si' && (activas.length > 0 || estado.medica)

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-black">¿Tienes alguna lesión, dolor o condición de salud que debamos considerar?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={estado.tiene === 'no'}
            onClick={() => actualizar({ tiene: 'no', zonas: {}, medica: false, nota: '' })}
            className={`${opcion} ${estado.tiene === 'no' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100' : 'border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950'}`}
          >
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" /> No, estoy bien
          </button>
          <button
            type="button"
            aria-pressed={estado.tiene === 'si'}
            onClick={() => actualizar({ tiene: 'si' })}
            className={`${opcion} ${estado.tiene === 'si' ? 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100' : 'border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950'}`}
          >
            <ShieldAlert size={20} className="shrink-0 text-amber-600" /> Sí, tengo algo
          </button>
        </div>
      </fieldset>

      {estado.tiene === 'si' && (
        <>
          <fieldset>
            <legend className="text-sm font-black">¿Qué zona?</legend>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Puedes marcar varias.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(ZONAS).map(([codigo, z]) => (
                <button
                  key={codigo}
                  type="button"
                  aria-pressed={Boolean(estado.zonas[codigo])}
                  onClick={() => alternarZona(codigo)}
                  className={`mak-chip ${estado.zonas[codigo] ? 'mak-chip-activo' : ''}`}
                >
                  {z.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          {seleccionadas.map((codigo) => (
            <fieldset key={codigo} className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
              <legend className="px-1 text-sm font-black">{ZONAS[codigo].nombre}: ¿cómo está hoy?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={estado.zonas[codigo] === 'leve'}
                  onClick={() => fijarNivel(codigo, 'leve')}
                  className={`${opcion} ${estado.zonas[codigo] === 'leve' ? 'border-[#02AFBB] bg-cyan-50 dark:bg-cyan-500/10' : 'border-zinc-200 dark:border-white/10'}`}
                >
                  <span>
                    Molestia leve o lesión ya recuperada
                    <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">Puedo entrenar, pero quiero cuidarla.</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={estado.zonas[codigo] === 'activa'}
                  onClick={() => fijarNivel(codigo, 'activa')}
                  className={`${opcion} ${estado.zonas[codigo] === 'activa' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-zinc-200 dark:border-white/10'}`}
                >
                  <span>
                    Dolor actual, lesión reciente u operación
                    <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">Duele al moverla o fue en los últimos meses.</span>
                  </span>
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <span className="font-bold">Podrás entrenar:</span> {ZONAS[codigo].puedes}
              </p>
            </fieldset>
          ))}

          <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
            <input
              type="checkbox"
              checked={estado.medica}
              onChange={(e) => actualizar({ medica: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 accent-[#02AFBB]"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-bold"><HeartPulse size={16} className="text-red-500" /> Tengo una condición médica o indicación de mi doctor</span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">Por ejemplo: problemas del corazón, presión alta no controlada, embarazo o reposo indicado.</span>
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black">Cuéntanos más (opcional)</span>
            <textarea
              rows="2"
              value={estado.nota}
              onChange={(e) => actualizar({ nota: e.target.value })}
              className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
              placeholder="Ej.: rodilla derecha, me operaron del menisco hace 2 años."
            />
          </label>

          <div className={`flex gap-3 rounded-2xl p-4 text-sm leading-6 ${revision ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100' : 'bg-cyan-50 text-cyan-950 dark:bg-cyan-500/10 dark:text-cyan-100'}`}>
            {revision ? <ShieldAlert size={20} className="mt-0.5 shrink-0" /> : <ShieldCheck size={20} className="mt-0.5 shrink-0" />}
            <p>
              {revision
                ? 'Un entrenador revisará tu caso antes de generar la rutina, para cuidarte. Mientras tanto te diremos qué puedes hacer de forma segura.'
                : seleccionadas.length
                  ? 'Perfecto: tu rutina evitará los ejercicios que cargan esa zona y te avisaremos en los que debes tener cuidado.'
                  : 'Marca la zona para que podamos adaptar tu rutina.'}
            </p>
          </div>
        </>
      )}

      <label className="block">
        <span className="text-sm font-black">Otras observaciones (opcional)</span>
        <textarea
          rows="2"
          value={estado.notasLibres}
          onChange={(e) => actualizar({ notasLibres: e.target.value })}
          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
          placeholder="Horarios, preferencias, algo más que quieras contarnos…"
        />
      </label>
    </div>
  )
}
