'use client'

import { HeartPulse, MessageCircle, PencilLine, ShieldAlert, Stethoscope } from 'lucide-react'

import { ZONAS, leerPrecauciones } from '@/lib/precauciones'

// Reemplaza el antiguo bloqueo "consulte con su coach": explica qué pasa,
// qué hacer ahora y qué puede entrenar el socio de forma segura mientras
// el entrenador revisa su caso.

export default function GuiaRevisionSalud({ perfil, mensaje, onEditar }) {
  const estado = leerPrecauciones(perfil?.limitaciones, perfil?.observaciones)
  const zonas = Object.keys(estado.zonas)

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-amber-200 bg-white dark:border-amber-500/25 dark:bg-zinc-900">
      <div className="flex gap-3 bg-amber-50 p-4 dark:bg-amber-500/10">
        <ShieldAlert size={22} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div>
          <h3 className="mak-display text-xl text-amber-950 dark:text-amber-100">Primero, cuidarte</h3>
          <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-200">
            {mensaje && !/revisad|revis/i.test(mensaje) ? mensaje : 'Indicaste un dolor actual, una lesión reciente o una condición médica. Un entrenador de MAK FITNESS revisará tu caso para armar una rutina segura.'}
          </p>
        </div>
      </div>

      <ol className="space-y-4 p-4 sm:p-5">
        <li className="flex gap-3">
          <span className="mak-bloque-letra shrink-0">1</span>
          <div>
            <p className="font-bold">Avisa hoy al entrenador de turno</p>
            <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              En recepción revisan tu perfil y lo aprueban desde el sistema. Apenas lo hagan, podrás generar tu rutina aquí mismo.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="mak-bloque-letra shrink-0">2</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Mientras tanto, entrena con seguridad</p>
            {zonas.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {zonas.map((z) => (
                  <li key={z} className="rounded-2xl bg-zinc-50 p-3 text-sm leading-6 dark:bg-white/[0.04]">
                    <p className="font-bold">{ZONAS[z].nombre}</p>
                    <p className="text-zinc-700 dark:text-zinc-300"><span className="font-semibold text-emerald-700 dark:text-emerald-400">Puedes:</span> {ZONAS[z].puedes}</p>
                    <p className="text-zinc-700 dark:text-zinc-300"><span className="font-semibold text-red-600 dark:text-red-400">Evita:</span> {ZONAS[z].consejo}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Caminata o bicicleta suave de 20 a 30 minutos y ejercicios de movilidad sin dolor.
              </p>
            )}
          </div>
        </li>

        <li className="flex gap-3">
          <span className="mak-bloque-letra shrink-0">3</span>
          <div>
            <p className="flex items-center gap-1.5 font-bold"><Stethoscope size={16} aria-hidden="true" /> Cuándo ver a un médico</p>
            <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Si tienes dolor fuerte o que empeora, hinchazón, adormecimiento, o te operaron hace poco, consulta a un profesional de la salud antes de entrenar esa zona.
            </p>
          </div>
        </li>

        {estado.medica && (
          <li className="flex gap-3 rounded-2xl bg-red-50 p-3 text-sm leading-6 text-red-900 dark:bg-red-500/10 dark:text-red-100">
            <HeartPulse size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            Por tu condición médica, trae la autorización o indicaciones de tu doctor; el entrenador ajustará la intensidad a lo que te recomienden.
          </li>
        )}
      </ol>

      <div className="flex flex-col gap-2 border-t border-zinc-100 p-4 dark:border-white/10 sm:flex-row">
        <button
          type="button"
          onClick={onEditar}
          className="mak-interactive inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-bold dark:border-white/10"
        >
          <PencilLine size={16} aria-hidden="true" /> Actualizar mi información de salud
        </button>
        <p className="flex flex-1 items-center gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <MessageCircle size={15} className="shrink-0" aria-hidden="true" />
          Si ya te recuperaste o solo es una molestia leve, actualízalo y la rutina se adaptará sola.
        </p>
      </div>
    </section>
  )
}
