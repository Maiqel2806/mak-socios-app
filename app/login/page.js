'use client'

import {
  useState,
} from 'react'

import {
  useRouter,
} from 'next/navigation'

import {
  Dumbbell,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import ThemeToggle from '@/components/ThemeToggle'


export default function LoginPage() {
  const router =
    useRouter()

  const [
    codigo,
    setCodigo,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false)

  const [
    cargando,
    setCargando,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [mostrarAyuda, setMostrarAyuda] = useState(false)


  async function iniciarSesion(
    evento
  ) {
    evento.preventDefault()

    if (
      !codigo.trim() ||
      !password
    ) {
      setError(
        'Ingresa tu código único y contraseña.'
      )
      return
    }

    setCargando(true)
    setError('')

    try {
      const respuesta =
        await fetch(
          '/api/auth/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              codigo:
                codigo.trim(),

              password,
            }),
          }
        )

      const resultado =
        await respuesta.json()

      if (
        !respuesta.ok ||
        !resultado?.ok
      ) {
        throw new Error(
          resultado?.error ||
          'No fue posible iniciar sesión.'
        )
      }

      router.replace(
        '/inicio'
      )

      router.refresh()

    } catch (errorLogin) {
      setError(
        errorLogin.message
      )

      setCargando(false)
    }
  }


  return (
    <main className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-cyan-50 via-zinc-50 to-zinc-100 px-4 py-4 text-zinc-950 transition-colors dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-white sm:py-7">
      <div className="mx-auto flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-2">
        <div className="mb-5 text-center sm:mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#02AFBB] text-white shadow-lg shadow-cyan-500/20">
            <Dumbbell size={27} aria-hidden="true" />
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-400">MAK FITNESS</p>
          <h1 className="mt-1 text-[1.75rem] font-black leading-tight tracking-tight">MAK Socios</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tu gimnasio, más cerca de ti.</p>
        </div>

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-300/25 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/30 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-black">Bienvenido de nuevo</h2>
            <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">Ingresa con tu código MAK y contraseña.</p>
          </div>

          <form onSubmit={iniciarSesion} className="space-y-4">
            <div>
              <label htmlFor="mak-codigo" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">Código único</label>
              <div className="relative">
                <UserRound size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
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
                  className="min-h-[52px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-2 focus:ring-[#02AFBB]/15 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mak-password" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">Contraseña</label>
              <div className="relative">
                <KeyRound size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="mak-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="Tu contraseña"
                  className="min-h-[52px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-12 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-2 focus:ring-[#02AFBB]/15 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((actual) => !actual)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={mostrarPassword}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mak-interactive flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#02AFBB] px-5 text-sm font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={19} aria-hidden="true" />
              {cargando ? 'Ingresando...' : 'Ingresar a MAK Socios'}
            </button>
          </form>

          <div className="mt-4 border-t border-zinc-100 pt-4 text-center dark:border-white/10">
            <button
              type="button"
              aria-expanded={mostrarAyuda}
              onClick={() => setMostrarAyuda((anterior) => !anterior)}
              className="min-h-10 px-3 text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-400"
            >
              ¿Olvidaste tu contraseña?
            </button>
            {mostrarAyuda && (
              <p className="mt-2 rounded-xl bg-cyan-50 p-3 text-left text-xs leading-5 text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
                Solicita ayuda al personal de recepción de MAK FITNESS para recuperar el acceso a tu cuenta.
              </p>
            )}
          </div>
        </section>

        <p className="mx-auto mt-4 flex max-w-sm items-start justify-center gap-2 px-2 text-center text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-cyan-600" aria-hidden="true" />
          Tu acceso es personal. No compartas tu contraseña.
        </p>
      </div>
    </main>
  )
}
