import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { esAdministrador } from '@/lib/rutinas/servidor'
import AdminAccesos from '@/components/AdminAccesos'
import AdminNav from '@/components/AdminNav'

export const metadata = {
  title: 'Accesos de socios | MAK FITNESS',
}

export default async function AdminAccesosPage() {
  const supabase = await createClient()
  const permiso = await esAdministrador(supabase)

  if (!permiso.userId) redirect('/login')
  if (!permiso.ok) redirect('/inicio')

  return (
    <main className="mak-shell min-h-screen pb-16">
      <header className="mak-topbar">
        <div className="mx-auto w-full max-w-3xl px-4 py-5">
          <Link href="/inicio" className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300 hover:text-white">
            <ArrowLeft size={16} /> Volver
          </Link>
          <h1 className="mak-display mt-3 text-3xl text-white sm:text-4xl">Accesos de socios</h1>
          <p className="mt-1 max-w-xl text-[15px] text-zinc-300">
            Busca a un socio para ver por qué no puede entrar y restablecer su contraseña.
          </p>
          <AdminNav actual="/admin/accesos" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4">
        <AdminAccesos />
      </div>
    </main>
  )
}
