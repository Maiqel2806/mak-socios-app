'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()

  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarAyuda, setMostrarAyuda] = useState(false)

  async function iniciarSesion(evento) {
    evento.preventDefault()

    if (!codigo.trim() || !password) {
      setError('Ingresa tu código único y contraseña.')
      return
    }

    setCargando(true)
    setError('')

    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: codigo.trim(),
          password,
        }),
      })

      const resultado = await respuesta.json()

      if (!respuesta.ok || !resultado?.ok) {
        throw new Error(
          resultado?.error || 'No fue posible iniciar sesión.'
        )
      }

      router.replace('/inicio')
      router.refresh()
    } catch (errorLogin) {
      setError(errorLogin.message)
      setCargando(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#e6f8fb_0%,#f8fafc_46%,#f4f4f5_100%)] px-4 py-4 text-zinc-950 transition-colors dark:bg-[radial-gradient(circle_at_top,rgba(2,175,187,0.18)_0%,rgba(7,17,24,1)_30%,rgba(7,17,24,1)_100%)] dark:text-white sm:py-6">
      <div className="mx-auto flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-3">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-950 dark:text-cyan-300">
          MAK FITNESS
        </p>

        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] transition-colors dark:border-white/10 dark:bg-[#0b141c] dark:shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#07131a_0%,#0b2530_48%,#0f5a66_100%)] px-5 pb-6 pt-5 text-white">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -right-10 top-0 h-44 w-44 rounded-full border border-white/10" />
              <div className="absolute -right-2 top-8 h-56 w-56 rounded-full border border-white/10" />
              <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_46%,rgba(255,255,255,0.04)_46%,rgba(255,255,255,0.04)_48%,transparent_48%,transparent_100%)]" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-sm">
                <Image
                  src="/mak-fitness-logo.png"
                  alt="Logo MAK FITNESS"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  MAK FITNESS
                </p>
                <p className="mt-1 text-sm font-semibold text-cyan-50/90">
                  Tu asistente de entrenamiento
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <p className="text-[13px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Bienvenido a tu espacio
              </p>
              <h1 className="mt-2 text-[2.1rem] font-black leading-none tracking-tight">
                MAK <span className="text-cyan-300">Clientes</span></h1>
              <p className="mt-3 text-sm font-semibold text-white/95">
                Entrenamiento real, para resultados reales.
              </p>
            </div>
          </div>

          <div className="px-5 py-5 dark:bg-[#0b141c]">
            <div className="mb-5">
              <p className="text-[12px] font-black uppercase tracking-[0.26em] text-cyan-700 dark:text-cyan-300">
                Acceso de clientes
              </p>
              <h2 className="mt-2 text-[2rem] font-black leading-none text-zinc-950 dark:text-white">
                ¡Qué bueno verte!
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Ingresa con tu código MAK y contraseña.
              </p>
            </div>

            <form onSubmit={iniciarSesion} className="space-y-4">
              <div>
                <label
                  htmlFor="mak-codigo"
                  className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                >
                  Código único
                </label>
                <div className="relative">
                  <UserRound
                    size={19}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <input
                    id="mak-codigo"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="next"
                    maxLength={50}
                    value={codigo}
                    onChange={(evento) => setCodigo(evento.target.value)}
                    placeholder="Tu código de socio"
                    className="mak-auth-input min-h-[56px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/40 dark:focus:border-cyan-400 dark:focus:bg-white/[0.06]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mak-password"
                  className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound
                    size={19}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <input
                    id="mak-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={password}
                    onChange={(evento) => setPassword(evento.target.value)}
                    placeholder="Tu contraseña"
                    className="mak-auth-input min-h-[56px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-14 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/40 dark:focus:border-cyan-400 dark:focus:bg-white/[0.06]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((actual) => !actual)}
                    aria-label={
                      mostrarPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    aria-pressed={mostrarPassword}
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="mak-interactive flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#02AFBB] px-5 text-base font-black text-white shadow-[0_18px_38px_rgba(2,175,187,0.25)] transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ingresar a MAK Clientes
                <LogIn size={20} aria-hidden="true" />
              </button>
            </form>

            <div className="mt-5 border-t border-zinc-200 pt-4 text-center dark:border-white/10">
              <button
                type="button"
                aria-expanded={mostrarAyuda}
                onClick={() => setMostrarAyuda((anterior) => !anterior)}
                className="min-h-10 px-3 text-sm font-semibold text-cyan-700 transition hover:underline dark:text-cyan-300"
              >
                ¿Olvidaste tu contraseña?
              </button>

              {mostrarAyuda && (
                <p className="mt-3 rounded-2xl bg-cyan-50 p-3 text-left text-xs leading-6 text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-100">
                  Solicita ayuda al personal de recepción de MAK FITNESS para
                  recuperar el acceso a tu cuenta.
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-white/10">
              <p className="flex items-start gap-2 text-[12px] leading-5 text-zinc-600 dark:text-zinc-300">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300"
                  aria-hidden="true"
                />
                Tu acceso es personal. Nunca compartas tu contraseña.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          MAK FITNESS · #entrenareal
        </p>
      </div>
    
      {cargando && (
        <div className="mak-auth-overlay"
             role="status"
             aria-live="polite"
             aria-label="Validando tu acceso">
          <div className="mak-auth-panel">
            <div className="mak-auth-spinner" aria-hidden="true">
              <div className="mak-auth-logo" />
            </div>
            <p className="mak-auth-brand">MAK CLIENTES</p>
            <h2>Estamos preparando tu espacio</h2>
            <p>Verificando tus datos de acceso...</p>
            <div className="mak-auth-dots" aria-hidden="true">
              <span/><span/><span/>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}