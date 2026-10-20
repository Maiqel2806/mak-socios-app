'use client'

import {
  Pencil,
  ShieldAlert,
  Timer,
  X,
} from 'lucide-react'


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


  return (
    <div className="mak-view-enter p-5 pb-8 sm:p-6">

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
              El tiempo estimado incluye calentamiento, trabajo principal, descansos y cierre.
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


      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">

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
              ) => (

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

                      <p className="font-black text-zinc-950 dark:text-white">
                        {ejercicio?.nombre}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {ejercicio?.grupo_muscular}

                        {ejercicio
                          ?.equipamiento
                          ? ` · ${ejercicio.equipamiento}`
                          : ''}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                        Series
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.series}
                      </p>

                    </div>


                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                        Reps
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.repeticiones}
                      </p>

                    </div>


                    <div className="rounded-xl bg-zinc-50 p-3 text-center dark:bg-white/[0.04]">

                      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-400">
                        Descanso
                      </p>

                      <p className="mt-1 font-black">
                        {ejercicio?.descanso_seg}s
                      </p>

                    </div>

                  </div>


                  {ejercicio
                    ?.intensidad && (

                    <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {ejercicio.intensidad}
                    </p>

                  )}


                  {ejercicio
                    ?.tecnica && (

                    <div className="mt-3">

                      <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                        Técnica
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {ejercicio.tecnica}
                      </p>

                    </div>

                  )}


                  {ejercicio
                    ?.recomendacion && (

                    <div className="mt-3">

                      <p className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                        Recomendación
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {ejercicio.recomendacion}
                      </p>

                    </div>

                  )}

                </div>

              )
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
