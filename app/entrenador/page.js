import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { perfilStaff } from '@/lib/staff'
import EntrenadorPanel from '@/components/EntrenadorPanel'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata = {
  title: 'Modo entrenador | MAK FITNESS',
}

export default async function EntrenadorPage() {
  const supabase = await createClient()
  const staff = await perfilStaff(supabase)

  if (!staff.userId) redirect('/login')
  if (!staff.ok) redirect('/inicio')

  return (
    <main className="mak-shell min-h-screen pb-16">
      <header className="mak-topbar">
        <div className="mx-auto w-full max-w-4xl px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-cyan-300">MAK FITNESS · Modo entrenador</p>
              <h1 className="mak-display mt-1 text-3xl text-white sm:text-4xl">Hola, {staff.nombre.split(' ')[0]}</h1>
              <p className="mt-1 max-w-xl text-[15px] text-zinc-300">
                Prueba las rutinas que genera la app, revisa los ejercicios y envía tus sugerencias de mejora.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle compacto />
              <form action="/api/auth/logout" method="post">
                <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20">
                  <LogOut size={18} />
                </button>
              </form>
            </div>
          </div>

          {staff.esDueno && (
            <nav aria-label="Administración" className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/accesos" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Accesos de socios</Link>
              <Link href="/admin/equipamiento" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Equipamiento y rutinas</Link>
            </nav>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-4">
        <EntrenadorPanel />
      </div>
    </main>
  )
}
