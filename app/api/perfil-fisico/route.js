import {
  NextResponse,
} from 'next/server'

import {
  createClient,
} from '@/lib/supabase/server'


const OBJETIVOS =
  new Set([
    'bajar_grasa',
    'ganar_musculo',
    'fuerza',
    'tonificacion',
    'resistencia',
    'mantenerse',
  ])


const NIVELES =
  new Set([
    'principiante',
    'intermedio',
    'avanzado',
  ])


const TIEMPOS =
  new Set([
    30,
    40,
    45,
    50,
    60,
  ])


function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null
  }

  const convertido =
    Number(valor)

  return Number.isFinite(
    convertido
  )
    ? convertido
    : null
}


function textoOpcional(
  valor,
  maximo
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null
  }

  const texto =
    String(valor).trim()

  return texto
    ? texto.slice(
        0,
        maximo
      )
    : null
}


function errorJson(
  error,
  status = 400
) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    {
      status,
    }
  )
}


export async function POST(
  request
) {
  const supabase =
    await createClient()


  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims()


  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return errorJson(
      'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      401
    )
  }


  let body

  try {
    body =
      await request.json()

  } catch {
    return errorJson(
      'Los datos enviados no son válidos.'
    )
  }


  const estatura =
    numero(
      body?.estatura_cm
    )

  const peso =
    numero(
      body?.peso_kg
    )

  const edad =
    numero(
      body?.edad
    )

  const dias =
    numero(
      body?.dias_entrenamiento
    )

  const tiempo =
    numero(
      body?.tiempo_sesion_min
    )

  const objetivo =
    String(
      body?.objetivo || ''
    ).trim()

  const nivel =
    String(
      body?.nivel || ''
    ).trim()


  if (
    estatura === null ||
    peso === null ||
    dias === null ||
    tiempo === null ||
    !objetivo ||
    !nivel
  ) {
    return errorJson(
      'Completa todos los datos obligatorios.'
    )
  }


  if (
    estatura < 100 ||
    estatura > 250
  ) {
    return errorJson(
      'La estatura debe estar entre 100 y 250 cm.'
    )
  }


  if (
    peso < 20 ||
    peso > 350
  ) {
    return errorJson(
      'El peso debe estar entre 20 y 350 kg.'
    )
  }


  if (
    edad !== null &&
    (
      !Number.isInteger(
        edad
      ) ||
      edad < 5 ||
      edad > 100
    )
  ) {
    return errorJson(
      'La edad ingresada no es válida.'
    )
  }


  if (
    !OBJETIVOS.has(
      objetivo
    )
  ) {
    return errorJson(
      'El objetivo seleccionado no es válido.'
    )
  }


  if (
    !NIVELES.has(
      nivel
    )
  ) {
    return errorJson(
      'El nivel seleccionado no es válido.'
    )
  }


  if (
    !Number.isInteger(
      dias
    ) ||
    dias < 1 ||
    dias > 5
  ) {
    return errorJson(
      'Puedes seleccionar entre 1 y 5 días de entrenamiento por semana.'
    )
  }


  if (
    !Number.isInteger(
      tiempo
    ) ||
    !TIEMPOS.has(
      tiempo
    )
  ) {
    return errorJson(
      'Elige una sesión de 30, 40, 45, 50 o 60 minutos.'
    )
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      'guardar_mi_perfil_fisico_app',
      {
        p_estatura_cm:
          estatura,

        p_peso_kg:
          peso,

        p_edad:
          edad,

        p_objetivo:
          objetivo,

        p_nivel:
          nivel,

        p_dias_entrenamiento:
          dias,

        p_tiempo_sesion_min:
          tiempo,

        p_limitaciones:
          textoOpcional(
            body?.limitaciones,
            1000
          ),

        p_observaciones:
          textoOpcional(
            body?.observaciones,
            2000
          ),
      }
    )


  if (error) {
    const mensaje =
      String(
        error.message || ''
      )


    if (
      mensaje.includes(
        'MEMBRESIA_ACTIVA_REQUERIDA'
      )
    ) {
      return errorJson(
        'Necesitas una membresía activa para usar este beneficio.',
        403
      )
    }


    return errorJson(
      mensaje ||
      'No pudimos guardar tu perfil.'
    )
  }


  return NextResponse.json({
    ok: true,

    message:
      data?.message ||
      'Perfil guardado correctamente.',

    imc:
      data?.imc ??
      null,

    edad:
      data?.edad ??
      edad,
  })
}
