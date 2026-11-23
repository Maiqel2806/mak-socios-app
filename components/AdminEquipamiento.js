'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Dumbbell, Eye, Loader2, Plus, Sparkles } from 'lucide-react'

import ExerciseDemo from './ExerciseDemo'

const NIVELES = [
  ['principiante', 'Principiante'],
  ['intermedio', 'Intermedio'],
  ['avanzado', 'Avanzado'],
]

const OBJETIVOS = [
  ['ganar_musculo', 'Ganar músculo'],
  ['bajar_grasa', 'Bajar grasa'],
  ['fuerza', 'Fuerza'],
  ['tonificacion', 'Tonificación'],
  ['resistencia', 'Resistencia'],
  ['mantenerse', 'Mantenerse'],
]

const campo =
  'h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/15 dark:border-white/10 dark:bg-zinc-950'

export default function AdminEquipamiento() {
  const [pestana, setPestana] = useState('equipo')
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState('')
  const [nuevo, setNuevo] = useState({ nombre: '', zona: 'maquinas', incremento_kg: '', activo: true, nuevo: true })
  const [ejercicio, setEjercicio] = useState({ nombre: '', grupo: 'cuadriceps', patron: 'sentadilla', equipo: '', nivel_min: 1, nivel_max: 3, tipo: 'fuerza', guiado: true, compuesto: true, tecnica: '', imagen_url: '' })
  const [perfil, setPerfil] = useState({ objetivo: 'ganar_musculo', nivel: 'intermedio', dias_entrenamiento: 4, tiempo_sesion_min: 60 })
  const [preview, setPreview] = useState(null)
  const [diaPreview, setDiaPreview] = useState(0)

  async function llamar(cuerpo) {
    const r = await fetch('/api/admin/equipamiento', {
      method: cuerpo ? 'POST' : 'GET',
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
    const d = await r.json().catch(() => null)
    if (!r.ok || !d?.ok) throw new Error(d?.error || 'Error de conexión.')
    return d
  }

  useEffect(() => {
    llamar()
      .then(setDatos)
      .catch((e) => setError(e.message))
  }, [])

  const porZona = useMemo(() => {
    const grupos = {}
    for (const e of datos?.equipamiento || []) {
      ;(grupos[e.zona] ||= []).push(e)
    }
    return grupos
  }, [datos])

  async function guardarEquipo(equipo, clave) {
    setGuardando(clave)
    setError('')
    try {
      const d = await llamar({ accion: 'guardar_equipo', equipo })
      setDatos((actual) => ({ ...actual, ...d }))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setGuardando('')
    }
  }

  async function guardarEjercicio() {
    setGuardando('ejercicio')
    setError('')
    try {
      const d = await llamar({ accion: 'guardar_ejercicio', ejercicio: { ...ejercicio, equipo: [ejercicio.equipo] } })
      setDatos((actual) => ({ ...actual, ...d }))
      setEjercicio((x) => ({ ...x, nombre: '', tecnica: '', imagen_url: '' }))
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando('')
    }
  }

  async function generarPreview() {
    setGuardando('preview')
    setError('')
    try {
      const d = await llamar({ accion: 'vista_previa', perfil })
      setPreview(d.rutina)
      setDiaPreview(0)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando('')
    }
  }

  if (!datos && !error) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm font-bold text-zinc-500">
        <Loader2 className="animate-spin" size={18} /> Cargando equipamiento…
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-5">
      {datos && !datos.tablaLista && (
        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="shrink-0" size={20} />
          <p>
            Falta aplicar la migración <b>supabase/migrations/20261123_motor_rutinas_v4.sql</b>. Mientras tanto ves el catálogo por defecto y los cambios no se guardarán.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <div role="tablist" className="mak-segmented">
        {[
          ['equipo', 'Equipamiento', Dumbbell],
          ['ejercicios', 'Ejercicios propios', Plus],
          ['preview', 'Probar rutinas', Eye],
        ].map(([id, texto, Icono]) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className="mak-segmented-item"
          >
            <Icono size={15} /> {texto}
          </button>
        ))}
      </div>

      {pestana === 'equipo' && (
        <>
          <section className="mak-card p-4 sm:p-5">
            <h2 className="text-base font-black">Agregar máquina o equipo</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Si la máquina ya tiene ejercicios en la biblioteca (p. ej. Smith, abductores, kettlebells), se usarán al activarla. Si es totalmente nueva, crea sus ejercicios en “Ejercicios propios”.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <input className={campo} placeholder="Nombre (ej. Sentadilla hack)" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
              <select className={campo} value={nuevo.zona} onChange={(e) => setNuevo({ ...nuevo, zona: e.target.value })}>
                {Object.entries(datos?.zonas || {}).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input className={campo} inputMode="decimal" placeholder="Salto de peso (kg)" value={nuevo.incremento_kg} onChange={(e) => setNuevo({ ...nuevo, incremento_kg: e.target.value })} />
              <button
                disabled={guardando === 'nuevo'}
                onClick={async () => {
                  if (await guardarEquipo(nuevo, 'nuevo')) setNuevo({ nombre: '', zona: nuevo.zona, incremento_kg: '', activo: true, nuevo: true })
                }}
                className="mak-btn-primary h-11 px-5"
              >
                {guardando === 'nuevo' ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Agregar
              </button>
            </div>
          </section>

          {Object.entries(porZona).map(([zona, lista]) => (
            <section key={zona} className="mak-card overflow-hidden">
              <h3 className="border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                {datos?.zonas?.[zona] || zona}
              </h3>
              <ul className="divide-y divide-zinc-100 dark:divide-white/10">
                {lista.map((eq) => (
                  <li key={eq.codigo} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold">
                        {eq.nombre}
                        {eq.nuevo && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                            <Sparkles size={10} /> Nuevo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {eq.codigo}
                        {eq.incremento_kg ? ` · saltos de ${String(eq.incremento_kg).replace('.', ',')} kg` : ''}
                      </p>
                    </div>
                    {eq.codigo !== 'peso_corporal' && (
                      <input
                        aria-label={`Salto de peso de ${eq.nombre}`}
                        defaultValue={eq.incremento_kg ?? ''}
                        inputMode="decimal"
                        placeholder="kg"
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v !== String(eq.incremento_kg ?? '')) guardarEquipo({ ...eq, incremento_kg: v }, eq.codigo)
                        }}
                        className="h-9 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-center text-sm font-bold dark:border-white/10 dark:bg-zinc-950"
                      />
                    )}
                    <button
                      role="switch"
                      aria-checked={eq.activo !== false}
                      disabled={eq.codigo === 'peso_corporal' || guardando === eq.codigo}
                      onClick={() => guardarEquipo({ ...eq, activo: eq.activo === false }, eq.codigo)}
                      className={`relative h-7 w-12 rounded-full transition ${eq.activo !== false ? 'bg-[#02AFBB]' : 'bg-zinc-300 dark:bg-zinc-700'} disabled:opacity-50`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${eq.activo !== false ? 'left-6' : 'left-1'}`} />
                      <span className="sr-only">{eq.activo !== false ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      {pestana === 'ejercicios' && (
        <section className="mak-card p-4 sm:p-5">
          <h2 className="text-base font-black">Nuevo ejercicio para una máquina</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className={campo} placeholder="Nombre del ejercicio" value={ejercicio.nombre} onChange={(e) => setEjercicio({ ...ejercicio, nombre: e.target.value })} />
            <select className={campo} value={ejercicio.equipo} onChange={(e) => setEjercicio({ ...ejercicio, equipo: e.target.value })}>
              <option value="">Equipo que usa…</option>
              {(datos?.equipamiento || []).map((eq) => (
                <option key={eq.codigo} value={eq.codigo}>{eq.nombre}</option>
              ))}
            </select>
            <select className={campo} value={ejercicio.grupo} onChange={(e) => setEjercicio({ ...ejercicio, grupo: e.target.value })}>
              {Object.entries(datos?.grupos || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={campo} value={ejercicio.patron} onChange={(e) => setEjercicio({ ...ejercicio, patron: e.target.value })}>
              {Object.entries(datos?.patrones || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={campo} value={ejercicio.nivel_min} onChange={(e) => setEjercicio({ ...ejercicio, nivel_min: Number(e.target.value) })}>
              <option value={1}>Desde principiante</option>
              <option value={2}>Desde intermedio</option>
              <option value={3}>Solo avanzado</option>
            </select>
            <input className={campo} placeholder="URL de imagen o GIF (opcional)" value={ejercicio.imagen_url} onChange={(e) => setEjercicio({ ...ejercicio, imagen_url: e.target.value })} />
            <textarea className={`${campo} h-24 py-2 sm:col-span-2`} placeholder="Técnica: indicaciones de ejecución" value={ejercicio.tecnica} onChange={(e) => setEjercicio({ ...ejercicio, tecnica: e.target.value })} />
            <div className="flex flex-wrap gap-4 text-sm font-semibold sm:col-span-2">
              {[
                ['guiado', 'Máquina guiada'],
                ['compuesto', 'Multiarticular'],
                ['unilateral', 'Unilateral'],
                ['seg', 'Se mide en segundos'],
              ].map(([k, t]) => (
                <label key={k} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(ejercicio[k])} onChange={(e) => setEjercicio({ ...ejercicio, [k]: e.target.checked })} className="h-4 w-4 accent-[#02AFBB]" />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <button onClick={guardarEjercicio} disabled={guardando === 'ejercicio'} className="mak-btn-primary mt-4 h-11 px-5">
            {guardando === 'ejercicio' ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Guardar ejercicio
          </button>

          {(datos?.personalizados || []).length > 0 && (
            <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-100 dark:divide-white/10 dark:border-white/10">
              {datos.personalizados.map((x) => (
                <li key={x.codigo} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="font-bold">{x.nombre}</span>
                  <span className="text-xs text-zinc-500">{datos.patrones?.[x.patron]} · {(x.equipo || []).join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {pestana === 'preview' && (
        <section className="mak-card p-4 sm:p-5">
          <h2 className="text-base font-black">Probar el motor de rutinas</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Genera rutinas de ejemplo con el equipamiento activo. No se guarda nada.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <select className={campo} value={perfil.objetivo} onChange={(e) => setPerfil({ ...perfil, objetivo: e.target.value })}>
              {OBJETIVOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={campo} value={perfil.nivel} onChange={(e) => setPerfil({ ...perfil, nivel: e.target.value })}>
              {NIVELES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={campo} value={perfil.dias_entrenamiento} onChange={(e) => setPerfil({ ...perfil, dias_entrenamiento: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>)}
            </select>
            <select className={campo} value={perfil.tiempo_sesion_min} onChange={(e) => setPerfil({ ...perfil, tiempo_sesion_min: Number(e.target.value) })}>
              {[30, 40, 45, 50, 60].map((t) => <option key={t} value={t}>{t} min</option>)}
            </select>
            <button onClick={generarPreview} disabled={guardando === 'preview'} className="mak-btn-primary h-11">
              {guardando === 'preview' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Generar
            </button>
          </div>

          {preview && (
            <div className="mt-5">
              <p className="mak-display text-xl">{preview.nombre}</p>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {preview.dias.map((d, i) => (
                  <button key={d.dia} onClick={() => setDiaPreview(i)} className={`mak-chip ${i === diaPreview ? 'mak-chip-activo' : ''}`}>
                    Día {d.dia}
                  </button>
                ))}
              </div>
              {preview.dias[diaPreview] && (
                <div className="mt-4">
                  <p className="text-sm font-black">{preview.dias[diaPreview].titulo}</p>
                  <p className="text-xs text-zinc-500">{preview.dias[diaPreview].regla_tiempo}</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {preview.dias[diaPreview].ejercicios.map((x) => (
                      <li key={x.codigo} className="flex gap-3 rounded-xl border border-zinc-100 p-2.5 dark:border-white/10">
                        <ExerciseDemo imagenes={x.imagenes} nombre={x.nombre} tamano="sm" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#02AFBB]">
                            {x.superserie || x.bloque} · {x.bloque_titulo}
                          </p>
                          <p className="truncate text-sm font-bold">{x.nombre}</p>
                          <p className="text-xs text-zinc-500">
                            {x.series} × {x.repeticiones} · {x.descanso_seg}s
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
