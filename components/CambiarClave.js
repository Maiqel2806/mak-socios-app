'use client'

import { useState } from 'react'

const campo = 'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-[#02AFBB] dark:border-white/15 dark:bg-zinc-950 dark:text-white'

export default function CambiarClave() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function guardar(evento) {
    evento.preventDefault()
    setMensaje('')

    if (nueva.length < 12 || nueva.length > 72) {
      setMensaje('La nueva contraseña debe tener entre 12 y 72 caracteres.')
      return
    }

    if (nueva !== confirmacion) {
      setMensaje('Las nuevas contraseñas no coinciden.')
      return
    }

    setOcupado(true)

    try {
      const respuesta = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual, nueva })
      })

      const resultado = await respuesta.json()

      if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.error || 'No se pudo cambiar la contraseña.')
      }

      window.location.replace('/login?clave=actualizada')
    } catch (error) {
      setMensaje(error.message)
      setOcupado(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="actual" className="mb-2 block text-sm font-semibold">
          Contraseña actual
        </label>
        <input id="actual" type="password" required
          autoComplete="current-password" value={actual}
          onChange={e => setActual(e.target.value)} className={campo}/>
      </div>

      <div>
        <label htmlFor="nueva" className="mb-2 block text-sm font-semibold">
          Nueva contraseña
        </label>
        <input id="nueva" type="password" required minLength={12}
          autoComplete="new-password" value={nueva}
          onChange={e => setNueva(e.target.value)} className={campo}/>
      </div>

      <div>
        <label htmlFor="confirmacion" className="mb-2 block text-sm font-semibold">
          Confirmar nueva contraseña
        </label>
        <input id="confirmacion" type="password" required
          autoComplete="new-password" value={confirmacion}
          onChange={e => setConfirmacion(e.target.value)} className={campo}/>
      </div>

      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Utiliza una contraseña única de al menos 12 caracteres.
        Después del cambio deberás ingresar nuevamente.
      </p>

      {mensaje && <p role="alert" className="text-sm text-rose-500">{mensaje}</p>}

      <button type="submit" disabled={ocupado}
        className="w-full rounded-xl bg-[#02AFBB] px-5 py-3 font-bold text-[#052e34] disabled:opacity-50">
        {ocupado ? 'Actualizando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}
