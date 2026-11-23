import { NextResponse } from 'next/server'
import { motorV4Activo } from '@/lib/rutinas/servidor'

export const dynamic = 'force-dynamic'

// Comprobación rápida: abre /api/rutina/motor en el navegador.
export async function GET() {
  const v4 = motorV4Activo()
  return NextResponse.json({
    motor: v4 ? 'v4' : 'anterior',
    mensaje: v4
      ? 'El motor MAK v4 está activo en este despliegue.'
      : 'Este despliegue usa el sistema anterior. Agrega MOTOR_RUTINAS=v4 en Vercel para este entorno y vuelve a desplegar.',
  })
}
