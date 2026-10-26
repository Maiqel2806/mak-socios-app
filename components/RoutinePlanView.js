'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  Pencil,
  ShieldAlert,
  Timer,
  X,
} from 'lucide-react'



import WorkoutSeriesEditor from './WorkoutSeriesEditor'

import WorkoutFinishControl from './WorkoutFinishControl'

import WorkoutCancelControl from './WorkoutCancelControl'

function textoDias(cantidad) {
  return Number(cantidad) === 1
    ? '1 día'
    : `${Number(cantidad || 0)} días`
}


export default function RoutinePlanView({
  rutina,
  requiereRegenerar,
  procesandoRutina,
  error,
  diaActivo,
  setDiaActivo,
  generarRutina,
  volverPerfil,
  editarPerfil,
  cerrar,
}) {

  // MAK_VARIANTES_RUTINA_V1
  const [
    modalVariantes,
    setModalVariantes,
  ] = useState(null)

  const [
    cargandoVariantes,
    setCargandoVariantes,
  ] = useState(false)

  const [
    errorVariantes,
    setErrorVariantes,
  ] = useState('')

  const [
    variantesAplicadas,
    setVariantesAplicadas,
  ] = useState({})


  async function abrirVariantes(
    ejercicio,
    diaNumero,
    clave
  ) {
    if (
      !ejercicio?.ejercicio_id ||
      ejercicio?.patron_movimiento ===
        'cardio'
    ) {
      return
    }

    setCargandoVariantes(true)
    setErrorVariantes('')

    setModalVariantes({
      clave,
      diaNumero,
      original: ejercicio,
      datos: null,
    })

    try {
      const respuesta =
        await fetch(
          `/api/rutina/variantes?ejercicio_id=${encodeURIComponent(
            ejercicio.ejercicio_id
          )}`
        )

      const data =
        await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          data.error ||
            'No fue posible consultar variantes.'
        )
      }

      setModalVariantes({
        clave,
        diaNumero,
        original: ejercicio,
        datos: data?.datos || null,
      })

    } catch (errorConsulta) {
      setErrorVariantes(
        errorConsulta?.message ||
          'No fue posible consultar variantes.'
      )

    } finally {
      setCargandoVariantes(false)
    }
  }


  function usarVariante(
    variante
  ) {
    if (
      !modalVariantes?.clave ||
      !modalVariantes?.original ||
      !variante
    ) {
      return
    }

    const original =
      modalVariantes.original

    const ejercicioAplicado = {
      ejercicio_id:
        variante.ejercicio_id,

      codigo:
        variante.codigo,

      nombre:
        variante.nombre,

      grupo_muscular:
        variante.grupo_muscular,

      tipo:
        variante.tipo,

      patron_movimiento:
        variante.patron_movimiento,

      equipamiento:
        variante.equipamiento,

      tecnica:
        variante.tecnica,

      recomendacion:
        variante.recomendacion,

      video_url:
        variante.video_url,

      imagen_url:
        variante.imagen_url,

      series:
        variante.series ??
        original.series,

      repeticiones:
        variante.repeticiones ??
        original.repeticiones,

      descanso_seg:
        variante.descanso_seg ??
        original.descanso_seg,

      intensidad:
        variante.intensidad ??
        original.intensidad,

      duracion_estimada_min:
        original.duracion_estimada_min,

      es_variante:
        true,

      ejercicio_original_id:
        original.ejercicio_id,

      nombre_original:
        original.nombre,
    }

    setVariantesAplicadas(
      (actual) => ({
        ...actual,

        [modalVariantes.clave]:
          ejercicioAplicado,
      })
    )

    setModalVariantes(null)
    setErrorVariantes('')
  }


  function volverOriginal(
    clave
  ) {
    setVariantesAplicadas(
      (actual) => {
        const siguiente = {
          ...actual,
        }

        delete siguiente[clave]

        return siguiente
      }
    )
  }


  const [
    avisoRepeticion,
    setAvisoRepeticion,
  ] = useState(null)

  // MAK_ENTRENAMIENTO_UI_V1
  const [
    iniciandoEntrenamiento,
    setIniciandoEntrenamiento,
  ] = useState(false)

  const [
    errorEntrenamiento,
    setErrorEntrenamiento,
  ] = useState('')


  const [
    entrenamientoActivo,
    setEntrenamientoActivo,
  ] = useState(null)

  const [
    cargandoEntrenamiento,
    setCargandoEntrenamiento,
  ] = useState(true)

  const [
    modoEntrenamiento,
    setModoEntrenamiento,
  ] = useState(false)

  const [
    ahora,
    setAhora,
  ] = useState(Date.now())


  async function cargarEntrenamiento() {

    try {

      const respuesta =
        await fetch(
          '/api/entrenamiento',
          {
            cache: 'no-store',
          }
        )

      const data =
        await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          data?.error ||
          'No fue posible recuperar el entrenamiento.'
        )
      }

      setEntrenamientoActivo(
        data?.entrenamiento || null
      )

    } catch (errorCarga) {

      console.error(
        'CARGAR ENTRENAMIENTO:',
        errorCarga
      )

    } finally {

      setCargandoEntrenamiento(false)

    }
  }


  async function iniciarEntrenamiento(
    diaNumero,
    confirmarRepeticion = false
  ) {

    // Preparar las sustituciones de este día.
    // La posición coincide con el orden guardado
    // en socio_entrenamiento_ejercicios.
    const diaProgramado = (
      Array.isArray(rutina?.dias) ? rutina.dias : []
    ).find(
      (item) => Number(item?.dia) === Number(diaNumero)
    )

    if (!diaProgramado) {
      setErrorEntrenamiento(
        'No se encontró el día seleccionado.'
      )
      return
    }

    const ejerciciosProgramados = Array.isArray(
      diaProgramado?.ejercicios
    ) ? diaProgramado.ejercicios : []

    const variantesElegidas = ejerciciosProgramados.flatMap(
      (programado, indice) => {
        const clave =
          `${diaNumero}:${programado?.ejercicio_id}`

        const elegida = variantesAplicadas[clave]

        if (!elegida?.ejercicio_id) {
          return []
        }

        return [{
          orden: indice + 1,
          ejercicio_programado_id:
            programado.ejercicio_id,
          ejercicio_realizado_id:
            elegida.ejercicio_id,
        }]
      }
    )



    setIniciandoEntrenamiento(true)
    setErrorEntrenamiento('')

    try {

      const respuesta =
        await fetch(
          '/api/entrenamiento',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              dia: Number(
                diaNumero
              ),
              confirmar_repeticion:
                confirmarRepeticion,
              variantes: variantesElegidas,
            }),
          }
        )

      const data =
        await respuesta.json()

      if (
        !respuesta.ok &&
        data?.codigo === 'ENTRENAMIENTO_YA_REALIZADO_HOY' &&
        !confirmarRepeticion
      ) {
        setAvisoRepeticion({
          dia: Number(diaNumero),
        })
        return
      }

      if (!respuesta.ok) {
        throw new Error(
          data?.error ||
          'No fue posible iniciar el entrenamiento.'
        )
      }

      setAvisoRepeticion(null)

      setEntrenamientoActivo(
        data?.entrenamiento || null
      )

      setModoEntrenamiento(
        true
      )

    } catch (errorInicio) {

      setErrorEntrenamiento(
        errorInicio?.message ||
        'No fue posible iniciar el entrenamiento.'
      )

    } finally {

      setIniciandoEntrenamiento(
        false
      )

    }
  }




  useEffect(() => {

    cargarEntrenamiento()

  }, [])


  useEffect(() => {

    if (
      !modoEntrenamiento ||
      !entrenamientoActivo
        ?.tiene_entrenamiento
    ) {
      return
    }

    const timer =
      window.setInterval(
        () => {
          setAhora(
            Date.now()
          )
        },
        1000
      )

    return () =>
      window.clearInterval(
        timer
      )

  }, [
    modoEntrenamiento,
    entrenamientoActivo,
  ])


  function tiempoTranscurrido() {

    const inicio =
      entrenamientoActivo
        ?.fecha_inicio

    if (!inicio) {
      return '00:00:00'
    }

    const segundos =
      Math.max(
        0,
        Math.floor(
          (
            ahora -
            new Date(
              inicio
            ).getTime()
          )
          /
          1000
        )
      )

    const horas =
      String(
        Math.floor(
          segundos / 3600
        )
      ).padStart(
        2,
        '0'
      )

    const minutos =
      String(
        Math.floor(
          (
            segundos % 3600
          )
          /
          60
        )
      ).padStart(
        2,
        '0'
      )

    const segundosRestantes =
      String(
        segundos % 60
      ).padStart(
        2,
        '0'
      )

    return `${horas}:${minutos}:${segundosRestantes}`
  }


  const dias =
    Array.isArray(rutina?.dias)
      ? rutina.dias
      : []

  const dia =
    dias.find(
      (item) =>
        Number(item?.dia) ===
        Number(diaActivo)
    ) ||
    dias[0] ||
    null

  const maxMin =
    rutina?.tiempo_maximo_sesion_min ||
    60

  const trabajoMin =
    rutina?.tiempo_trabajo_objetivo_min ||
    null


  if (
    modoEntrenamiento &&
    entrenamientoActivo
      ?.tiene_entrenamiento
  ) {

    const ejerciciosEntrenamiento =
      Array.isArray(
        entrenamientoActivo
          ?.ejercicios
      )
        ? entrenamientoActivo
            .ejercicios
        : []

    return (

      <div className="mak-view-enter min-h-full bg-zinc-50 p-4 pb-8 sm:p-6 dark:bg-zinc-950">


        <div className="mx-auto w-full max-w-4xl">


          <div className="flex items-start justify-between gap-4">


            <div>

              <button
                type="button"
                onClick={() =>
                  setModoEntrenamiento(
                    false
                  )
                }
                className="mb-3 text-sm font-black text-cyan-600 dark:text-cyan-400"
              >
                ← Volver a mi rutina
              </button>


              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                Entrenamiento en curso
              </p>


              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                {entrenamientoActivo
                  ?.nombre_dia ||
                  'Entrenamiento MAK'}
              </h2>

            </div>


            <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-white dark:bg-white dark:text-zinc-950">

              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                Tiempo
              </p>

              <p className="mt-1 font-mono text-lg font-black">
                {tiempoTranscurrido()}
              </p>

            </div>


          </div>


          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm dark:bg-white/[0.04]">

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-sm font-black text-zinc-950 dark:text-white">
                  Tu entrenamiento
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {ejerciciosEntrenamiento.filter((item) => item.completado === true).length} de {ejerciciosEntrenamiento.length} ejercicios completados
                </p>

              </div>


              <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                Día {entrenamientoActivo?.dia}
              </span>

            </div>

          </div>


          <div className="mt-4 space-y-3">

            {ejerciciosEntrenamiento.map(
              (
                ejercicio,
                indice
              ) => (

                <div
                  key={
                    ejercicio?.id ||
                    indice
                  }
                  className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black text-white dark:bg-white dark:text-zinc-950">
                      {indice + 1}
                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="text-base font-black text-zinc-950 dark:text-white">
                        {ejercicio?.nombre_realizado}
                      </p>

                      {ejercicio?.es_variante && (
                        <div className="mt-2 space-y-1">
                          <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                            Variante elegida
                          </span>

                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Sustituye a: {ejercicio?.nombre_programado}
                          </p>
                        </div>
                      )}

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {ejercicio?.grupo_muscular || ''}

                        {ejercicio?.equipamiento
                          ? ` · ${ejercicio.equipamiento}`
                          : ''}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                        Series
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.series_objetivo || '—'}
                      </p>

                    </div>


                    <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                        Reps
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.repeticiones_objetivo || '—'}
                      </p>

                    </div>


                    <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                        Descanso
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.descanso_seg
                          ? `${ejercicio.descanso_seg}s`
                          : '—'}
                      </p>

                    </div>

                  </div>


                  {ejercicio?.intensidad && (

                    <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {ejercicio.intensidad}
                    </p>

                  )}

                  <WorkoutSeriesEditor
                    ejercicio={ejercicio}
                    abiertoInicial={indice === 0}
                    onGuardado={cargarEntrenamiento}
                  />


                </div>

              )
            )}

          </div>


          {errorEntrenamiento && (

            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorEntrenamiento}
            </div>

          )}



          <WorkoutFinishControl
            entrenamiento={entrenamientoActivo}
            onFinalizado={() => {
              setEntrenamientoActivo(null)
              setModoEntrenamiento(false)
              setErrorEntrenamiento('')
            }}
          />

          <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-white/10">

            <WorkoutCancelControl
              onCancelado={() => {
                setEntrenamientoActivo(null)
                setModoEntrenamiento(false)
                setErrorEntrenamiento('')
              }}
            />

          </div>


        </div>

      </div>

    )
  }


  return (
    <div className="mak-view-enter mx-auto w-full max-w-4xl p-4 pb-8 sm:p-6 lg:p-8">

      {avisoRepeticion &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[4px]"
            onClick={() => {
              if (!iniciandoEntrenamiento) {
                setAvisoRepeticion(null)
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-repeticion-mak"
              className="mak-modal-sheet w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-7"
              onClick={(evento) =>
                evento.stopPropagation()
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <ShieldAlert size={27} />
                </div>

                <button
                  type="button"
                  disabled={iniciandoEntrenamiento}
                  onClick={() =>
                    setAvisoRepeticion(null)
                  }
                  aria-label="Cerrar aviso"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 disabled:opacity-40 dark:bg-white/10 dark:text-zinc-300"
                >
                  <X size={19} />
                </button>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                MAK FITNESS · MI RUTINA
              </p>

              <h2
                id="titulo-repeticion-mak"
                className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white"
              >
                Ya entrenaste este día
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Ya completaste el Día {avisoRepeticion.dia}
                de esta rutina hoy.
              </p>

              <div className="mt-4 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
                <p className="text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">
                  Si decides repetirlo, guardaremos
                  una sesión adicional. No sumará
                  dos veces al cumplimiento de tu plan,
                  pero sí formará parte de tu historial
                  y del trabajo realizado.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={iniciandoEntrenamiento}
                  onClick={() =>
                    setAvisoRepeticion(null)
                  }
                  className="mak-interactive min-h-12 rounded-2xl border border-zinc-200 px-3 py-3 text-sm font-bold text-zinc-700 disabled:opacity-50 dark:border-white/10 dark:text-zinc-200"
                >
                  Volver
                </button>

                <button
                  type="button"
                  disabled={iniciandoEntrenamiento}
                  onClick={() =>
                    iniciarEntrenamiento(
                      avisoRepeticion.dia,
                      true
                    )
                  }
                  className="mak-interactive min-h-12 rounded-2xl bg-[#02AFBB] px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {iniciandoEntrenamiento
                    ? 'Iniciando...'
                    : 'Entrenar de nuevo'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }



      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
            Mi rutina
          </p>

          <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
            {rutina?.nombre || 'Plan MAK'}
          </h2>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {textoDias(
              rutina?.dias_semana
            )} · hasta {maxMin} min por sesión
          </p>

        </div>


        <button
          type="button"
          onClick={cerrar}
          disabled={procesandoRutina}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 disabled:opacity-50 dark:bg-white/5 dark:text-zinc-300"
        >
          <X size={19} />
        </button>

      </div>


      {requiereRegenerar && (

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">

          <div className="flex gap-3">

            <ShieldAlert
              size={21}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div>

              <p className="font-black text-amber-900 dark:text-amber-200">
                Tu rutina necesita actualizarse
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-300">
                Tu perfil o el equipamiento disponible cambió. Genera una nueva versión antes de continuar.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={generarRutina}
            disabled={procesandoRutina}
            className="mak-interactive mt-4 w-full rounded-2xl bg-amber-600 px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          >
            {procesandoRutina
              ? 'Actualizando...'
              : 'Actualizar mi rutina'}
          </button>

        </div>

      )}


      {entrenamientoActivo
        ?.tiene_entrenamiento && (

        <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400">
                Entrenamiento en curso
              </p>

              <p className="mt-1 font-black text-cyan-950 dark:text-cyan-100">
                {entrenamientoActivo?.nombre_dia}
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setModoEntrenamiento(
                  true
                )
              }
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white"
            >
              Reanudar entrenamiento
            </button>

          </div>

        </div>

      )}


      <div className="mt-5 rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-500/10">

        <div className="flex gap-3">

          <Timer
            size={21}
            className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
          />

          <div>

            <p className="font-black text-cyan-950 dark:text-cyan-100">
              Sesiones de máximo {maxMin} minutos
            </p>

            <p className="mt-1 text-sm leading-6 text-cyan-900 dark:text-cyan-200">
              {trabajoMin
                ? `Hasta ${trabajoMin} min de trabajo principal, más calentamiento y cierre.`
                : 'La sesión incluye trabajo principal, calentamiento y cierre.'}
            </p>

          </div>

        </div>

      </div>


      {rutina?.recomendacion_general && (

        <div className="mt-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Intensidad segura
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {rutina.recomendacion_general}
          </p>

        </div>

      )}


      {rutina?.recomendacion_descanso && (

        <div className="mt-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Recuperación semanal
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {rutina.recomendacion_descanso}
          </p>

        </div>

      )}


      <div className="sticky top-0 z-20 -mx-4 mt-5 flex gap-2 overflow-x-auto border-y border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">

        {dias.map(
          (item) => (

            <button
              key={item?.dia}
              type="button"
              onClick={() =>
                setDiaActivo(
                  Number(item?.dia)
                )
              }
              className={
                Number(item?.dia) ===
                Number(diaActivo)
                  ? 'shrink-0 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white'
                  : 'shrink-0 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300'
              }
            >
              Día {item?.dia}
            </button>

          )
        )}

      </div>


      {dia && (

        <div
          key={dia?.dia}
          className="mak-view-enter mt-5"
        >

          <div className="flex items-end justify-between gap-3">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                Día {dia?.dia}
              </p>

              <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                {dia?.titulo}
              </h3>

            </div>


            <div className="rounded-xl bg-zinc-100 px-3 py-2 text-right dark:bg-white/5">

              <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                Estimado
              </p>

              <p className="text-sm font-black">
                {dia?.duracion_estimada_min} min
              </p>

            </div>

          </div>


          {!entrenamientoActivo
            ?.tiene_entrenamiento ? (

            <button
              type="button"
              onClick={() =>
                iniciarEntrenamiento(
                  dia?.dia
                )
              }
              disabled={
                iniciandoEntrenamiento ||
                cargandoEntrenamiento
              }
              className="mak-interactive mt-4 w-full rounded-2xl bg-zinc-950 px-5 py-4 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
            >
              {iniciandoEntrenamiento
                ? 'Iniciando entrenamiento...'
                : '▶ Iniciar entrenamiento'}
            </button>

          ) : Number(
              entrenamientoActivo?.dia
            ) === Number(
              dia?.dia
            ) ? (

            <button
              type="button"
              onClick={() =>
                setModoEntrenamiento(
                  true
                )
              }
              className="mak-interactive mt-4 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-sm font-black text-white"
            >
              Reanudar entrenamiento
            </button>

          ) : (

            <div className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-center text-xs font-bold text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
              Finaliza o cancela el entrenamiento en curso antes de iniciar otro día.
            </div>

          )}


          {errorEntrenamiento && (

            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorEntrenamiento}
            </div>

          )}


          <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">

            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
              Calentamiento · {dia?.calentamiento?.duracion_min} min
            </p>

            <p className="mt-2 text-sm leading-6 text-cyan-900 dark:text-cyan-100">
              {dia?.calentamiento?.indicacion}
            </p>

          </div>


          <div className="mt-4 space-y-3">

            {(dia?.ejercicios || []).map(
              (
                ejercicio,
                indice
              ) => {

                const clave =
                  `${dia?.dia}:${ejercicio?.ejercicio_id}`

                const ejercicioVisible =
                  variantesAplicadas[
                    clave
                  ] ||
                  ejercicio

                const tieneVariante =
                  Boolean(
                    variantesAplicadas[
                      clave
                    ]
                  )

                return (

                  <div
                    key={
                      ejercicio
                        ?.ejercicio_id ||
                      `${dia?.dia}-${indice}`
                    }
                    className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
                        {indice + 1}
                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-black text-zinc-950 dark:text-white">
                            {ejercicioVisible?.nombre}
                          </p>

                          {tieneVariante && (

                            <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                              Variante
                            </span>

                          )}

                        </div>


                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {ejercicioVisible?.grupo_muscular}

                          {ejercicioVisible
                            ?.equipamiento
                            ? ` · ${ejercicioVisible.equipamiento}`
                            : ''}
                        </p>


                        {tieneVariante && (

                          <p className="mt-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                            Sustituye a: {ejercicio?.nombre}
                          </p>

                        )}

                      </div>

                    </div>


                    <div className="mt-4 grid grid-cols-3 gap-2">

                      <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                          Series
                        </p>

                        <p className="mt-1 font-black">
                          {ejercicioVisible?.series}
                        </p>

                      </div>


                      <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                          Reps
                        </p>

                        <p className="mt-1 font-black">
                          {ejercicioVisible?.repeticiones}
                        </p>

                      </div>


                      <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                          Descanso
                        </p>

                        <p className="mt-1 font-black">
                          {ejercicioVisible?.descanso_seg}s
                        </p>

                      </div>

                    </div>


                    {ejercicioVisible
                      ?.intensidad && (

                      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {ejercicioVisible.intensidad}
                      </p>

                    )}


                    {ejercicioVisible
                      ?.tecnica && (

                      <div className="mt-3">

                        <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                          Técnica
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                          {ejercicioVisible.tecnica}
                        </p>

                      </div>

                    )}


                    {ejercicioVisible
                      ?.recomendacion && (

                      <div className="mt-3">

                        <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                          Recomendación
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                          {ejercicioVisible.recomendacion}
                        </p>

                      </div>

                    )}


                    {ejercicio
                      ?.patron_movimiento !==
                      'cardio' &&
                      ejercicio
                        ?.ejercicio_id && (

                      <div className="mt-4 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            abrirVariantes(
                              ejercicio,
                              dia?.dia,
                              clave
                            )
                          }
                          className="mak-interactive flex-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-black text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                        >
                          Ver variantes
                        </button>


                        {tieneVariante && (

                          <button
                            type="button"
                            onClick={() =>
                              volverOriginal(
                                clave
                              )
                            }
                            className="mak-interactive rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-black text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                          >
                            Original
                          </button>

                        )}

                      </div>

                    )}

                  </div>

                )
              }
            )}

          </div>


          <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

            <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
              Cierre · {dia?.cierre?.duracion_min} min
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {dia?.cierre?.indicacion}
            </p>

          </div>


          <p className="mt-3 text-xs leading-5 text-zinc-400">
            {dia?.regla_tiempo}
          </p>

        </div>

      )}


      {modalVariantes &&
        typeof document !== 'undefined' &&
        createPortal(

        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={() => {
            setModalVariantes(null)
            setErrorVariantes('')
          }}
        >

          <div
            className="max-h-[76dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[26px] bg-white p-5 shadow-2xl dark:bg-zinc-950"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                  Variantes
                </p>

                <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                  {modalVariantes
                    ?.original
                    ?.nombre}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Si el equipo está ocupado, puedes usar una alternativa que conserve la intención del ejercicio.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  setModalVariantes(null)
                  setErrorVariantes('')
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-300"
              >
                <X size={18} />
              </button>

            </div>


            {cargandoVariantes && (

              <div className="py-10 text-center text-sm font-bold text-zinc-500">
                Buscando alternativas...
              </div>

            )}


            {errorVariantes && (

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {errorVariantes}
              </div>

            )}


            {!cargandoVariantes &&
              !errorVariantes &&
              modalVariantes
                ?.datos && (

              <>

                {(modalVariantes
                  ?.datos
                  ?.variantes ||
                  []).length === 0 ? (

                  <div className="mt-5 rounded-2xl bg-zinc-50 p-5 text-center dark:bg-white/[0.04]">

                    <p className="font-black text-zinc-900 dark:text-white">
                      Sin variante equivalente
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      Para este ejercicio no tenemos otra alternativa suficientemente equivalente y disponible en MAK FITNESS.
                    </p>

                  </div>

                ) : (

                  <div className="mt-5 space-y-3">

                    {(modalVariantes
                      ?.datos
                      ?.variantes ||
                      []).map(
                      (variante) => (

                        <div
                          key={
                            variante
                              ?.ejercicio_id
                          }
                          className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <p className="font-black text-zinc-950 dark:text-white">
                                {variante?.nombre}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {variante?.grupo_muscular}

                                {variante
                                  ?.equipamiento
                                  ? ` · ${variante.equipamiento}`
                                  : ''}
                              </p>

                            </div>


                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                              Equivalencia {variante?.equivalencia || 'alta'}
                            </span>

                          </div>


                          <div className="mt-3 grid grid-cols-3 gap-2">

                            <div className="rounded-xl bg-zinc-50 p-2 text-center dark:bg-white/[0.04]">
                              <p className="text-[9px] font-black uppercase text-zinc-400">
                                Series
                              </p>
                              <p className="mt-1 text-sm font-black">
                                {variante?.series}
                              </p>
                            </div>

                            <div className="rounded-xl bg-zinc-50 p-2 text-center dark:bg-white/[0.04]">
                              <p className="text-[9px] font-black uppercase text-zinc-400">
                                Reps
                              </p>
                              <p className="mt-1 text-sm font-black">
                                {variante?.repeticiones}
                              </p>
                            </div>

                            <div className="rounded-xl bg-zinc-50 p-2 text-center dark:bg-white/[0.04]">
                              <p className="text-[9px] font-black uppercase text-zinc-400">
                                Descanso
                              </p>
                              <p className="mt-1 text-sm font-black">
                                {variante?.descanso_seg}s
                              </p>
                            </div>

                          </div>


                          {variante?.tecnica && (

                            <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                              {variante.tecnica}
                            </p>

                          )}


                          <button
                            type="button"
                            onClick={() =>
                              usarVariante(
                                variante
                              )
                            }
                            className="mak-interactive mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white"
                          >
                            Usar esta variante hoy
                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}


                <p className="mt-4 text-xs leading-5 text-zinc-400">
                  La variante conserva el patrón de movimiento y el grupo muscular principal. Ajusta la carga para mantener la técnica y el esfuerzo indicados.
                </p>

              </>

            )}

          </div>

        </div>
        ,
        document.body
      )
      }

      {rutina?.advertencia && (

        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {rutina.advertencia}
        </div>

      )}


      {error && (

        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>

      )}


      <div className="mt-6 grid grid-cols-2 gap-3">

        <button
          type="button"
          onClick={volverPerfil}
          className="mak-interactive rounded-2xl border border-zinc-200 px-4 py-3.5 text-sm font-black dark:border-white/10"
        >
          Ver perfil
        </button>


        <button
          type="button"
          onClick={editarPerfil}
          className="mak-interactive flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3.5 text-sm font-black text-white dark:bg-white dark:text-zinc-950"
        >
          <Pencil size={17} />
          Actualizar
        </button>

      </div>

    </div>
  )
}
