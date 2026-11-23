'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Flame, Lightbulb, Play, ShieldAlert, Sparkles, Timer } from 'lucide-react'

// Panel principal del inicio: qué toca hoy, la semana y la racha.
// Abre la rutina directamente en el día que corresponde.

const CONSEJOS = [
  'Toma agua antes, durante y después de entrenar: unos 500 ml en la sesión.',
  'Si completaste todas las series en el tope del rango, la próxima vez sube un poco el peso.',
  'Dormir 7 a 9 horas mejora tu fuerza y tu recuperación tanto como entrenar.',
  'La técnica primero: un peso que puedes controlar rinde más que uno que te obliga a balancearte.',
  'Una caminata de 20 minutos en tus días libres acelera tu recuperación.',
  'Incluye proteína en cada comida: carnes, huevos, lácteos o legumbres.',
  'Anota tus series: lo que se mide, mejora.',
  'Calienta siempre: 5 minutos bastan para preparar articulaciones y músculos.',
]

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function saludo(hora) {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function abrirRutina(dia) {
  window.dispatchEvent(new CustomEvent('mak:abrir-rutina', { detail: { dia } }))
}

export default function HomeHoy({
  nombre,
  activo,
  diasMembresia,
  tienePerfil,
  requiereRevision,
  proximoDia,
  diasPlan,
  semanaActual = [],
  racha = 0,
}) {
  const [ahora, setAhora] = useState(null)
  const [consejo, setConsejo] = useState(0)

  useEffect(() => {
    const d = new Date()
    setAhora(d)
    const diaDelAno = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
    setConsejo(diaDelAno % CONSEJOS.length)
  }, [])

  // Días entrenados esta semana (lunes = 0) en hora local
  const entrenados = useMemo(() => {
    const set = new Set()
    for (const f of semanaActual) set.add((new Date(f).getDay() + 6) % 7)
    return set
  }, [semanaActual])

  const hoy = ahora ? (ahora.getDay() + 6) % 7 : -1
  const hechos = entrenados.size
  const meta = Math.max(1, Number(diasPlan) || 0)
  const pct = diasPlan ? Math.min(1, hechos / meta) : 0
  const yaEntrenoHoy = entrenados.has(hoy)

  const radio = 34
  const circ = 2 * Math.PI * radio

  return (
    <section className="mak-hoy mt-4 overflow-hidden rounded-[28px] text-white" aria-label="Tu día en MAK FITNESS">
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cyan-200/90">
            {ahora ? `${saludo(ahora.getHours())}, ${nombre}` : `Hola, ${nombre}`}
          </p>

          {!activo ? (
            <>
              <h2 className="mak-display mt-1 text-3xl sm:text-4xl">Renueva y vuelve a entrenar</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Tu membresía no está activa. Renuévala en recepción o revisa las formas de pago en “Mi membresía”.
              </p>
            </>
          ) : !tienePerfil ? (
            <>
              <h2 className="mak-display mt-1 text-3xl sm:text-4xl">Crea tu rutina en 1 minuto</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Cuéntanos tu objetivo y tu nivel: armamos tu plan con las máquinas del gimnasio.
              </p>
              <button type="button" onClick={() => abrirRutina(null)} className="mak-btn-primary mt-4 min-h-12 px-5">
                <Sparkles size={18} aria-hidden="true" /> Crear mi rutina
              </button>
            </>
          ) : requiereRevision ? (
            <>
              <h2 className="mak-display mt-1 text-3xl sm:text-4xl">Primero, cuidarte</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Tu entrenador revisará tu información de salud. Mira qué puedes hacer mientras tanto.
              </p>
              <button type="button" onClick={() => abrirRutina(null)} className="mak-btn-primary mt-4 min-h-12 px-5">
                <ShieldAlert size={18} aria-hidden="true" /> Ver qué puedo hacer
              </button>
            </>
          ) : proximoDia ? (
            <>
              <p className="mt-3 text-xs font-semibold text-zinc-400">
                {yaEntrenoHoy ? '¡Ya entrenaste hoy! Lo siguiente es' : 'Hoy te toca'}
              </p>
              <h2 className="mak-display mt-1 text-3xl leading-[0.95] sm:text-[2.6rem]">
                Día {proximoDia.dia} · {proximoDia.titulo}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300">
                {proximoDia.minutos ? (
                  <span className="inline-flex items-center gap-1.5"><Timer size={15} aria-hidden="true" /> {proximoDia.minutos} min</span>
                ) : null}
                <span>{proximoDia.ejercicios} ejercicios</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => abrirRutina(proximoDia.dia)} className="mak-btn-primary min-h-12 px-5">
                  <Play size={18} aria-hidden="true" /> {yaEntrenoHoy ? 'Ver el siguiente' : 'Empezar'}
                </button>
                <button type="button" onClick={() => abrirRutina(null)} className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-white/20 px-4 text-sm font-bold hover:bg-white/10">
                  Mi semana <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mak-display mt-1 text-3xl sm:text-4xl">Genera tu rutina</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">Tu perfil está listo. Genera tu plan de entrenamiento.</p>
              <button type="button" onClick={() => abrirRutina(null)} className="mak-btn-primary mt-4 min-h-12 px-5">
                <Sparkles size={18} aria-hidden="true" /> Generar rutina
              </button>
            </>
          )}
        </div>

        {activo && tienePerfil && (
          <div className="flex items-center gap-4 rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10">
            <div className="relative h-[84px] w-[84px] shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="40" cy="40" r={radio} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r={radio}
                  fill="none"
                  stroke="#02AFBB"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - pct)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <p className="mak-cifra text-2xl">{hechos}<span className="text-sm text-zinc-400">/{diasPlan || '–'}</span></p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300"><CalendarDays size={14} aria-hidden="true" /> Esta semana</p>
              <ol className="mt-2 flex gap-1.5" aria-label="Días entrenados esta semana">
                {DIAS.map((d, i) => (
                  <li
                    key={d + i}
                    title={entrenados.has(i) ? 'Entrenaste' : i === hoy ? 'Hoy' : ''}
                    className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${
                      entrenados.has(i)
                        ? 'bg-[#02AFBB] text-[#04232a]'
                        : i === hoy
                          ? 'ring-2 ring-[#5FE3EA] text-white'
                          : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {d}
                  </li>
                ))}
              </ol>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-300">
                <Flame size={14} className="text-orange-400" aria-hidden="true" />
                {racha > 0 ? `${racha} ${racha === 1 ? 'semana' : 'semanas'} seguidas` : 'Empieza tu racha esta semana'}
                {Number.isFinite(diasMembresia) && diasMembresia >= 0 && (
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                    Membresía: {diasMembresia} {diasMembresia === 1 ? 'día' : 'días'}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setConsejo((c) => (c + 1) % CONSEJOS.length)}
        className="flex w-full items-start gap-3 border-t border-white/10 bg-black/15 px-5 py-3.5 text-left text-sm leading-6 text-zinc-200 transition hover:bg-black/25 sm:px-6"
        aria-label="Ver otro consejo"
      >
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
        <span className="flex-1">{CONSEJOS[consejo]}</span>
        <span className="shrink-0 text-xs font-bold text-cyan-300">Otro consejo</span>
      </button>
    </section>
  )
}
