import Link from 'next/link'
import {
  redirect,
} from 'next/navigation'

import {
  LockKeyhole,
  LogOut,
  ChevronDown,
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
import ProgressEntryCard from '@/components/ProgressEntryCard'
import RoutineCard from '@/components/RoutineCard'
import MemberAccessCodeCard from '@/components/MemberAccessCodeCard'
import AppWelcomeGuide from '@/components/AppWelcomeGuide'

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
  // ACCESO A BENEFICIOS EXCLUSIVOS
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



  let perfilFisico = null
  let rutinaInicial = null

  if (accesoBeneficios) {
    const [
      respuestaPerfil,
      respuestaRutina,
    ] = await Promise.all([
      supabase.rpc(
        'obtener_mi_perfil_fisico_app'
      ),

      supabase.rpc(
        'obtener_mi_rutina_app'
      ),
    ])


    if (!respuestaPerfil.error) {
      perfilFisico =
        respuestaPerfil.data
    }


    if (!respuestaRutina.error) {
      rutinaInicial =
        respuestaRutina.data
    }
  }


  return (
    <main className="mak-home-page min-h-screen bg-zinc-100 pb-24 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <header className="mak-home-header">
        <div className="mak-home-header-inner">
          <div className="mak-home-welcome">
            <p className="mak-home-kicker"><span className="mak-home-kicker-dot" />MAK FITNESS <span className="mak-home-kicker-divider">/</span> CLIENTES</p>
            <h1>¡Hola, {nombreSocio}!</h1>
            <p className="mak-home-slogan">Entrenamiento real, para resultados reales.</p>
          </div>
          <div className="mak-home-actions">
              <Link href="/configuracion"
                aria-label="Configuración" title="Configuración"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl text-white transition hover:bg-white/20">
                <span aria-hidden="true">⚙</span>
              </Link>
            <ThemeToggle compacto />
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="mak-home-logout" aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={19} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mak-home-body mx-auto w-full max-w-5xl px-4">
        <MemberAccessCodeCard codigo={codigoSocio} />
        <AppWelcomeGuide clienteId={cuenta.miembro_id} />

        {!cuenta.clave_cambiada && !cuenta.cambio_clave_obligatorio && (
          <details className="mak-home-security-note">
            <summary>
              <LockKeyhole size={18} aria-hidden="true" />
              <span className="mak-home-security-title">Contraseña inicial activa</span>
              <span className="mak-home-security-optional">Opcional</span>
              <ChevronDown size={17} className="mak-home-security-chevron" aria-hidden="true" />
            </summary>
            <p>Por seguridad, recomendamos usar una contraseña personal. Puedes solicitar ayuda para cambiarla en recepción; no es obligatorio para tu cuenta.</p>
          </details>
        )}

        {cuenta.cambio_clave_obligatorio && (

          <section className="mak-home-required-note mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

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
                  Tu cuenta utiliza una contraseña temporal. Antes de utilizar MAK Clientes deberás crear una contraseña personal.
                </p>

              </div>

            </div>

          </section>
        )}


        <div className="mak-home-grid mt-3 grid grid-cols-2 gap-3">

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




          <RoutineCard
            activo={
              accesoBeneficios
            }
            estadoMembresia={
              estadoMembresia
            }
            perfilInicial={
              perfilFisico
            }

            rutinaInicial={
              rutinaInicial
            }
          />


          <ProgressEntryCard
            activo={accesoBeneficios}
            estadoMembresia={estadoMembresia}
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
