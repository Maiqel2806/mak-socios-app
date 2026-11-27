'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dumbbell, Lightbulb, Loader2, MessageSquarePlus, Search, Sparkles } from 'lucide-react'

import ExerciseDemo from './ExerciseDemo'
import MakCargando from './MakCargando'
import { OBJETIVOS, SECUNDARIOS_VALIDOS, tituloObjetivo } from '@/lib/objetivos'

const NIVELES = [
  ['principiante', 'Principiante'],
  ['intermedio', 'Intermedio'],
  ['avanzado', 'Avanzado'],
]

const CATEGORIAS = [
  ['rutinas', 'Rutinas'],
  ['ejercicio', 'Ejercicio'],
  ['equipo', 'Máquinas y equipo'],
  ['app', 'La app'],
  ['otro', 'Otro'],
]

const ESTADOS = {
  nueva: ['Nueva', 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/15 dark:text-cyan-200'],
  en_revision: ['En revisión', 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'],
  aplicada: ['Aplicada', 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'],
  descartada: ['Descartada', 'bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'],
}

const REGISTRO = {
  tiempo: 'Se marca como hecha',
  corporal: 'Solo repeticiones',
  carga: 'Peso y repeticiones',
}

const campo =
  'h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-base outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-zinc-950'
const etiqueta = 'mb-1.5 block text-sm font-bold text-zinc-700 dark:text-zinc-200'
const tarjeta = 'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-5'

async function pedir(url, opciones) {
  const r = await fetch(url, opciones)
  const datos = await r.json().catch(() => ({}))
  if (!r.ok || !datos.ok) throw new Error(datos.error || 'Algo salió mal. Intenta de nuevo.')
  return datos
}

// ------------------------------------------------------------ Simulador
function Simulador({ zonas, onSugerir }) {
  const [perfil, setPerfil] = useState({
    objetivo: 'bajar_grasa', objetivo_secundario: '', nivel: 'principiante',
    dias_entrenamiento: 3, tiempo_sesion_min: 60, peso_kg: '80', estatura_cm: '170', edad: '30', zonas: [],
  })
  const [rutina, setRutina] = useState(null)
  const [dia, setDia] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cambiar = (k, v) => setPerfil((p) => ({ ...p, [k]: v }))

  async function generar(e) {
    e?.preventDefault()
    setCargando(true)
    setError('')
    try {
      const datos = await pedir('/api/entrenador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil }),
      })
      setRutina(datos.rutina)
      setDia(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const diaActual = rutina?.dias?.[dia]

  return (
    <div className="space-y-5">
      <form onSubmit={generar} className={tarjeta}>
        <p className="text-lg font-black">Socio de prueba</p>
        <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-300">
          Arma un perfil y mira qué rutina le daría la app. No se guarda nada.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="sim-objetivo">Objetivo</label>
            <select id="sim-objetivo" className={campo} value={perfil.objetivo} onChange={(e) => cambiar('objetivo', e.target.value)}>
              {OBJETIVOS.map((o) => <option key={o.valor} value={o.valor}>{o.titulo}</option>)}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="sim-secundario">Objetivo secundario</label>
            <select id="sim-secundario" className={campo} value={perfil.objetivo_secundario} onChange={(e) => cambiar('objetivo_secundario', e.target.value)}>
              <option value="">Ninguno</option>
              {SECUNDARIOS_VALIDOS.filter((v) => v !== perfil.objetivo).map((v) => <option key={v} value={v}>{tituloObjetivo(v)}</option>)}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="sim-nivel">Nivel</label>
            <select id="sim-nivel" className={campo} value={perfil.nivel} onChange={(e) => cambiar('nivel', e.target.value)}>
              {NIVELES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={etiqueta} htmlFor="sim-dias">Días por semana</label>
              <select id="sim-dias" className={campo} value={perfil.dias_entrenamiento} onChange={(e) => cambiar('dias_entrenamiento', Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={etiqueta} htmlFor="sim-min">Minutos</label>
              <select id="sim-min" className={campo} value={perfil.tiempo_sesion_min} onChange={(e) => cambiar('tiempo_sesion_min', Number(e.target.value))}>
                {[30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <div>
              <label className={etiqueta} htmlFor="sim-peso">Peso (kg)</label>
              <input id="sim-peso" inputMode="decimal" className={campo} value={perfil.peso_kg} onChange={(e) => cambiar('peso_kg', e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="sim-talla">Talla (cm)</label>
              <input id="sim-talla" inputMode="decimal" className={campo} value={perfil.estatura_cm} onChange={(e) => cambiar('estatura_cm', e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="sim-edad">Edad</label>
              <input id="sim-edad" inputMode="numeric" className={campo} value={perfil.edad} onChange={(e) => cambiar('edad', e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </div>
          </div>
        </div>

        {Object.keys(zonas || {}).length > 0 && (
          <fieldset className="mt-4">
            <legend className={etiqueta}>Molestias o zonas a cuidar</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(zonas).map(([codigo, nombre]) => {
                const activa = perfil.zonas.includes(codigo)
                return (
                  <button key={codigo} type="button" aria-pressed={activa}
                    onClick={() => cambiar('zonas', activa ? perfil.zonas.filter((z) => z !== codigo) : [...perfil.zonas, codigo])}
                    className={`min-h-11 rounded-xl border px-3 text-[15px] font-bold ${activa ? 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' : 'border-zinc-300 text-zinc-700 dark:border-white/15 dark:text-zinc-200'}`}>
                    {nombre}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-[15px] font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

        <button type="submit" disabled={cargando}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#02AFBB] px-5 text-base font-black text-[#052e34] disabled:opacity-60 sm:w-auto">
          <Sparkles size={18} aria-hidden="true" /> Generar rutina
        </button>
      </form>

      {cargando && <MakCargando compacto mensaje="Armando la rutina…" />}

      {rutina && !cargando && (
        <section className={tarjeta}>
          <h2 className="text-xl font-black leading-tight">{rutina.nombre}</h2>
          {rutina.perfil_corporal?.imc && (
            <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-300">
              IMC {String(rutina.perfil_corporal.imc).replace('.', ',')} · {rutina.dias_semana} días · hasta {rutina.tiempo_maximo_sesion_min} min
            </p>
          )}
          {rutina.advertencia && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[15px] leading-6 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{rutina.advertencia}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Días">
            {rutina.dias.map((d, i) => (
              <button key={d.dia} type="button" role="tab" aria-selected={i === dia} onClick={() => setDia(i)}
                className={`min-h-11 rounded-xl px-4 text-[15px] font-bold ${i === dia ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'border border-zinc-300 text-zinc-700 dark:border-white/15 dark:text-zinc-200'}`}>
                Día {d.dia}
              </button>
            ))}
          </div>

          {diaActual && (
            <div className="mt-4">
              <p className="text-lg font-black">{diaActual.titulo}</p>
              <p className="text-[15px] text-zinc-600 dark:text-zinc-300">
                {diaActual.ejercicios.length} ejercicios · unos {diaActual.duracion_estimada_min} min
              </p>

              <ol className="mt-3 space-y-3">
                {diaActual.ejercicios.map((ej, i) => (
                  <li key={`${ej.codigo}-${i}`} className="rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-black leading-snug">
                          {ej.superserie && <span className="mr-1.5 rounded-md bg-zinc-950 px-1.5 py-0.5 text-xs text-white dark:bg-white dark:text-zinc-950">{ej.superserie}</span>}
                          {ej.nombre}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{[ej.grupo_muscular, ej.equipamiento].filter(Boolean).join(' · ')}</p>
                      </div>
                      <p className="shrink-0 text-right text-base font-black tabular-nums">
                        {ej.series}×{ej.repeticiones}
                        {ej.descanso_seg ? <span className="block text-xs font-semibold text-zinc-500">{ej.descanso_seg}s descanso</span> : null}
                      </p>
                    </div>
                    {ej.recomendacion && <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{ej.recomendacion}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ej.imagenes?.length > 0 && <ExerciseDemo imagenes={ej.imagenes} nombre={ej.nombre} tecnica={ej.tecnica} />}
                      <button type="button"
                        onClick={() => onSugerir({
                          categoria: 'rutinas',
                          titulo: `Cambio en ${ej.nombre}`,
                          ejercicio_codigo: ej.codigo,
                          contexto: { perfil, dia: diaActual.titulo, prescripcion: `${ej.series}x${ej.repeticiones}` },
                        })}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-sm font-bold text-zinc-700 dark:border-white/15 dark:text-zinc-200">
                        <MessageSquarePlus size={16} aria-hidden="true" /> Sugerir cambio
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ------------------------------------------------------------ Biblioteca
function Biblioteca({ datos, onSugerir }) {
  const [texto, setTexto] = useState('')
  const [grupo, setGrupo] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(true)

  const lista = useMemo(() => {
    const q = texto.trim().toLowerCase()
    return (datos?.ejercicios || []).filter((e) =>
      (!grupo || e.grupo === grupo) &&
      (!soloDisponibles || e.disponible) &&
      (!q || e.nombre.toLowerCase().includes(q))
    )
  }, [datos, texto, grupo, soloDisponibles])

  if (!datos) return <MakCargando compacto mensaje="Cargando ejercicios…" />

  return (
    <div className="space-y-4">
      <div className={`${tarjeta} grid gap-3 sm:grid-cols-[1fr_200px]`}>
        <div className="relative">
          <label htmlFor="bib-buscar" className="sr-only">Buscar ejercicio</label>
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input id="bib-buscar" className={`${campo} pl-10`} placeholder="Buscar ejercicio" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <select aria-label="Grupo muscular" className={campo} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
          <option value="">Todos los grupos</option>
          {Object.entries(datos.grupos || {}).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[15px] font-semibold sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-[#02AFBB]" checked={soloDisponibles} onChange={(e) => setSoloDisponibles(e.target.checked)} />
          Solo con equipo disponible en el gimnasio
        </label>
      </div>

      <p className="text-[15px] text-zinc-600 dark:text-zinc-300">{lista.length} ejercicios</p>

      <ul className="grid gap-3 md:grid-cols-2">
        {lista.map((e) => (
          <li key={e.codigo} className={tarjeta}>
            <p className="text-base font-black leading-snug">{e.nombre}</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {e.grupo_nombre} · {e.equipo.map((x) => x.nombre).join(', ')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-white/10">Nivel {e.nivel_min === e.nivel_max ? e.nivel_min : `${e.nivel_min}-${e.nivel_max}`}</span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-white/10">Registro: {REGISTRO[e.registro]}</span>
              {!e.disponible && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">Falta equipo</span>}
            </div>
            {e.tecnica && <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{e.tecnica}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {e.imagenes?.length > 0 && <ExerciseDemo imagenes={e.imagenes} nombre={e.nombre} tecnica={e.tecnica} />}
              <button type="button"
                onClick={() => onSugerir({ categoria: 'ejercicio', titulo: `Sobre ${e.nombre}`, ejercicio_codigo: e.codigo })}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-sm font-bold text-zinc-700 dark:border-white/15 dark:text-zinc-200">
                <MessageSquarePlus size={16} aria-hidden="true" /> Sugerir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ------------------------------------------------------------ Sugerencias
function Sugerencias({ borrador, onBorradorUsado }) {
  const [lista, setLista] = useState(null)
  const [gestionar, setGestionar] = useState(false)
  const [faltaTabla, setFaltaTabla] = useState(false)
  const [form, setForm] = useState({ categoria: 'rutinas', titulo: '', detalle: '', ejercicio_codigo: '', contexto: null })
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function cargar() {
    try {
      const datos = await pedir('/api/entrenador/sugerencias')
      setLista(datos.sugerencias)
      setGestionar(Boolean(datos.puede_gestionar))
      setFaltaTabla(Boolean(datos.falta_tabla))
    } catch (e) {
      setError(e.message)
      setLista([])
    }
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!borrador) return
    setForm({ categoria: 'rutinas', titulo: '', detalle: '', ejercicio_codigo: '', contexto: null, ...borrador })
    setMensaje('')
    onBorradorUsado()
    document.getElementById('sug-detalle')?.focus()
  }, [borrador, onBorradorUsado])

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    setMensaje('')
    try {
      const datos = await pedir('/api/entrenador/sugerencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setLista((l) => [datos.sugerencia, ...(l || [])])
      setForm({ categoria: 'rutinas', titulo: '', detalle: '', ejercicio_codigo: '', contexto: null })
      setMensaje('¡Gracias! Tu sugerencia quedó registrada.')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function actualizar(id, cambios) {
    try {
      const datos = await pedir('/api/entrenador/sugerencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...cambios }),
      })
      setLista((l) => l.map((s) => (s.id === id ? datos.sugerencia : s)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={enviar} className={tarjeta}>
        <p className="text-lg font-black">Nueva sugerencia</p>
        <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-300">
          ¿Un ejercicio que cambiarías, una máquina que falta o algo de la app? Cuéntalo aquí.
        </p>
        {faltaTabla && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            El buzón aún no está activado: falta ejecutar 20261127_modo_entrenador.sql en Supabase.
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label className={etiqueta} htmlFor="sug-cat">Tema</label>
            <select id="sug-cat" className={campo} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="sug-titulo">Título</label>
            <input id="sug-titulo" className={campo} maxLength={120} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Cambiar dominadas por jalón en principiantes" />
          </div>
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="sug-detalle">Detalle</label>
            <textarea id="sug-detalle" rows={4} maxLength={3000} value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-base leading-6 outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-zinc-950"
              placeholder="Qué cambiarías y por qué." />
          </div>
        </div>
        {form.contexto?.dia && (
          <p className="mt-2 text-sm text-zinc-500">Se adjunta el perfil simulado y el día «{form.contexto.dia}».</p>
        )}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-[15px] font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
        {mensaje && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-[15px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">{mensaje}</p>}
        <button type="submit" disabled={enviando}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#02AFBB] px-5 text-base font-black text-[#052e34] disabled:opacity-60">
          {enviando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Lightbulb size={18} aria-hidden="true" />}
          Enviar sugerencia
        </button>
      </form>

      <section>
        <h2 className="text-lg font-black">{gestionar ? 'Sugerencias del equipo' : 'Mis sugerencias'}</h2>
        {lista === null && <MakCargando compacto mensaje="Cargando sugerencias…" />}
        {lista?.length === 0 && <p className="mt-2 text-[15px] text-zinc-600 dark:text-zinc-300">Todavía no hay sugerencias.</p>}
        <ul className="mt-3 space-y-3">
          {(lista || []).map((s) => (
            <li key={s.id} className={tarjeta}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-black leading-snug">{s.titulo}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTADOS[s.estado]?.[1] || ''}`}>{ESTADOS[s.estado]?.[0] || s.estado}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {CATEGORIAS.find(([v]) => v === s.categoria)?.[1]} · {s.autor_nombre} · {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-6">{s.detalle}</p>
              {s.respuesta && !gestionar && (
                <p className="mt-2 rounded-xl bg-cyan-50 p-3 text-[15px] leading-6 text-cyan-950 dark:bg-cyan-500/10 dark:text-cyan-100"><strong>Respuesta:</strong> {s.respuesta}</p>
              )}
              {gestionar && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr]">
                  <select aria-label="Estado" className={campo} value={s.estado} onChange={(e) => actualizar(s.id, { estado: e.target.value })}>
                    {Object.entries(ESTADOS).map(([v, [t]]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                  <input aria-label="Respuesta al entrenador" className={campo} defaultValue={s.respuesta || ''} placeholder="Respuesta (se guarda al salir del campo)"
                    onBlur={(e) => e.target.value !== (s.respuesta || '') && actualizar(s.id, { respuesta: e.target.value })} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ------------------------------------------------------------ Panel
export default function EntrenadorPanel() {
  const [pestana, setPestana] = useState('simulador')
  const [datos, setDatos] = useState(null)
  const [borrador, setBorrador] = useState(null)

  useEffect(() => {
    pedir('/api/entrenador').then(setDatos).catch(() => setDatos({ ejercicios: [], grupos: {}, zonas: {} }))
  }, [])

  function sugerir(b) {
    setBorrador(b)
    setPestana('sugerencias')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pestanas = [
    ['simulador', 'Simulador', Sparkles],
    ['ejercicios', 'Ejercicios', Dumbbell],
    ['sugerencias', 'Sugerencias', Lightbulb],
  ]

  return (
    <div className="mt-5">
      <div role="tablist" aria-label="Secciones" className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-zinc-900">
        {pestanas.map(([v, t, Icono]) => (
          <button key={v} type="button" role="tab" aria-selected={pestana === v} onClick={() => setPestana(v)}
            className={`inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-[15px] font-bold ${pestana === v ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-300'}`}>
            <Icono size={17} aria-hidden="true" className="hidden sm:block" /> {t}
          </button>
        ))}
      </div>

      {pestana === 'simulador' && <Simulador zonas={datos?.zonas} onSugerir={sugerir} />}
      {pestana === 'ejercicios' && <Biblioteca datos={datos} onSugerir={sugerir} />}
      {pestana === 'sugerencias' && <Sugerencias borrador={borrador} onBorradorUsado={() => setBorrador(null)} />}
    </div>
  )
}
