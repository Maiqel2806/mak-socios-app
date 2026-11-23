import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { esAdministrador } from '@/lib/rutinas/servidor'
import AdminEquipamiento from '@/components/AdminEquipamiento'

export const metadata = {
  title: 'Equipamiento | MAK FITNESS',
}

export default async function AdminEquipamientoPage() {
  const supabase = await createClient()
  const permiso = await esAdministrador(supabase)

  if (!permiso.userId) redirect('/login')
  if (!permiso.ok) redirect('/inicio')

  return (
    <main className="mak-shell min-h-screen pb-16">
      <header className="mak-topbar">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5">
          <div>
            <Link href="/inicio" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white">
              <ArrowLeft size={15} /> Volver
            </Link>
            <p className="mak-eyebrow mt-3">MAK FITNESS · ADMINISTRACIÓN</p>
            <h1 className="mak-display mt-1 text-3xl text-white sm:text-4xl">Equipamiento y rutinas</h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-300">
              Activa, desactiva o agrega máquinas. Las próximas rutinas que generen los socios usarán solo el equipo activo.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4">
        <AdminEquipamiento />
      </div>
    </main>
  )
}
