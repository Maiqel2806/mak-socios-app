import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ProgressSummaryDashboard from '@/components/ProgressSummaryDashboard'

export const dynamic = 'force-dynamic'

export default async function ProgresoPage() {
  const supabase = await createClient()

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) {
    redirect('/login')
  }

  const { data: cuenta, error: errorCuenta } =
    await supabase
      .from('socio_cuentas_app')
      .select('activo')
      .eq('auth_user_id', userId)
      .maybeSingle()

  if (errorCuenta || !cuenta?.activo) {
    redirect('/login')
  }

  const { data, error } = await supabase.rpc(
    'obtener_mi_progreso_resumen_app'
  )

  if (error?.message?.includes(
    'MEMBRESIA_ACTIVA_REQUERIDA'
  )) {
    redirect('/inicio')
  }

  return (
    <ProgressSummaryDashboard
      datos={error ? null : data}
      error={
        error
          ? 'No pudimos cargar tus resultados. Intenta actualizar.'
          : ''
      }
    />
  )
}
