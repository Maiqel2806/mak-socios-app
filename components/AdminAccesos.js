'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Copy, KeyRound, Loader2, Search, ShieldCheck } from 'lucide-react'

const fecha = (valor) => {
  if (!valor) return 'Nunca'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const TIPO_CLAVE = {
  personal: 'Contraseña personal (la cambió el socio)',
  cedula: 'Su número de cédula',
  aleatoria: 'Clave temporal',
}

function TarjetaSocio({ socio, onActualizado }) {
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)

  async function ejecutar(accion) {
    setOcupado(accion)
    setError('')
    try {
      const r = await fetch('/api/admin/accesos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miembro_id: socio.id, accion }),
      })
      const datos = await r.json().catch(() => ({}))
      if (!r.ok || !datos.ok) throw new Error(datos.error || 'No se pudo completar la acción.')
      if (accion === 'restablecer') setResultado(datos)
      setConfirmando(false)
      onActualizado(datos.socio)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado('')
    }
  }

  const mensajeSocio = resultado
    ? resultado.usa_cedula
      ? `Hola ${socio.nombre.split(' ')[0]}, restablecimos tu acceso a la app MAK. Ingresa en https://mak-socios-app.vercel.app con tu código ${socio.codigo_acceso} y como contraseña tu número de cédula. Luego puedes cambiarla en Configuración.`
      : `Hola ${socio.nombre.split(' ')[0]}, restablecimos tu acceso a la app MAK. Ingresa en https://mak-socios-app.vercel.app con tu código ${socio.codigo_acceso} y la clave temporal ${resultado.clave_temporal}. Al entrar te pedirá crear una contraseña personal.`
    : ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensajeSocio)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black leading-tight">{socio.nombre || 'Sin nombre'}</h3>
          <p className="mt-1 text-[15px] text-zinc-600 dark:text-zinc-300">
            Código <strong className="text-zinc-950 dark:text-white">{socio.codigo_acceso || '—'}</strong>
            {socio.cedula_final && <> · Cédula {socio.cedula_final}</>}
          </p>
        </div>
        {socio.problemas.length === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ShieldCheck size={16} aria-hidden="true" /> Acceso correcto
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-800 dark:bg-red-500/15 dark:text-red-300">
            <AlertTriangle size={16} aria-hidden="true" /> Requiere atención
          </span>
        )}
      </div>

      {socio.tiene_cuenta && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
          <div><dt className="text-sm text-zinc-500">Contraseña actual</dt><dd className="font-semibold">{TIPO_CLAVE[socio.tipo_clave] || '—'}</dd></div>
          <div><dt className="text-sm text-zinc-500">Último ingreso</dt><dd className="font-semibold">{fecha(socio.ultimo_acceso)}</dd></div>
          {socio.clave_actualizada && (
            <div><dt className="text-sm text-zinc-500">Cambió su contraseña</dt><dd className="font-semibold">{fecha(socio.clave_actualizada)}</dd></div>
          )}
          <div><dt className="text-sm text-zinc-500">Acceso a la app</dt><dd className="font-semibold">{socio.cuenta_activa ? 'Activo' : 'Desactivado'}</dd></div>
        </dl>
      )}

      {socio.problemas.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-xl bg-red-50 p-3 text-[15px] text-red-900 dark:bg-red-500/10 dark:text-red-200">
          {socio.problemas.map((p) => <li key={p}>• {p}</li>)}
        </ul>
      )}
      {socio.avisos.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {socio.avisos.map((a) => <li key={a}>• {a}</li>)}
        </ul>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-[15px] font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

      {resultado && (
        <div className="mt-4 rounded-xl border-2 border-cyan-400 bg-cyan-50 p-4 dark:bg-cyan-500/10">
          <p className="flex items-center gap-2 text-base font-black text-cyan-950 dark:text-cyan-100">
            <Check size={18} aria-hidden="true" /> Contraseña restablecida
          </p>
          <p className="mt-1 text-[15px] text-cyan-950 dark:text-cyan-100">
            {resultado.usa_cedula
              ? 'Ahora entra con su código y su número de cédula.'
              : <>Clave temporal: <strong className="font-mono text-lg">{resultado.clave_temporal}</strong> (solo se muestra esta vez).</>}
          </p>
          <button type="button" onClick={copiar}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-zinc-950">
            <Copy size={16} aria-hidden="true" /> {copiado ? 'Mensaje copiado' : 'Copiar mensaje para el socio'}
          </button>
        </div>
      )}

      {socio.tiene_cuenta && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!socio.cuenta_activa && (
            <button type="button" onClick={() => ejecutar('activar')} disabled={Boolean(ocupado)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-[15px] font-bold disabled:opacity-60 dark:border-white/15">
              {ocupado === 'activar' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Activar acceso
            </button>
          )}

          {!confirmando ? (
            <button type="button" onClick={() => { setConfirmando(true); setResultado(null) }} disabled={Boolean(ocupado)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#02AFBB] px-4 py-3 text-[15px] font-black text-[#052e34] disabled:opacity-60">
              <KeyRound size={17} aria-hidden="true" /> Restablecer contraseña
            </button>
          ) : (
            <div className="w-full rounded-xl border border-zinc-300 p-3 dark:border-white/15">
              <p className="text-[15px] font-semibold">
                {socio.cedula_final
                  ? `La contraseña de ${socio.nombre.split(' ')[0]} pasará a ser su número de cédula. Su contraseña actual dejará de funcionar.`
                  : 'Se generará una clave temporal. Su contraseña actual dejará de funcionar.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => ejecutar('restablecer')} disabled={Boolean(ocupado)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#02AFBB] px-4 py-2.5 text-[15px] font-black text-[#052e34] disabled:opacity-60">
                  {ocupado === 'restablecer' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Sí, restablecer
                </button>
                <button type="button" onClick={() => setConfirmando(false)} disabled={Boolean(ocupado)}
                  className="rounded-xl px-4 py-2.5 text-[15px] font-bold text-zinc-600 dark:text-zinc-300">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function AdminAccesos() {
  const [q, setQ] = useState('')
  const [socios, setSocios] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function buscar(e) {
    e?.preventDefault()
    if (q.trim().length < 2) {
      setError('Escribe al menos 2 caracteres.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const r = await fetch(`/api/admin/accesos?q=${encodeURIComponent(q.trim())}`)
      const datos = await r.json().catch(() => ({}))
      if (!r.ok || !datos.ok) throw new Error(datos.error || 'No se pudo buscar.')
      setSocios(datos.socios)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  function actualizar(socio) {
    if (!socio) return
    setSocios((lista) => lista.map((s) => (s.id === socio.id ? socio : s)))
  }

  return (
    <section className="mt-6">
      <form onSubmit={buscar} className="flex gap-2">
        <label htmlFor="buscar-socio" className="sr-only">Buscar socio</label>
        <input id="buscar-socio" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Código, cédula o nombre"
          className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none focus:border-[#02AFBB] focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-zinc-950" />
        <button type="submit" disabled={cargando}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-950 px-5 text-base font-bold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950">
          {cargando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
          Buscar
        </button>
      </form>

      {error && <p role="alert" className="mt-3 text-[15px] font-semibold text-red-700 dark:text-red-300">{error}</p>}

      {socios && socios.length === 0 && (
        <p className="mt-6 text-[15px] text-zinc-600 dark:text-zinc-300">No encontramos socios con esa búsqueda. Prueba con el código o la cédula completa.</p>
      )}

      <div className="mt-5 space-y-4">
        {(socios || []).map((s) => <TarjetaSocio key={s.id} socio={s} onActualizado={actualizar} />)}
      </div>
    </section>
  )
}
