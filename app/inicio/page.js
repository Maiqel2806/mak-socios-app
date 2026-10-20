import {
  redirect,
} from 'next/navigation'

import {
  LockKeyhole,
  LogOut,
} from 'lucide-react'

import {
  createClient,
} from '@/lib/supabase/server'

import {
  createAdminClient,
} from '@/lib/supabase/admin'

import ThemeToggle from '@/components/ThemeToggle'
import MembershipCard from '@/components/MembershipCard'
import ExclusiveBenefitCard from '@/components/ExclusiveBenefitCard'


export default async function InicioPage() {
  const supabase =
    await createClient()

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims()

  const userId =
    claimsData?.claims?.sub

  if (
    claimsError ||
    !userId
  ) {
    redirect('/login')
  }


  const {
    data: cuenta,
    error: errorCuenta,
  } = await supabase
    .from('socio_cuentas_app')
    .select(`
      miembro_id,
      tipo_clave_inicial,
      cambio_clave_obligatorio,
      clave_cambiada,
      aviso_cambio_clave_visto,
      activo
    `)
    .eq(
      'auth_user_id',
      userId
    )
    .maybeSingle()


  if (
    errorCuenta ||
    !cuenta ||
    !cuenta.activo
  ) {
    redirect('/login')
  }


  const admin =
    createAdminClient()

  const {
    data: miembro,
  } = await admin
    .from('miembros')
    .select('nombre, codigo_acceso')
    .eq(
      'id',
      cuenta.miembro_id
    )
    .maybeSingle()


  const nombreSocio =
    String(
      miembro?.nombre ||
      'Socio MAK'
    ).trim()

  const codigoSocio =
    String(
      miembro?.codigo_acceso ||
      ''
    ).trim()


  // =========================================================
  // MEMBRESÍA DEL SOCIO AUTENTICADO
  // El RPC obtiene el miembro desde auth.uid().
  // No recibe miembro_id desde el navegador.
  // =========================================================

  const [
    respuestaMembresia,
    respuestaPagos,
  ] = await Promise.all([
    supabase.rpc(
      'obtener_mi_membresia_app'
    ),

    supabase.rpc(
      'obtener_metodos_pago_socio_app'
    ),
  ])


  let membresia =
    respuestaMembresia.data

  const errorMembresia =
    respuestaMembresia.error

  const metodosPago =
    respuestaPagos.data

  const errorMetodosPago =
    respuestaPagos.error




    // =========================================================
  // ACCESO A BENEFICIOS
  //
  // Debe calcularse DESPUÉS del simulador de vigencia.
  // =========================================================

  const accesoBeneficios =
    !errorMembresia &&
    Boolean(
      membresia
        ?.puede_entrenar_hoy
    )

  const estadoMembresia =
    membresia
      ?.estado_visual ||
    'sin_membresia'


  return (
    <main className="min-h-screen bg-zinc-100 pb-24 text-zinc-950 transition-colors duration-300 dark:bg-zinc-950 dark:text-white">

      <header className="border-b border-zinc-200 bg-white px-4 pb-7 pt-5 transition-colors dark:border-white/10 dark:bg-zinc-950">

        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-400">
              MAK FITNESS
            </p>

            <h1 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white md:text-3xl">
              ¡Hola, {nombreSocio}!
            </h1>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Qué bueno tenerte nuevamente por aquí.
            </p>

          </div>


          <div className="flex items-center gap-2">

            <ThemeToggle
              compacto
            />

            <form
              action="/api/auth/logout"
              method="post"
            >

              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={19} />
              </button>

            </form>

          </div>

        </div>

      </header>


      <div className="mx-auto w-full max-w-5xl px-4 pt-5">

        {!cuenta.clave_cambiada &&
          !cuenta.cambio_clave_obligatorio && (

          <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">

            <div className="flex gap-3">

              <LockKeyhole
                size={22}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />

              <div>

                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Protege tu cuenta
                </p>

                <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-100/80">
                  Estás utilizando tu contraseña inicial. Recomendamos crear una contraseña personal.
                </p>

                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  El cambio es opcional para tu cuenta.
                </p>

              </div>

            </div>

          </section>
        )}


        {cuenta.cambio_clave_obligatorio && (

          <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-500/20 dark:bg-red-500/10">

            <div className="flex gap-3">

              <LockKeyhole
                size={22}
                className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
              />

              <div>

                <p className="font-bold text-red-900 dark:text-red-200">
                  Debes cambiar tu contraseña
                </p>

                <p className="mt-1 text-sm leading-5 text-red-800 dark:text-red-100/80">
                  Tu cuenta utiliza una contraseña temporal. Antes de utilizar MAK Socios deberás crear una contraseña personal.
                </p>

              </div>

            </div>

          </section>
        )}


        <div className="mt-4 grid grid-cols-2 gap-3">

        {errorMembresia ? (

          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">

            <p className="font-bold">
              No pudimos cargar tu membresía.
            </p>

            <p className="mt-1 text-sm">
              Intenta nuevamente en unos minutos.
            </p>

          </section>

        ) : (

          <MembershipCard
            membresia={
              membresia
            }
            metodosPago={
              metodosPago
            }
            nombreSocio={
              nombreSocio
            }
            codigoSocio={
              codigoSocio
            }
          />

        )}




          <ExclusiveBenefitCard
            tipo="rutina"
            titulo="Mi rutina"
            subtitulo="Entrenamiento personalizado"
            activo={
              accesoBeneficios
            }
            estadoMembresia={
              estadoMembresia
            }
          />


          <ExclusiveBenefitCard
            tipo="progreso"
            titulo="Progreso"
            subtitulo="Mis resultados"
            activo={
              accesoBeneficios
            }
            estadoMembresia={
              estadoMembresia
            }
          />


          <ExclusiveBenefitCard
            tipo="snack"
            titulo="Snack Bar"
            subtitulo="Menú y nutrición MAK"
            activo={
              accesoBeneficios
            }
            estadoMembresia={
              estadoMembresia
            }
          />

        </div>

      </div>

    </main>
  )
}
