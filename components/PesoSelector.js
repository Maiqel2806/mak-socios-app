'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Keyboard, Minus, Plus, RotateCcw, X } from 'lucide-react'

// Selector de peso interactivo, como en el gimnasio:
//  - "pila":       máquina de placas → tocas o deslizas el pin a la placa.
//  - "barra":      cargas discos por lado y la app suma barra + discos.
//  - "mancuernas": eliges la mancuerna del rack.
// Siempre hay opción de escribir el peso exacto (cualquier valor).

const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25]
const COLOR_DISCO = {
  25: '#d9363e', 20: '#2f6fd6', 15: '#e5b52c', 10: '#2f9e5a', 5: '#f2f2f2', 2.5: '#1c1c1c', 1.25: '#9aa4aa',
}

export function tipoDeEquipo(ejercicio) {
  const t = `${ejercicio?.equipamiento || ''} ${ejercicio?.nombre_realizado || ejercicio?.nombre || ''}`.toLowerCase()
  if (/mancuern/.test(t)) return 'mancuernas'
  if (/barra (ol[ií]mpica|z)|con barra|barra y discos|smith/.test(t)) return 'barra'
  if (/m[aá]quina|polea|prensa|jal[oó]n|remo sentado|pec deck|extensi[oó]n|curl femoral|hip thrust en m|abductor|gemelos en m/.test(t)) return 'pila'
  return 'libre'
}

const kg = (v) => String(Math.round(Number(v) * 100) / 100).replace('.', ',')

function vibrar(ms = 8) {
  try { navigator.vibrate?.(ms) } catch {}
}

/* ------------------------------------------------------------ Pila con pin */
function Pila({ valor, setValor, incremento }) {
  const paso = incremento > 0 ? incremento : 2.5
  const PLACAS = 20
  // Si el peso supera la pila visible, cada placa representa más kilos
  const [multiplo] = useState(() => Math.max(1, Math.ceil((Number(valor) || 0) / (paso * (PLACAS - 2)))))
  const salto = Math.round(paso * multiplo * 100) / 100
  const lista = Array.from({ length: PLACAS }, (_, i) => Math.round((i + 1) * salto * 100) / 100)
  const zona = useRef(null)
  const arrastrando = useRef(false)

  const elegirDesdePunto = (clientY) => {
    const caja = zona.current?.getBoundingClientRect()
    if (!caja) return
    const fila = Math.floor(((clientY - caja.top) / caja.height) * PLACAS)
    const v = lista[Math.min(PLACAS - 1, Math.max(0, fila))]
    setValor((actual) => {
      if (actual !== v) vibrar(6)
      return v
    })
  }

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex w-16 shrink-0 flex-col justify-between py-1 text-center text-xs text-zinc-400">
        <span>Desliza el pin</span>
        <span>{multiplo > 1 ? `Cada placa: ${kg(salto)} kg` : `Placas de ${kg(salto)} kg`}</span>
      </div>
      <ol
        ref={zona}
        role="listbox"
        aria-label="Placas de la máquina"
        className="relative min-w-0 flex-1 touch-none select-none space-y-[3px] rounded-2xl bg-zinc-800 p-2"
        onPointerDown={(e) => {
          arrastrando.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          elegirDesdePunto(e.clientY)
        }}
        onPointerMove={(e) => arrastrando.current && elegirDesdePunto(e.clientY)}
        onPointerUp={() => { arrastrando.current = false }}
        onPointerCancel={() => { arrastrando.current = false }}
      >
        <span className="pointer-events-none absolute inset-y-2 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-black/30" aria-hidden="true" />
        {lista.map((v) => {
          const activa = v === valor
          const levantada = v <= valor
          return (
            <li key={v} role="option" aria-selected={activa}>
              <button
                type="button"
                tabIndex={activa ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setValor(Math.min(lista[PLACAS - 1], v + salto)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setValor(Math.max(lista[0], v - salto)) }
                }}
                className={`relative flex h-[19px] w-full items-center justify-between rounded-md px-3 text-xs font-bold transition-colors duration-100 ${
                  levantada
                    ? 'bg-gradient-to-r from-[#02AFBB] to-[#36cfd6] text-[#04232a]'
                    : 'bg-gradient-to-r from-zinc-600 to-zinc-500 text-zinc-100'
                }`}
              >
                <span className="tabular-nums">{kg(v)}</span>
                <span className="opacity-70">kg</span>
                {activa && (
                  <span className="mak-pin pointer-events-none absolute left-full top-1/2 ml-2 flex -translate-y-1/2 items-center" aria-hidden="true">
                    <span className="h-1.5 w-4 rounded-full bg-zinc-200" />
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg ring-2 ring-white">PIN</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="w-12 shrink-0" aria-hidden="true" />
    </div>
  )
}

/* ------------------------------------------------------------ Barra con discos */
function Barra({ setValor, valorInicial }) {
  const [barra, setBarra] = useState(20)
  const [discos, setDiscos] = useState(() => {
    // Reconstruye una carga aproximada desde el valor actual
    let resto = Math.max(0, (Number(valorInicial) - 20) / 2)
    const lista = []
    for (const d of DISCOS) {
      while (resto >= d - 0.001 && lista.length < 10) { lista.push(d); resto -= d }
    }
    return lista
  })

  const total = barra + 2 * discos.reduce((a, b) => a + b, 0)
  useEffect(() => { setValor(Math.round(total * 100) / 100) }, [total, setValor])

  return (
    <div>
      <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Peso de la barra">
        <span className="text-sm font-semibold text-zinc-400">Barra:</span>
        {[20, 15, 10].map((b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={barra === b}
            onClick={() => { setBarra(b); vibrar() }}
            className={`min-h-11 rounded-full px-4 text-sm font-bold ${barra === b ? 'bg-white text-zinc-950' : 'bg-white/10 text-zinc-200'}`}
          >
            {b} kg
          </button>
        ))}
      </div>

      {/* Dibujo de la barra con los discos de un lado (el otro es espejo) */}
      <div className="relative mx-auto mt-5 flex h-36 max-w-sm items-center justify-center" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-500" />
        {[-1, 1].map((lado) => (
          <div key={lado} className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 ${lado < 0 ? 'right-1/2 mr-10 flex-row-reverse' : 'left-1/2 ml-10'}`}>
            <div className="h-8 w-2 rounded-sm bg-zinc-400" />
            {discos.map((d, i) => (
              <div
                key={i}
                className="mak-disco rounded-md shadow ring-1 ring-black/20"
                style={{
                  background: COLOR_DISCO[d],
                  width: d >= 10 ? 14 : 10,
                  height: d >= 20 ? 128 : d >= 15 ? 112 : d >= 10 ? 96 : d >= 5 ? 72 : d >= 2.5 ? 56 : 44,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <p className="mt-2 text-center text-sm text-zinc-400">Toca un disco para ponerlo en cada lado</p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {DISCOS.map((d) => (
          <button
            key={d}
            type="button"
            disabled={discos.length >= 10}
            onClick={() => { setDiscos((x) => [...x, d].sort((a, b) => b - a)); vibrar(12) }}
            className="flex h-14 flex-col items-center justify-center rounded-2xl text-sm font-black shadow-sm ring-1 ring-black/10 disabled:opacity-40"
            style={{ background: COLOR_DISCO[d], color: [5, 1.25].includes(d) ? '#111' : '#fff' }}
          >
            {kg(d)}
            <span className="text-[11px] font-semibold opacity-80">kg</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setDiscos((x) => x.slice(0, -1)); vibrar() }}
          className="flex h-14 flex-col items-center justify-center rounded-2xl bg-white/10 text-xs font-bold text-white"
        >
          <RotateCcw size={18} /> Quitar
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ Rack de mancuernas */
function Mancuernas({ valor, setValor, incremento }) {
  const paso = incremento > 0 ? incremento : 2
  const lista = useMemo(() => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const resto = Array.from({ length: 20 }, (_, i) => 12 + i * Math.max(2, paso))
    return [...new Set([...base, ...resto])].filter((v) => v <= 60)
  }, [paso])

  return (
    <div>
      <p className="text-center text-sm text-zinc-400">Peso de cada mancuerna</p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {lista.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === valor}
            onClick={() => { setValor(v); vibrar(10) }}
            className={`group relative flex h-16 flex-col items-center justify-center rounded-2xl transition ${v === valor ? 'bg-[#02AFBB] text-[#04232a] ring-2 ring-white' : 'bg-white/10 text-white'}`}
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              <span className={`h-4 w-1.5 rounded-sm ${v === valor ? 'bg-[#04232a]' : 'bg-zinc-300'}`} />
              <span className={`h-1 w-4 ${v === valor ? 'bg-[#04232a]' : 'bg-zinc-400'}`} />
              <span className={`h-4 w-1.5 rounded-sm ${v === valor ? 'bg-[#04232a]' : 'bg-zinc-300'}`} />
            </span>
            <span className="mt-1 text-base font-black tabular-nums">{kg(v)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ Hoja principal */
export default function PesoSelector({ abierto, onCerrar, onElegir, valorInicial, ejercicio, incremento, sugerido }) {
  const tipoBase = tipoDeEquipo(ejercicio)
  const [tipo, setTipo] = useState(tipoBase === 'libre' ? 'pila' : tipoBase)
  const [valor, setValor] = useState(0)
  const [escribiendo, setEscribiendo] = useState(false)
  const [texto, setTexto] = useState('')
  const [apertura, setApertura] = useState(0)

  useEffect(() => {
    if (!abierto) return
    const inicial = Number(String(valorInicial || sugerido || '').replace(',', '.')) || 0
    setValor(inicial)
    setTexto(inicial ? kg(inicial) : '')
    setEscribiendo(false)
    setTipo(tipoBase === 'libre' ? 'pila' : tipoBase)
    setApertura((n) => n + 1)
    const alTeclado = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  if (!abierto || typeof document === 'undefined' || apertura === 0) return null

  const fino = (delta) => {
    setValor((v) => Math.max(0, Math.round((v + delta) * 100) / 100))
    vibrar()
  }

  const confirmar = () => {
    const final = escribiendo ? Number(String(texto).replace(',', '.')) : valor
    if (!Number.isFinite(final) || final < 0 || final > 500) return
    onElegir(Math.round(final * 100) / 100)
    vibrar([10, 30, 20])
  }

  return createPortal(
    <div className="fixed inset-0 z-[420] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elegir peso"
        onClick={(e) => e.stopPropagation()}
        className="mak-modal-sheet flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-[#0D1417] text-white shadow-2xl sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-300">Elige tu peso</p>
            <p className="truncate text-base font-bold text-zinc-200">{ejercicio?.nombre_realizado || ejercicio?.nombre}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Marcador grande */}
        <div className="flex items-center justify-center gap-4 px-5 pb-2 pt-3">
          <button type="button" onClick={() => fino(-(incremento > 0 ? incremento : 1))} aria-label="Restar" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 active:scale-90">
            <Minus size={20} />
          </button>
          {escribiendo ? (
            <input
              autoFocus
              inputMode="decimal"
              value={texto}
              onChange={(e) => setTexto(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6))}
              className="w-40 rounded-2xl bg-white/10 py-2 text-center text-5xl font-black tabular-nums outline-none ring-2 ring-[#02AFBB]"
              aria-label="Peso en kilos"
            />
          ) : (
            <p className="mak-cifra min-w-[9rem] text-center text-6xl tabular-nums" aria-live="polite">
              {kg(valor)}<span className="ml-1 text-2xl text-zinc-400">kg</span>
            </p>
          )}
          <button type="button" onClick={() => fino(incremento > 0 ? incremento : 1)} aria-label="Sumar" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 active:scale-90">
            <Plus size={20} />
          </button>
        </div>

        {sugerido && !escribiendo && (
          <button type="button" onClick={() => { setValor(Number(String(sugerido).replace(',', '.'))); vibrar() }} className="mx-auto mb-1 rounded-full bg-cyan-500/15 px-3 py-1.5 text-sm font-semibold text-cyan-200">
            Sugerido hoy: {sugerido} kg
          </button>
        )}

        {/* Tipo de equipo */}
        {!escribiendo && (
          <div className="mx-5 mt-2 flex gap-1 rounded-2xl bg-white/5 p-1" role="tablist">
            {[
              ['pila', 'Máquina'],
              ['barra', 'Barra'],
              ['mancuernas', 'Mancuernas'],
            ].map(([id, t]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tipo === id}
                onClick={() => setTipo(id)}
                className={`min-h-10 flex-1 rounded-xl text-sm font-bold ${tipo === id ? 'bg-white text-zinc-950' : 'text-zinc-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {escribiendo ? (
            <p className="text-center text-sm text-zinc-400">Escribe el peso exacto (por ejemplo 12,4 o 27).</p>
          ) : tipo === 'pila' ? (
            <Pila key={`p${apertura}`} valor={valor} setValor={setValor} incremento={incremento} />
          ) : tipo === 'barra' ? (
            <Barra key={`b${apertura}`} setValor={setValor} valorInicial={valor} />
          ) : (
            <Mancuernas valor={valor} setValor={setValor} incremento={incremento} />
          )}
        </div>

        <div className="flex gap-2 border-t border-white/10 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={() => setEscribiendo((e) => !e)}
            className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold"
          >
            <Keyboard size={18} /> {escribiendo ? 'Selector' : 'Escribir'}
          </button>
          <button type="button" onClick={confirmar} className="mak-btn-primary min-h-14 flex-1 rounded-2xl text-lg">
            <Check size={20} /> Fijar {escribiendo ? '' : `${kg(valor)} kg`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
