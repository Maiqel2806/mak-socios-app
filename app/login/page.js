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
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-zinc-50 to-zinc-100 px-4 py-6 text-zinc-950 transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-white">

      <div className="mx-auto flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>


      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center">

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 dark:bg-cyan-400 dark:text-zinc-950">
            <Dumbbell size={32} />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-400">
            MAK FITNESS
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            MAK Socios
          </h1>

        </div>


        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-300/30 transition-colors sm:p-7 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/30">

          <div className="mb-6">

            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ingresa con el código único asignado en MAK FITNESS.
            </p>

          </div>


          <form
            onSubmit={
              iniciarSesion
            }
            className="space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Código único
              </label>

              <div className="relative">

                <UserRound
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                />

                <input
                  type="text"
                  autoComplete="username"
                  inputMode="text"
                  value={codigo}
                  onChange={(evento) =>
                    setCodigo(
                      evento.target.value
                    )
                  }
                  placeholder="Tu código de registro"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3.5 pl-12 pr-4 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-500 focus:bg-white dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-cyan-400"
                />

              </div>

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Contraseña
              </label>

              <div className="relative">

                <KeyRound
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                />

                <input
                  type={
                    mostrarPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(evento) =>
                    setPassword(
                      evento.target.value
                    )
                  }
                  placeholder="Tu contraseña"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3.5 pl-12 pr-12 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-cyan-500 focus:bg-white dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      (actual) =>
                        !actual
                    )
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-white"
                >
                  {mostrarPassword
                    ? (
                      <EyeOff
                        size={19}
                      />
                    )
                    : (
                      <Eye
                        size={19}
                      />
                    )}
                </button>

              </div>

            </div>


            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}


            <button
              type="submit"
              disabled={
                cargando
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 text-sm font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-zinc-950 dark:hover:bg-cyan-300"
            >
              <LogIn size={19} />

              {cargando
                ? 'Ingresando...'
                : 'Ingresar'}
            </button>

          </form>


          <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-white/10">

            <button
              type="button"
              onClick={() =>
                window.alert(
                  'Para recuperar tu contraseña, comunícate directamente con MAK FITNESS. Próximamente este botón abrirá nuestro WhatsApp.'
                )
              }
              className="w-full text-center text-sm font-semibold text-cyan-600 transition hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              ¿Olvidaste tu contraseña?
            </button>

          </div>

        </section>


        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-white/5 dark:bg-white/[0.03]">

          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
          />

          <p className="text-xs leading-5 text-zinc-500">
            Tu acceso es personal. Nunca compartas tu contraseña con otros socios.
          </p>

        </div>

      </div>

    </main>
  )
}
