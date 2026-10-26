'use client'

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Pencil,
  Ruler,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Weight,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import ExclusiveBenefitCard from '@/components/ExclusiveBenefitCard'
import RoutinePlanView from '@/components/RoutinePlanView'


const OBJETIVOS = [
  {
    valor: 'bajar_grasa',
    titulo: 'Reducir grasa',
  },
  {
    valor: 'ganar_musculo',
    titulo: 'Ganar músculo',
  },
  {
    valor: 'fuerza',
    titulo: 'Aumentar fuerza',
  },
  {
    valor: 'tonificacion',
    titulo: 'Tonificación',
  },
  {
    valor: 'resistencia',
    titulo: 'Mejorar resistencia',
  },
  {
    valor: 'mantenerse',
    titulo: 'Mantenerme activo',
  },
]


const NIVELES = [
  {
    valor: 'principiante',
    titulo: 'Principiante',
    descripcion:
      'Estoy comenzando o retomando.',
  },
  {
    valor: 'intermedio',
    titulo: 'Intermedio',
    descripcion:
      'Ya entreno con regularidad.',
  },
  {
    valor: 'avanzado',
    titulo: 'Avanzado',
    descripcion:
      'Tengo experiencia y buena técnica.',
  },
]


function etiquetaObjetivo(
  valor
) {
  return (
    OBJETIVOS.find(
      (item) =>
        item.valor === valor
    )?.titulo ||
    'Sin definir'
  )
}


function etiquetaNivel(
  valor
) {
  return (
    NIVELES.find(
      (item) =>
        item.valor === valor
    )?.titulo ||
    'Sin definir'
  )
}


function valorInicial(
  valor
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  return String(valor)
}


export default function RoutineCard({
  activo,
  estadoMembresia,
  perfilInicial,
  rutinaInicial,
}) {
  const perfilBase =
    perfilInicial || {
      tiene_perfil: false,
    }

  const rutinaBase =
    rutinaInicial || {
      tiene_perfil:
        Boolean(
          perfilBase?.tiene_perfil
        ),

      tiene_rutina: false,

      puede_generar:
        Boolean(
          perfilBase?.tiene_perfil
        ),

      requiere_revision: false,
      requiere_regenerar: false,
    }


  const [
    perfil,
    setPerfil,
  ] = useState(
    perfilBase
  )

  const [
    abierto,
    setAbierto,
  ] = useState(false)

  const [
    modo,
    setModo,
  ] = useState(
    perfilBase?.tiene_perfil
      ? (
          rutinaBase?.tiene_rutina &&
          !rutinaBase?.requiere_regenerar
            ? 'rutina'
            : 'resumen'
        )
      : 'formulario'
  )

  const [
    paso,
    setPaso,
  ] = useState(1)

  const [
    guardando,
    setGuardando,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    guardadoReciente,
    setGuardadoReciente,
  ] = useState(false)

  const [
    estadoRutina,
    setEstadoRutina,
  ] = useState(
    rutinaBase
  )

  const [
    procesandoRutina,
    setProcesandoRutina,
  ] = useState(false)

  const [
    diaActivo,
    setDiaActivo,
  ] = useState(
    Number(
      rutinaBase?.rutina
        ?.dias?.[0]?.dia || 1
    )
  )


  const [
    formulario,
    setFormulario,
  ] = useState({
    estatura_cm:
      valorInicial(
        perfilBase?.estatura_cm
      ),

    peso_kg:
      valorInicial(
        perfilBase?.peso_kg
      ),

    edad:
      valorInicial(
        perfilBase?.edad
      ),

    objetivo:
      perfilBase?.objetivo || '',

    nivel:
      perfilBase?.nivel || '',

    dias_entrenamiento:
      valorInicial(
        perfilBase
          ?.dias_entrenamiento
      ),

    tiempo_sesion_min:
      valorInicial(
        perfilBase
          ?.tiempo_sesion_min
      ),

    limitaciones:
      perfilBase?.limitaciones || '',

    observaciones:
      perfilBase?.observaciones || '',
  })


  const ocupado =
    guardando ||
    procesandoRutina


  const tieneFechaNacimiento =
    Boolean(
      perfil?.fecha_nacimiento ||
      perfilBase?.fecha_nacimiento
    )


  const imcCalculado =
    useMemo(
      () => {
        const peso =
          Number(
            formulario.peso_kg
          )

        const estatura =
          Number(
            formulario.estatura_cm
          )

        if (
          !Number.isFinite(peso) ||
          !Number.isFinite(estatura) ||
          peso <= 0 ||
          estatura <= 0
        ) {
          return null
        }

        const metros =
          estatura / 100

        return (
          peso /
          (metros * metros)
        ).toFixed(2)
      },
      [
        formulario.peso_kg,
        formulario.estatura_cm,
      ]
    )


  useEffect(
    () => {
      if (!abierto) {
        return
      }

      const anterior =
        document.body.style.overflow

      document.body.style.overflow =
        'hidden'


      function escape(
        evento
      ) {
        if (
          evento.key === 'Escape' &&
          !ocupado
        ) {
          cerrar()
        }
      }


      window.addEventListener(
        'keydown',
        escape
      )


      return () => {
        document.body.style.overflow =
          anterior

        window.removeEventListener(
          'keydown',
          escape
        )
      }
    },
    [
      abierto,
      ocupado,
    ]
  )


  function actualizar(
    campo,
    valor
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      })
    )

    setError('')
  }


  function abrir() {
    setGuardadoReciente(false)
    setError('')

    if (
      !perfil?.tiene_perfil
    ) {
      setModo('formulario')
      setPaso(1)

    } else if (
      estadoRutina?.tiene_rutina &&
      !estadoRutina?.requiere_regenerar
    ) {
      setModo('rutina')

      setDiaActivo(
        Number(
          estadoRutina?.rutina
            ?.dias?.[0]?.dia || 1
        )
      )

    } else {
      setModo('resumen')
    }

    setAbierto(true)
  }


  function cerrar() {
    if (ocupado) {
      return
    }

    setAbierto(false)
    setError('')
  }


  function validarPaso(
    numero
  ) {
    if (
      numero === 1
    ) {
      const estatura =
        Number(
          formulario.estatura_cm
        )

      const peso =
        Number(
          formulario.peso_kg
        )

      if (
        !Number.isFinite(estatura) ||
        estatura < 100 ||
        estatura > 250
      ) {
        setError(
          'Ingresa una estatura válida entre 100 y 250 cm.'
        )
        return false
      }

      if (
        !Number.isFinite(peso) ||
        peso < 20 ||
        peso > 350
      ) {
        setError(
          'Ingresa un peso válido entre 20 y 350 kg.'
        )
        return false
      }

      if (
        !tieneFechaNacimiento
      ) {
        const edad =
          Number(
            formulario.edad
          )

        if (
          !Number.isInteger(edad) ||
          edad < 5 ||
          edad > 100
        ) {
          setError(
            'Ingresa una edad válida.'
          )
          return false
        }
      }
    }


    if (
      numero === 2 &&
      !formulario.objetivo
    ) {
      setError(
        'Selecciona tu objetivo principal.'
      )
      return false
    }


    if (
      numero === 3
    ) {
      if (
        !formulario.nivel
      ) {
        setError(
          'Selecciona tu nivel de entrenamiento.'
        )
        return false
      }

      const dias =
        Number(
          formulario
            .dias_entrenamiento
        )

      if (
        !Number.isInteger(dias) ||
        dias < 1 ||
        dias > 5
      ) {
        setError(
          'Selecciona entre 1 y 5 días de entrenamiento.'
        )
        return false
      }

      const tiempo =
        Number(
          formulario
            .tiempo_sesion_min
        )

      if (
        ![
          30,
          40,
          45,
          50,
          60,
        ].includes(
          tiempo
        )
      ) {
        setError(
          'Selecciona una sesión de 30, 40, 45, 50 o 60 minutos.'
        )
        return false
      }
    }


    setError('')
    return true
  }


  function siguiente() {
    if (
      !validarPaso(paso)
    ) {
      return
    }

    setPaso(
      (actual) =>
        Math.min(
          actual + 1,
          4
        )
    )
  }


  function anterior() {
    setError('')

    setPaso(
      (actual) =>
        Math.max(
          actual - 1,
          1
        )
    )
  }


  async function cargarEstadoRutina({
    mostrar = false,
  } = {}) {
    const respuesta =
      await fetch(
        '/api/rutina',
        {
          method: 'GET',
          cache: 'no-store',
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
        'No pudimos cargar tu rutina.'
      )
    }


    const nuevoEstado =
      resultado?.estado || {
        tiene_perfil: true,
        tiene_rutina: false,
        puede_generar: true,
      }


    setEstadoRutina(
      nuevoEstado
    )


    if (
      mostrar &&
      nuevoEstado?.tiene_rutina
    ) {
      setDiaActivo(
        Number(
          nuevoEstado?.rutina
            ?.dias?.[0]?.dia || 1
        )
      )

      setModo(
        'rutina'
      )
    }


    return nuevoEstado
  }


  async function generarRutina() {
    setProcesandoRutina(
      true
    )

    setError('')


    try {
      const respuesta =
        await fetch(
          '/api/rutina',
          {
            method: 'POST',
          }
        )

      const resultado =
        await respuesta.json()


      if (
        !respuesta.ok ||
        !resultado?.ok
      ) {
        if (
          resultado?.requiere_revision
        ) {
          setEstadoRutina({
            tiene_perfil: true,
            tiene_rutina: false,
            puede_generar: false,
            requiere_revision: true,
            estado_revision:
              'pendiente',

            message:
              resultado?.message,
          })
        }


        throw new Error(
          resultado?.error ||
          resultado?.message ||
          'No pudimos generar tu rutina.'
        )
      }


      await cargarEstadoRutina({
        mostrar: true,
      })


    } catch (err) {
      setError(
        err?.message ||
        'No pudimos generar tu rutina.'
      )

    } finally {
      setProcesandoRutina(
        false
      )
    }
  }


  async function guardarPerfil() {
    if (
      !validarPaso(1) ||
      !validarPaso(2) ||
      !validarPaso(3)
    ) {
      return
    }


    setGuardando(true)
    setError('')


    try {
      const respuesta =
        await fetch(
          '/api/perfil-fisico',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              estatura_cm:
                Number(
                  formulario
                    .estatura_cm
                ),

              peso_kg:
                Number(
                  formulario
                    .peso_kg
                ),

              edad:
                tieneFechaNacimiento
                  ? (
                      perfil?.edad ??
                      perfilBase?.edad ??
                      null
                    )
                  : Number(
                      formulario.edad
                    ),

              objetivo:
                formulario.objetivo,

              nivel:
                formulario.nivel,

              dias_entrenamiento:
                Number(
                  formulario
                    .dias_entrenamiento
                ),

              tiempo_sesion_min:
                Number(
                  formulario
                    .tiempo_sesion_min
                ),

              limitaciones:
                formulario
                  .limitaciones
                  .trim() || null,

              observaciones:
                formulario
                  .observaciones
                  .trim() || null,
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
          'No pudimos guardar tu perfil.'
        )
      }


      const nuevoPerfil = {
        tiene_perfil: true,

        estatura_cm:
          Number(
            formulario
              .estatura_cm
          ),

        peso_kg:
          Number(
            formulario
              .peso_kg
          ),

        imc:
          resultado.imc ||
          imcCalculado,

        edad:
          resultado.edad ??
          Number(
            formulario.edad
          ),

        fecha_nacimiento:
          perfil?.fecha_nacimiento ||
          perfilBase
            ?.fecha_nacimiento ||
          null,

        objetivo:
          formulario.objetivo,

        nivel:
          formulario.nivel,

        dias_entrenamiento:
          Number(
            formulario
              .dias_entrenamiento
          ),

        tiempo_sesion_min:
          Number(
            formulario
              .tiempo_sesion_min
          ),

        limitaciones:
          formulario
            .limitaciones
            .trim() || null,

        observaciones:
          formulario
            .observaciones
            .trim() || null,
      }


      setPerfil(
        nuevoPerfil
      )

      setGuardadoReciente(
        true
      )

      setModo(
        'resumen'
      )


      try {
        await cargarEstadoRutina()

      } catch {
        setEstadoRutina({
          tiene_perfil: true,
          tiene_rutina: false,

          puede_generar:
            !nuevoPerfil.limitaciones,

          requiere_revision:
            Boolean(
              nuevoPerfil.limitaciones
            ),

          requiere_regenerar:
            false,

          message:
            nuevoPerfil.limitaciones
              ? 'Tus limitaciones deben ser revisadas por un entrenador antes de generar la rutina.'
              : null,
        })
      }


    } catch (err) {
      setError(
        err?.message ||
        'No pudimos guardar tu perfil.'
      )

    } finally {
      setGuardando(false)
    }
  }


  function editarPerfil() {
    setFormulario({
      estatura_cm:
        valorInicial(
          perfil?.estatura_cm
        ),

      peso_kg:
        valorInicial(
          perfil?.peso_kg
        ),

      edad:
        valorInicial(
          perfil?.edad
        ),

      objetivo:
        perfil?.objetivo || '',

      nivel:
        perfil?.nivel || '',

      dias_entrenamiento:
        valorInicial(
          perfil
            ?.dias_entrenamiento
        ),

      tiempo_sesion_min:
        valorInicial(
          perfil
            ?.tiempo_sesion_min
        ),

      limitaciones:
        perfil?.limitaciones || '',

      observaciones:
        perfil?.observaciones || '',
    })

    setGuardadoReciente(false)
    setError('')
    setPaso(1)
    setModo('formulario')
  }


  const rutina =
    estadoRutina?.rutina ||
    null

  const tieneRutina =
    Boolean(
      estadoRutina?.tiene_rutina
    )

  const requiereRevision =
    Boolean(
      estadoRutina
        ?.requiere_revision
    )

  const requiereRegenerar =
    Boolean(
      estadoRutina
        ?.requiere_regenerar
    )


  const etiquetaEstado =
    requiereRevision
      ? 'En revisión'
      : tieneRutina &&
        !requiereRegenerar
        ? 'Rutina lista'
        : perfil?.tiene_perfil
          ? 'Preparar plan'
          : 'Configurar'


  const claseEstado =
    requiereRevision
      ? 'rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
      : tieneRutina &&
        !requiereRegenerar
        ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'


  if (!activo) {
    return (
      <ExclusiveBenefitCard
        tipo="rutina"
        titulo="Mi rutina"
        subtitulo="Entrenamiento personalizado"
        activo={false}
        estadoMembresia={
          estadoMembresia
        }
      />
    )
  }


  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="mak-interactive group flex min-h-[136px] w-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-zinc-900"
      >

        <div className="flex items-start justify-between gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Dumbbell size={23} />
          </div>


          <span
            className={
              claseEstado
            }
          >
            {etiquetaEstado}
          </span>

        </div>


        <div>

          <p className="font-black text-zinc-950 dark:text-white">
            Mi rutina
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {requiereRevision
              ? 'Revisión del entrenador pendiente'

              : tieneRutina &&
                !requiereRegenerar
                ? (
                    String(
                      rutina?.dias_semana
                    ) +
                    ' días · máx. ' +
                    String(
                      rutina
                        ?.tiempo_maximo_sesion_min ||
                      perfil
                        ?.tiempo_sesion_min
                    ) +
                    ' min'
                  )

                : perfil?.tiene_perfil
                  ? requiereRegenerar
                    ? 'Tu plan necesita actualizarse'
                    : 'Perfil listo para crear tu plan'

                  : 'Completa tu perfil físico'}
          </p>

        </div>

      </button>


      {abierto && (

        <div
          className="mak-modal-backdrop fixed inset-0 z-[130] flex items-end justify-center bg-black/50 backdrop-blur-[3px] sm:items-center sm:p-5"
          onClick={cerrar}
        >

          <div
            className={
              modo === 'rutina'
                ? 'relative h-dvh w-full overflow-x-hidden overflow-y-auto bg-white shadow-2xl dark:bg-zinc-900 sm:h-[94vh] sm:max-h-[94vh] sm:max-w-5xl sm:rounded-[2rem]'
                : 'mak-modal-sheet max-h-[92vh] w-full overflow-x-hidden overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-zinc-900 sm:max-w-xl sm:rounded-[2rem]'
            }
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >

            {modo !== 'rutina' && (
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />
            )}


            {modo ===
              'rutina' &&
              tieneRutina ? (

              <RoutinePlanView
                rutina={
                  rutina
                }

                requiereRegenerar={
                  requiereRegenerar
                }

                procesandoRutina={
                  procesandoRutina
                }

                error={
                  error
                }

                diaActivo={
                  diaActivo
                }

                setDiaActivo={
                  setDiaActivo
                }

                generarRutina={
                  generarRutina
                }

                volverPerfil={() =>
                  setModo(
                    'resumen'
                  )
                }

                editarPerfil={
                  editarPerfil
                }

                cerrar={
                  cerrar
                }
              />

            ) : modo ===
              'resumen' ? (

              <div className="mak-view-enter p-5 pb-8 sm:p-6">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                      Mi rutina
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                      Base de tu entrenamiento
                    </h2>

                  </div>


                  <button
                    type="button"
                    onClick={cerrar}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-300"
                  >
                    <X size={19} />
                  </button>

                </div>


                {guardadoReciente && (

                  <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                    <CheckCircle2
                      size={22}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    />

                    <div>

                      <p className="font-black text-emerald-900 dark:text-emerald-200">
                        Perfil guardado
                      </p>

                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                        Ya tenemos la información base para personalizar tu entrenamiento.
                      </p>

                    </div>

                  </div>

                )}


                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                    <Weight
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <p className="mt-3 text-xs font-bold text-zinc-400">
                      Peso
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {perfil?.peso_kg} kg
                    </p>

                  </div>


                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                    <Ruler
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <p className="mt-3 text-xs font-bold text-zinc-400">
                      Estatura
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {perfil?.estatura_cm} cm
                    </p>

                  </div>


                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                    <Activity
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <p className="mt-3 text-xs font-bold text-zinc-400">
                      IMC referencial
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {perfil?.imc || '—'}
                    </p>

                  </div>


                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                    <CalendarDays
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <p className="mt-3 text-xs font-bold text-zinc-400">
                      Frecuencia
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {perfil
                        ?.dias_entrenamiento} días
                    </p>

                  </div>

                </div>


                <div className="mt-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

                  <div className="flex items-center gap-3">

                    <Target
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <div>

                      <p className="text-xs font-bold text-zinc-400">
                        Objetivo principal
                      </p>

                      <p className="font-black">
                        {etiquetaObjetivo(
                          perfil?.objetivo
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 flex items-center gap-3">

                    <Dumbbell
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <div>

                      <p className="text-xs font-bold text-zinc-400">
                        Nivel
                      </p>

                      <p className="font-black">
                        {etiquetaNivel(
                          perfil?.nivel
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 flex items-center gap-3">

                    <Timer
                      size={20}
                      className="text-cyan-600 dark:text-cyan-400"
                    />

                    <div>

                      <p className="text-xs font-bold text-zinc-400">
                        Tiempo por sesión
                      </p>

                      <p className="font-black">
                        {perfil
                          ?.tiempo_sesion_min} min
                      </p>

                    </div>

                  </div>

                </div>


                {(perfil?.limitaciones ||
                  perfil?.observaciones) && (

                  <div className="mt-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">

                    <div className="flex gap-3">

                      <ShieldAlert
                        size={20}
                        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                      />

                      <div>

                        <p className="font-black text-amber-900 dark:text-amber-200">
                          Información importante
                        </p>

                        {perfil
                          ?.limitaciones && (

                          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
                            {perfil.limitaciones}
                          </p>

                        )}

                      </div>

                    </div>

                  </div>

                )}


                {requiereRevision ? (

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">

                    <div className="flex gap-3">

                      <ShieldAlert
                        size={21}
                        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                      />

                      <div>

                        <p className="font-black text-amber-900 dark:text-amber-200">
                          Revisión del entrenador
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300">
                          {estadoRutina?.message ||
                            'Antes de generar tu rutina, un entrenador de MAK FITNESS debe revisar las limitaciones registradas.'}
                        </p>

                      </div>

                    </div>

                  </div>

                ) : tieneRutina ? (

                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                    <div className="flex gap-3">

                      <CheckCircle2
                        size={21}
                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      />

                      <div>

                        <p className="font-black text-emerald-900 dark:text-emerald-200">
                          {requiereRegenerar
                            ? 'Tu plan necesita actualizarse'
                            : 'Tu rutina MAK está lista'}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                          Cada sesión incluye calentamiento, trabajo principal, descansos y cierre dentro del tiempo elegido.
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"

                      onClick={
                        requiereRegenerar
                          ? generarRutina

                          : () => {
                              setDiaActivo(
                                Number(
                                  rutina
                                    ?.dias?.[0]?.dia ||
                                  1
                                )
                              )

                              setModo(
                                'rutina'
                              )
                            }
                      }

                      disabled={
                        procesandoRutina
                      }

                      className="mak-interactive mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
                    >
                      {procesandoRutina
                        ? 'Preparando...'

                        : requiereRegenerar
                          ? 'Actualizar mi rutina'
                          : 'Ver mi rutina'}
                    </button>

                  </div>

                ) : (

                  <div className="mt-5 rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-500/10">

                    <div className="flex gap-3">

                      <Sparkles
                        size={21}
                        className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
                      />

                      <div>

                        <p className="font-black text-cyan-950 dark:text-cyan-100">
                          Tu perfil está listo
                        </p>

                        <p className="mt-1 text-sm leading-6 text-cyan-900 dark:text-cyan-200">
                          Generaremos tu plan con ejercicios disponibles en MAK FITNESS y sin superar {perfil?.tiempo_sesion_min} minutos por sesión.
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={
                        generarRutina
                      }
                      disabled={
                        procesandoRutina
                      }
                      className="mak-interactive mt-4 w-full rounded-2xl bg-cyan-500 px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
                    >
                      {procesandoRutina
                        ? 'Preparando tu plan...'
                        : 'Generar mi rutina'}
                    </button>

                  </div>

                )}


                <button
                  type="button"
                  onClick={editarPerfil}
                  className="mak-interactive mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-black text-white dark:bg-white dark:text-zinc-950"
                >
                  <Pencil size={18} />
                  Actualizar perfil
                </button>

              </div>

            ) : (

              <div className="p-5 pb-8 sm:p-6">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                      Paso {paso} de 4
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                      {paso === 1 &&
                        'Conozcamos tu cuerpo'}

                      {paso === 2 &&
                        '¿Cuál es tu meta?'}

                      {paso === 3 &&
                        'Tu entrenamiento'}

                      {paso === 4 &&
                        'Antes de comenzar'}
                    </h2>

                  </div>


                  <button
                    type="button"
                    onClick={cerrar}
                    disabled={guardando}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300"
                  >
                    <X size={19} />
                  </button>

                </div>


                <div className="mt-5 grid grid-cols-4 gap-2">

                  {[1, 2, 3, 4].map(
                    (numero) => (

                    <div
                      key={numero}
                      className={
                        numero <= paso
                          ? 'h-1.5 rounded-full bg-cyan-500'
                          : 'h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700'
                      }
                    />

                  ))}

                </div>


                <div
                  key={paso}
                  className="mak-view-enter mt-6"
                >

                  {paso === 1 && (

                    <div className="space-y-4">

                      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        Usaremos estos datos como referencia para adaptar tu entrenamiento.
                      </p>


                      <label className="block">

                        <span className="text-sm font-bold">
                          Estatura
                        </span>

                        <div className="relative mt-2">

                          <input
                            type="number"
                            inputMode="decimal"
                            min="100"
                            max="250"
                            value={
                              formulario.estatura_cm
                            }
                            onChange={(evento) =>
                              actualizar(
                                'estatura_cm',
                                evento.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 pr-14 text-base font-bold outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                            placeholder="165"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                            cm
                          </span>

                        </div>

                      </label>


                      <label className="block">

                        <span className="text-sm font-bold">
                          Peso actual
                        </span>

                        <div className="relative mt-2">

                          <input
                            type="number"
                            inputMode="decimal"
                            min="20"
                            max="350"
                            step="0.1"
                            value={
                              formulario.peso_kg
                            }
                            onChange={(evento) =>
                              actualizar(
                                'peso_kg',
                                evento.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 pr-14 text-base font-bold outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                            placeholder="70.5"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                            kg
                          </span>

                        </div>

                      </label>


                      {tieneFechaNacimiento ? (

                        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                          <p className="text-xs font-bold text-zinc-400">
                            Edad
                          </p>

                          <p className="mt-1 font-black">
                            {perfil?.edad ||
                              perfilBase?.edad} años
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Calculada desde tu fecha de nacimiento registrada.
                          </p>

                        </div>

                      ) : (

                        <label className="block">

                          <span className="text-sm font-bold">
                            Edad
                          </span>

                          <input
                            type="number"
                            inputMode="numeric"
                            min="5"
                            max="100"
                            value={
                              formulario.edad
                            }
                            onChange={(evento) =>
                              actualizar(
                                'edad',
                                evento.target.value
                              )
                            }
                            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base font-bold outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                            placeholder="30"
                          />

                        </label>

                      )}


                      {imcCalculado && (

                        <div className="flex items-center justify-between rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-500/10">

                          <div>

                            <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                              IMC referencial
                            </p>

                            <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-cyan-100">
                              {imcCalculado}
                            </p>

                          </div>

                          <Activity
                            size={28}
                            className="text-cyan-500"
                          />

                        </div>

                      )}

                    </div>

                  )}


                  {paso === 2 && (

                    <div>

                      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        Elige el objetivo que mejor represente lo que quieres conseguir en este momento.
                      </p>


                      <div className="mt-4 grid grid-cols-2 gap-3">

                        {OBJETIVOS.map(
                          (objetivo) => {

                            const seleccionado =
                              formulario.objetivo ===
                              objetivo.valor

                            return (
                              <button
                                key={
                                  objetivo.valor
                                }
                                type="button"
                                onClick={() =>
                                  actualizar(
                                    'objetivo',
                                    objetivo.valor
                                  )
                                }
                                className={
                                  seleccionado
                                    ? 'min-h-[92px] rounded-2xl border-2 border-cyan-500 bg-cyan-50 p-4 text-left font-black text-cyan-950 dark:bg-cyan-500/10 dark:text-cyan-100'
                                    : 'min-h-[92px] rounded-2xl border border-zinc-200 bg-white p-4 text-left font-bold text-zinc-700 transition hover:border-cyan-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200'
                                }
                              >
                                <Target
                                  size={19}
                                  className={
                                    seleccionado
                                      ? 'mb-3 text-cyan-600'
                                      : 'mb-3 text-zinc-400'
                                  }
                                />

                                {objetivo.titulo}
                              </button>
                            )
                          }
                        )}

                      </div>

                    </div>

                  )}


                  {paso === 3 && (

                    <div className="space-y-5">

                      <div>

                        <p className="text-sm font-black">
                          Nivel de experiencia
                        </p>


                        <div className="mt-3 space-y-2">

                          {NIVELES.map(
                            (nivel) => {

                              const seleccionado =
                                formulario.nivel ===
                                nivel.valor

                              return (
                                <button
                                  key={
                                    nivel.valor
                                  }
                                  type="button"
                                  onClick={() =>
                                    actualizar(
                                      'nivel',
                                      nivel.valor
                                    )
                                  }
                                  className={
                                    seleccionado
                                      ? 'w-full rounded-2xl border-2 border-cyan-500 bg-cyan-50 p-4 text-left dark:bg-cyan-500/10'
                                      : 'w-full rounded-2xl border border-zinc-200 p-4 text-left dark:border-white/10'
                                  }
                                >

                                  <p className="font-black">
                                    {nivel.titulo}
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    {nivel.descripcion}
                                  </p>

                                </button>
                              )
                            }
                          )}

                        </div>

                      </div>


                      <div>

                        <p className="text-sm font-black">
                          ¿Cuántos días puedes entrenar?
                        </p>

                        <div className="mt-3 grid grid-cols-5 gap-2">

                          {[1,2,3,4,5].map(
                            (dia) => (

                            <button
                              key={dia}
                              type="button"
                              onClick={() =>
                                actualizar(
                                  'dias_entrenamiento',
                                  String(dia)
                                )
                              }
                              className={
                                formulario
                                  .dias_entrenamiento ===
                                  String(dia)
                                  ? 'aspect-square rounded-xl bg-cyan-500 text-sm font-black text-white'
                                  : 'aspect-square rounded-xl border border-zinc-200 text-sm font-black dark:border-white/10'
                              }
                            >
                              {dia}
                            </button>

                          ))}

                        </div>

                      </div>


                      <label className="block">

                        <span className="text-sm font-black">
                          Tiempo disponible por sesión
                        </span>

                        <select
                          value={
                            formulario
                              .tiempo_sesion_min
                          }
                          onChange={(evento) =>
                            actualizar(
                              'tiempo_sesion_min',
                              evento.target.value
                            )
                          }
                          className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base font-bold outline-none focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                        >
                          <option value="">
                            Selecciona
                          </option>
                          <option value="30">
                            30 minutos
                          </option>
                          <option value="40">
                            40 minutos
                          </option>
                          <option value="45">
                            45 minutos
                          </option>
                          <option value="50">
                            50 minutos
                          </option>
                          <option value="60">
                            60 minutos
                          </option>
                        </select>

                        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          El tiempo incluye calentamiento, ejercicios, descansos y cierre. Ninguna sesión superará 60 minutos.
                        </p>

                      </label>

                    </div>

                  )}


                  {paso === 4 && (

                    <div className="space-y-4">

                      <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">

                        <div className="flex gap-3">

                          <ShieldAlert
                            size={21}
                            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                          />

                          <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
                            Cuéntanos cualquier limitación o lesión. Si registras alguna, un entrenador deberá revisarla antes de que la app genere tu rutina.
                          </p>

                        </div>

                      </div>


                      <label className="block">

                        <span className="text-sm font-black">
                          Limitaciones o lesiones
                        </span>

                        <textarea
                          rows="3"
                          value={
                            formulario.limitaciones
                          }
                          onChange={(evento) =>
                            actualizar(
                              'limitaciones',
                              evento.target.value
                            )
                          }
                          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                          placeholder="Ej.: molestia en rodilla derecha, lesión previa de hombro..."
                        />

                      </label>


                      <label className="block">

                        <span className="text-sm font-black">
                          Observaciones
                        </span>

                        <textarea
                          rows="3"
                          value={
                            formulario.observaciones
                          }
                          onChange={(evento) =>
                            actualizar(
                              'observaciones',
                              evento.target.value
                            )
                          }
                          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-zinc-950"
                          placeholder="Algo más que quieras contarnos..."
                        />

                      </label>


                      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

                        <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                          Resumen
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

                          <div>
                            <p className="text-zinc-400">
                              Objetivo
                            </p>
                            <p className="font-black">
                              {etiquetaObjetivo(
                                formulario.objetivo
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-400">
                              Nivel
                            </p>
                            <p className="font-black">
                              {etiquetaNivel(
                                formulario.nivel
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-400">
                              Frecuencia
                            </p>
                            <p className="font-black">
                              {formulario
                                .dias_entrenamiento} días
                            </p>
                          </div>

                          <div>
                            <p className="text-zinc-400">
                              Sesión
                            </p>
                            <p className="font-black">
                              {formulario
                                .tiempo_sesion_min} min
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>

                  )}

                </div>


                {error && (

                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>

                )}


                <div className="mt-6 flex gap-3">

                  {paso > 1 && (

                    <button
                      type="button"
                      onClick={anterior}
                      disabled={guardando}
                      className="mak-interactive flex h-13 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 font-black disabled:opacity-50 dark:border-white/10"
                    >
                      <ArrowLeft
                        size={20}
                      />
                    </button>

                  )}


                  {paso < 4 ? (

                    <button
                      type="button"
                      onClick={siguiente}
                      className="mak-interactive flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white"
                    >
                      Continuar
                      <ArrowRight
                        size={19}
                      />
                    </button>

                  ) : (

                    <button
                      type="button"
                      onClick={guardarPerfil}
                      disabled={guardando}
                      className="mak-interactive flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {guardando
                        ? 'Guardando...'
                        : 'Guardar mi perfil'}

                      {!guardando && (
                        <CheckCircle2
                          size={19}
                        />
                      )}
                    </button>

                  )}

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </>
  )
}
