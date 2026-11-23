'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CalendarCheck,
  Dumbbell,
  Eye,
  EyeOff,
  TrendingUp,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import MakCargando from '@/components/MakCargando'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()

  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarAyuda, setMostrarAyuda] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)

  async function iniciarSesion(evento) {
    evento.preventDefault()

    if (!codigo.trim() || !password) {
      setError('Escribe tu código de cliente y tu contraseña.')
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

  const beneficios = [
    {
      Icono: Dumbbell,
      titulo: 'Rutina hecha para ti',
      texto: 'Según tu objetivo, tu nivel y las máquinas de MAK FITNESS.',
    },
    {
      Icono: TrendingUp,
      titulo: 'Progreso que se ve',
      texto: 'Registra tus series, mira tu última marca y bate tus récords.',
    },
    {
      Icono: CalendarCheck,
      titulo: 'Tu membresía al día',
      texto: 'Vigencia, renovación y formas de pago en un solo lugar.',
    },
  ]

  return (
    <main className="mak-acceso min-h-[100dvh] text-zinc-950 dark:text-white">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-10">

        {/* Marca: arriba en móvil, columna izquierda en pantallas grandes */}
        <section className="mak-acceso-hero relative isolate overflow-hidden px-5 pb-10 pt-5 text-white sm:px-8 lg:rounded-[32px] lg:p-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm sm:h-16 sm:w-16">
                <Image
                  src="/mak-fitness-logo.png"
                  alt="MAK FITNESS"
                  width={56}
                  height={56}
                  className="h-11 w-11 object-contain sm:h-12 sm:w-12"
                  priority
                />
              </div>
              <div>
                <p className="mak-display text-lg leading-none sm:text-xl">MAK FITNESS</p>
                <p className="mt-1 text-xs font-semibold text-cyan-100/80">App para clientes</p>
              </div>
            </div>
            <div className="lg:hidden">
              <ThemeToggle compacto />
            </div>
          </div>

          <div className="mt-8 lg:mt-20">
            <h1 className="mak-display text-[2.6rem] leading-[0.95] sm:text-6xl lg:text-7xl">
              Entrenamiento real,<br />para resultados reales.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-cyan-50/80 sm:text-base">
              Tu rutina, tus entrenamientos y tu membresía, siempre contigo.
            </p>
          </div>

          <ul className="mt-10 hidden space-y-5 lg:block">
            {beneficios.map(({ Icono, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#02AFBB]/20 text-[#5FE3EA] ring-1 ring-[#5FE3EA]/30">
                  <Icono size={20} />
                </span>
                <div>
                  <p className="font-bold">{titulo}</p>
                  <p className="mt-0.5 text-sm leading-6 text-cyan-50/70">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Formulario */}
        <section className="relative -mt-6 flex flex-col justify-center px-4 pb-8 lg:mt-0 lg:px-0 lg:pb-0">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 hidden justify-end lg:flex">
              <ThemeToggle />
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_rgba(13,20,23,0.12)] dark:border-white/10 dark:bg-[#111a1e] dark:shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <h2 className="mak-display text-[2rem] leading-none">¡Qué bueno verte!</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Ingresa con el código que te dieron en recepción y tu contraseña.
              </p>

              <form onSubmit={iniciarSesion} className="mt-6 space-y-4" noValidate>
                <div>
                  <label htmlFor="mak-codigo" className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Código de cliente
                  </label>
                  <div className="relative">
                    <UserRound size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
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
                      placeholder="Ej. MAK0123"
                      aria-invalid={Boolean(error) && !codigo.trim()}
                      className="mak-auth-input min-h-[56px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-4 text-base uppercase text-zinc-950 outline-none transition placeholder:normal-case placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/40 dark:focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mak-password" className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="mak-password"
                      type={mostrarPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      enterKeyHint="go"
                      value={password}
                      onChange={(evento) => setPassword(evento.target.value)}
                      onKeyUp={(evento) => setMayusculas(evento.getModifierState?.('CapsLock') || false)}
                      placeholder="Tu contraseña"
                      className="mak-auth-input min-h-[56px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-12 pr-14 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#02AFBB] focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/40 dark:focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((actual) => !actual)}
                      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={mostrarPassword}
                      className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {mayusculas && (
                    <p className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Bloq Mayús está activado.</p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="mak-btn-primary min-h-[56px] w-full rounded-2xl px-5 text-base shadow-[0_18px_38px_rgba(2,175,187,0.25)] disabled:cursor-not-allowed"
                >
                  Entrar
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
                  ¿Olvidaste tu contraseña o tu código?
                </button>

                {mostrarAyuda && (
                  <p className="mt-3 rounded-2xl bg-cyan-50 p-3 text-left text-sm leading-6 text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-100">
                    Acércate a recepción de MAK FITNESS: te ayudamos a recuperar el acceso en minutos.
                  </p>
                )}
              </div>

              <p className="mt-4 flex items-start gap-2 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
                Tu acceso es personal. Nunca compartas tu contraseña.
              </p>
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:hidden">
              {beneficios.map(({ Icono, titulo }) => (
                <li key={titulo} className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <Icono size={16} className="shrink-0 text-[#02AFBB]" /> {titulo}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {cargando && (
        <MakCargando
          pantallaCompleta
          mensaje="Preparando tu espacio…"
          submensaje="Verificando tus datos de acceso."
        />
      )}
    </main>
  )
}