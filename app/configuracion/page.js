import Link from 'next/link'
import { redirect } from 'next/navigation'
import { KeyRound, Info, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CambiarClave from '@/components/CambiarClave'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) redirect('/login')

  const { data: cuenta } = await supabase
    .from('socio_cuentas_app')
    .select('activo')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()

  if (!cuenta?.activo) redirect('/login')

  const tarjeta = 'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900'

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/inicio" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-[#8AE0DB]">
          <ArrowLeft size={17}/> Volver a Inicio
        </Link>

        <header className="pb-2">
          <p className="text-xs font-black tracking-[0.18em] text-[#02AFBB]">
            MAK FITNESS / CLIENTES
          </p>
          <h1 className="mt-2 text-3xl font-black">Configuración</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Administra la seguridad de tu cuenta.
          </p>
        </header>

        <section className={tarjeta}>
          <div className="mb-5 flex items-center gap-3">
            <KeyRound className="text-[#02AFBB]"/>
            <h2 className="text-lg font-extrabold">Cambiar contraseña</h2>
          </div>
          <CambiarClave/>
        </section>

        <section className={tarjeta}>
          <div className="mb-3 flex items-center gap-3">
            <Info className="text-[#02AFBB]"/>
            <h2 className="text-lg font-extrabold">Acerca de la aplicación</h2>
          </div>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            MAK Clientes es el espacio digital para los miembros de
            MAK FITNESS. Consulta tu membresía, accede a tus rutinas
            y registra tu progreso.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck size={15}/> Tu cuenta es personal.
          </div>
          <a href="https://www.instagram.com/makfitness0/"
             target="_blank" rel="noopener noreferrer"
             className="mt-3 inline-block text-sm font-bold text-cyan-700 dark:text-[#8AE0DB]">
            Síguenos en Instagram · @makfitness0
          </a>
        </section>

        <form action="/api/auth/logout" method="post">
          <button type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 px-5 py-4 font-bold text-rose-600 dark:border-rose-500/30 dark:text-rose-300">
            <LogOut size={18}/> Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}
