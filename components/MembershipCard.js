'use client'

import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'


function fecha(
  valor
) {
  if (!valor) {
    return '-'
  }

  const [
    anio,
    mes,
    dia,
  ] =
    String(valor)
      .slice(0, 10)
      .split('-')

  return `${dia}/${mes}/${anio}`
}


function whatsappNumero(
  numero
) {
  const limpio =
    String(
      numero || ''
    ).replace(
      /\D/g,
      ''
    )

  if (
    limpio.startsWith('593')
  ) {
    return limpio
  }

  if (
    limpio.startsWith('0')
  ) {
    return `593${limpio.slice(1)}`
  }

  if (
    limpio.length === 9
  ) {
    return `593${limpio}`
  }

  return limpio
}


function whatsappUrl(
  numero,
  mensaje
) {
  const telefono =
    whatsappNumero(
      numero
    )

  if (!telefono) {
    return ''
  }

  return (
    `https://wa.me/${telefono}` +
    `?text=${encodeURIComponent(mensaje)}`
  )
}


function Modal({
  abierto,
  onClose,
  children,
}) {
  useEffect(
    () => {
      if (!abierto) {
        return
      }

      const anterior =
        document.body.style.overflow

      document.body.style.overflow =
        'hidden'


      const escape = (
        evento
      ) => {
        if (
          evento.key === 'Escape'
        ) {
          onClose()
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
      onClose,
    ]
  )


  if (!abierto) {
    return null
  }


  return (
    <div
      className="mak-modal-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-5"
      onClick={
        onClose
      }
    >

      <div
        className="mak-modal-sheet max-h-[92vh] w-full overflow-x-hidden overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-zinc-900 sm:max-w-xl sm:rounded-[2rem]"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {children}

      </div>

    </div>
  )
}


function Cabecera({
  titulo,
  subtitulo,
  onClose,
  onBack,
}) {
  return (
    <div className="mak-view-enter sticky top-0 z-10 border-b border-zinc-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 sm:px-6">

      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />


      <div className="flex items-start gap-3">

        {onBack && (

          <button
            type="button"
            onClick={
              onBack
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300"
          >
            <ChevronLeft
              size={20}
            />
          </button>

        )}


        <div className="min-w-0 flex-1">

          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            {titulo}
          </h2>

          {subtitulo && (
            <p className="mt-1 text-sm text-zinc-500">
              {subtitulo}
            </p>
          )}

        </div>


        <button
          type="button"
          onClick={
            onClose
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-300"
        >
          <X size={19} />
        </button>

      </div>

    </div>
  )
}


function MarcaBanco({
  codigo,
  nombre,
}) {
  if (
    codigo === 'pichincha'
  ) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 font-black text-zinc-950">
        P
      </div>
    )
  }


  if (
    codigo === 'guayaquil'
  ) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-600 font-black text-white">
        G
      </div>
    )
  }


  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
      <Building2
        size={20}
      />
    </div>
  )
}


export default function MembershipCard({
  membresia,
  metodosPago,
  nombreSocio,
  codigoSocio,
}) {
  const [
    abierto,
    setAbierto,
  ] = useState(false)

  const [
    pantalla,
    setPantalla,
  ] = useState('detalle')

  const [
    cuentaCopiada,
    setCuentaCopiada,
  ] = useState(null)


  const transferencia =
    metodosPago?.transferencia

  const cuentas =
    Array.isArray(
      transferencia?.cuentas
    )
      ? transferencia.cuentas
      : []

  const whatsapp =
    metodosPago?.whatsapp_gym

  const dias =
    Number(
      membresia?.dias_restantes || 0
    )

  const activa =
    membresia?.estado_visual ===
    'activa'

  const vencida =
    Boolean(
      membresia?.tiene_membresia
    ) &&
    (
      membresia?.estado_visual ===
        'vencida' ||
      (
        !membresia
          ?.puede_entrenar_hoy &&
        dias === 0
      )
    )

  // Menos de 7 días:
  // 1 a 6 días.
  const vigenciaUrgente =
    activa &&
    dias < 7

  // Con más de 7 días mostramos
  // confirmación antes de renovar.
  const renovacionAnticipada =
    activa &&
    dias > 7


  function iniciarRenovacion() {
    if (
      renovacionAnticipada
    ) {
      setPantalla(
        'confirmar-renovacion'
      )
      return
    }

    setPantalla(
      'pagos'
    )
  }


  function abrir() {
    setPantalla('detalle')
    setAbierto(true)
  }


  function cerrar() {
    setAbierto(false)
    setPantalla('detalle')
  }


  useEffect(
    () => {
      function abrirDesdeBeneficio() {
        setPantalla(
          'detalle'
        )

        setAbierto(
          true
        )
      }


      window.addEventListener(
        'mak:abrir-membresia',
        abrirDesdeBeneficio
      )


      return () => {
        window.removeEventListener(
          'mak:abrir-membresia',
          abrirDesdeBeneficio
        )
      }
    },
    []
  )


  async function copiarCuenta(
    cuenta
  ) {
    try {
      await navigator
        .clipboard
        .writeText(
          cuenta.numero_cuenta
        )

      setCuentaCopiada(
        cuenta.id
      )

      setTimeout(
        () =>
          setCuentaCopiada(
            null
          ),
        1800
      )

    } catch {
      window.alert(
        'No fue posible copiar la cuenta.'
      )
    }
  }


  const mensajeComprobante =
    [
      `Hola, soy ${nombreSocio}, mi código es ${codigoSocio}.`,
      '',
      'Realicé una transferencia o depósito para renovar mi membresía.',
      'Adjunto mi comprobante de pago para su validación.',
    ].join('\n')


  const mensajeTarjeta =
    [
      `Hola, soy ${nombreSocio}, mi código es ${codigoSocio}.`,
      '',
      metodosPago?.tarjeta
        ?.solicitud_mensaje ||
        'Quiero renovar mi membresía y pagar con tarjeta. Por favor envíame el link de pago.',
    ].join('\n')


  const urlComprobante =
    whatsappUrl(
      whatsapp,
      mensajeComprobante
    )

  const urlTarjeta =
    whatsappUrl(
      whatsapp,
      mensajeTarjeta
    )


  return (
    <>
      <button
        type="button"
        onClick={
          abrir
        }
        className="mak-interactive group flex min-h-[136px] w-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900"
      >

        <div className="flex items-start justify-between gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
            <WalletCards
              size={22}
            />
          </div>


          <ChevronRight
            size={21}
            className="text-zinc-300 transition group-hover:translate-x-1"
          />

        </div>


        <div>

          <p className="font-black text-zinc-950 dark:text-white">
            Mi membresía
          </p>


          {activa ? (

            <div
              className={
                vigenciaUrgente
                  ? 'mt-2 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-white shadow-sm'
                  : 'mt-2 flex items-end gap-1.5'
              }
            >

              <span
                className={
                  vigenciaUrgente
                    ? 'text-2xl font-black leading-none text-white'
                    : 'text-2xl font-black leading-none text-cyan-600 dark:text-cyan-400'
                }
              >
                {dias}
              </span>

              <span
                className={
                  vigenciaUrgente
                    ? 'text-xs font-bold text-white'
                    : 'text-xs font-semibold text-zinc-500'
                }
              >
                {dias === 1
                  ? 'día disponible'
                  : 'días disponibles'}
              </span>

            </div>

          ) : vencida ? (

            <div className="mt-2 inline-flex items-center rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white shadow-sm">
              Membresía vencida
            </div>

          ) : (

            <p className="mt-2 text-xs text-zinc-500">
              Consulta tu plan y vigencia
            </p>

          )}

        </div>

      </button>


      <Modal
        abierto={
          abierto
        }
        onClose={
          cerrar
        }
      >

        {pantalla ===
          'detalle' && (

          <>
            <Cabecera
              titulo="Mi membresía"
              subtitulo="Información de tu plan actual"
              onClose={
                cerrar
              }
            />


            <div className="mak-view-enter p-4 pb-7 sm:p-6">

              {!membresia
                ?.tiene_membresia ? (

                <div className="rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-500 dark:bg-white/5">
                  No encontramos una membresía asociada.
                </div>

              ) : (

                <>
                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                        Plan actual
                      </p>

                      <h3 className="mt-2 max-w-[21ch] break-words text-[clamp(1.2rem,5vw,1.5rem)] font-black leading-snug text-zinc-950 dark:text-white">
                        {membresia.plan_nombre}
                      </h3>

                    </div>


                    {activa && (

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">

                        <CheckCircle2
                          size={15}
                        />

                        Activa

                      </span>

                    )}

                  </div>


                  {vencida && (

                    <>
                      <div className="mt-5 rounded-3xl bg-red-600 p-5 text-white shadow-sm">

                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                          Estado de membresía
                        </p>

                        <div className="mt-2 flex items-end gap-2">

                          <span className="text-3xl font-black leading-none text-white">
                            Vencida
                          </span>

                          <span className="pb-0.5 text-sm font-bold text-white">
                            0 días disponibles
                          </span>

                        </div>

                      </div>


                      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

                        <div className="flex gap-3">

                          <AlertTriangle
                            size={22}
                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                          />

                          <div>

                            <p className="font-black text-red-900 dark:text-red-200">
                              Tu membresía ha caducado
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
                              Renueva tu membresía para continuar disfrutando de los beneficios exclusivos de MAK FITNESS y MAK Socios.
                            </p>

                          </div>

                        </div>

                      </div>
                    </>

                  )}


                  {activa && (

                    <div
                      className={
                        vigenciaUrgente
                          ? 'mt-5 rounded-3xl bg-orange-500 p-5 text-white'
                          : 'mt-4 rounded-2xl bg-zinc-950 p-4 text-white dark:bg-black'
                      }
                    >

                      <p
                        className={
                          vigenciaUrgente
                            ? 'text-xs font-bold uppercase tracking-[0.16em] text-white'
                            : 'text-xs font-bold uppercase tracking-[0.16em] text-zinc-400'
                        }
                      >
                        Tiempo disponible
                      </p>

                      <div className="mt-2 flex items-end gap-2">

                        <span
                          className={
                            vigenciaUrgente
                              ? 'text-5xl font-black text-white'
                              : 'text-5xl font-black text-cyan-400'
                          }
                        >
                          {dias}
                        </span>

                        <span
                          className={
                            vigenciaUrgente
                              ? 'pb-1 text-sm font-bold text-white'
                              : 'pb-1 text-sm font-bold text-zinc-300'
                          }
                        >
                          {dias === 1
                            ? 'día restante'
                            : 'días restantes'}
                        </span>

                      </div>

                    </div>

                  )}


                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                      <p className="text-xs text-zinc-500">
                        Inicio
                      </p>

                      <p className="mt-1 font-bold text-zinc-950 dark:text-white">
                        {fecha(
                          membresia.fecha_inicio
                        )}
                      </p>

                    </div>


                    <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                      <p className="text-xs text-zinc-500">
                        Vigente hasta
                      </p>

                      <p className="mt-1 font-bold text-zinc-950 dark:text-white">
                        {fecha(
                          membresia.fecha_fin
                        )}
                      </p>

                    </div>

                  </div>


                  {!membresia
                    .es_fecha_fija && (

                    <div className="mt-3 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

                      <p className="text-xs text-zinc-500">
                        Próxima fecha de pago
                      </p>

                      <p className="mt-1 font-bold text-zinc-950 dark:text-white">
                        {fecha(
                          membresia.fecha_proximo_pago
                        )}
                      </p>

                    </div>

                  )}


                  {membresia.precio !==
                    null &&
                    membresia.precio !==
                    undefined && (

                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-white/10">

                      <span className="text-sm text-zinc-500">
                        Valor del plan
                      </span>

                      <span className="text-xl font-black text-zinc-950 dark:text-white">
                        $
                        {Number(
                          membresia.precio
                        ).toFixed(2)}
                      </span>

                    </div>

                  )}


                  <button
                    type="button"
                    onClick={
                      iniciarRenovacion
                    }
                    className={
                      vencida
                        ? 'mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-4 text-sm font-black text-white transition hover:bg-red-700'
                        : 'mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white transition hover:bg-cyan-600 dark:bg-cyan-400 dark:text-zinc-950'
                    }
                  >
                    <CreditCard
                      size={19}
                    />

                    {vencida
                      ? 'Renovar membresía ahora'
                      : 'Renovar membresía'}
                  </button>

                </>

              )}

            </div>
          </>

        )}


        {pantalla ===
          'confirmar-renovacion' && (

          <>
            <Cabecera
              titulo="Renovación anticipada"
              subtitulo="Tu vigencia actual está protegida"
              onClose={
                cerrar
              }
              onBack={() =>
                setPantalla(
                  'detalle'
                )
              }
            />


            <div className="mak-view-enter p-5 pb-8 sm:p-6">

              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-500/20 dark:bg-cyan-500/10">

                <div className="flex gap-3">

                  <CalendarDays
                    size={24}
                    className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
                  />

                  <div>

                    <p className="text-lg font-black text-zinc-950 dark:text-white">
                      Aún cuentas con {dias} días de vigencia
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      Puedes renovar desde ahora sin perder los días que ya tienes disponibles.
                    </p>

                  </div>

                </div>

              </div>


              <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">

                <p className="font-bold text-zinc-950 dark:text-white">
                  ¿Qué sucede con tu nueva vigencia?
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Una vez registrado y validado tu pago, la renovación se aplicará a continuación de tu vigencia actual.
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-200">
                  Tus días actuales no se pierden ni se reemplazan.
                </p>

              </div>


              <p className="mt-5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                ¿Deseas continuar con la renovación?
              </p>


              <button
                type="button"
                onClick={() =>
                  setPantalla(
                    'pagos'
                  )
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white transition hover:bg-cyan-600 dark:bg-cyan-400 dark:text-zinc-950"
              >
                <CheckCircle2
                  size={19}
                />

                Sí, continuar con la renovación
              </button>


              <button
                type="button"
                onClick={() =>
                  setPantalla(
                    'detalle'
                  )
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Ahora no
              </button>

            </div>
          </>

        )}


        {pantalla ===
          'pagos' && (

          <>
            <Cabecera
              titulo="Renovar membresía"
              subtitulo="Selecciona el método de pago"
              onClose={
                cerrar
              }
              onBack={() =>
                setPantalla(
                  'detalle'
                )
              }
            />


            <div className="mak-view-enter p-5 pb-8 sm:p-6">

              <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">

                {metodosPago
                  ?.efectivo
                  ?.activo && (

                  <button
                    type="button"
                    onClick={() =>
                      setPantalla(
                        'efectivo'
                      )
                    }
                    className="mak-interactive flex w-full items-center gap-3 border-b border-zinc-100 p-4 text-left dark:border-white/10"
                  >

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Banknote
                        size={20}
                      />
                    </div>

                    <div className="flex-1">

                      <p className="font-bold text-zinc-950 dark:text-white">
                        Efectivo
                      </p>

                      <p className="text-xs text-zinc-500">
                        Pago en recepción
                      </p>

                    </div>

                    <ChevronRight
                      size={20}
                      className="text-zinc-400"
                    />

                  </button>

                )}


                {transferencia
                  ?.activo && (

                  <button
                    type="button"
                    onClick={() =>
                      setPantalla(
                        'transferencia'
                      )
                    }
                    className="mak-interactive flex w-full items-center gap-3 border-b border-zinc-100 p-4 text-left dark:border-white/10"
                  >

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Building2
                        size={20}
                      />
                    </div>

                    <div className="flex-1">

                      <p className="font-bold text-zinc-950 dark:text-white">
                        Transferencia / depósito
                      </p>

                      <p className="text-xs text-zinc-500">
                        {cuentas.length} cuentas disponibles
                      </p>

                    </div>

                    <ChevronRight
                      size={20}
                      className="text-zinc-400"
                    />

                  </button>

                )}


                {metodosPago
                  ?.tarjeta
                  ?.activo && (

                  <button
                    type="button"
                    onClick={() =>
                      setPantalla(
                        'tarjeta'
                      )
                    }
                    className="mak-interactive flex w-full items-center gap-3 p-4 text-left"
                  >

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <CreditCard
                        size={20}
                      />
                    </div>

                    <div className="flex-1">

                      <p className="font-bold text-zinc-950 dark:text-white">
                        Tarjeta débito o crédito
                      </p>

                      <p className="text-xs text-zinc-500">
                        Solicita tu link de pago
                      </p>

                    </div>

                    <ChevronRight
                      size={20}
                      className="text-zinc-400"
                    />

                  </button>

                )}

              </div>

            </div>
          </>

        )}


        {pantalla ===
          'efectivo' && (

          <>
            <Cabecera
              titulo="Pago en efectivo"
              onClose={
                cerrar
              }
              onBack={() =>
                setPantalla(
                  'pagos'
                )
              }
            />

            <div className="mak-view-enter p-5 pb-8 sm:p-6">

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Paga directamente en recepción
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200/80">
                  {metodosPago
                    ?.efectivo
                    ?.mensaje}
                </p>

              </div>

            </div>
          </>

        )}


        {pantalla ===
          'transferencia' && (

          <>
            <Cabecera
              titulo="Transferencia / depósito"
              subtitulo="Selecciona una cuenta"
              onClose={
                cerrar
              }
              onBack={() =>
                setPantalla(
                  'pagos'
                )
              }
            />


            <div className="mak-view-enter p-5 pb-8 sm:p-6">

              <div className="space-y-3">

                {cuentas.map(
                  (cuenta) => (

                    <div
                      key={
                        cuenta.id
                      }
                      className="rounded-3xl border border-zinc-200 p-4 dark:border-white/10"
                    >

                      <div className="flex items-center gap-3">

                        <MarcaBanco
                          codigo={
                            cuenta.banco_codigo
                          }
                          nombre={
                            cuenta.nombre_banco
                          }
                        />

                        <div>

                          <p className="font-black text-zinc-950 dark:text-white">
                            {cuenta.nombre_banco}
                          </p>

                          <p className="text-xs capitalize text-zinc-500">
                            Cuenta {cuenta.tipo_cuenta}
                          </p>

                        </div>

                      </div>


                      <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="text-xs text-zinc-500">
                              Número de cuenta
                            </p>

                            <p className="mt-1 break-all text-lg font-black text-zinc-950 dark:text-white">
                              {cuenta.numero_cuenta}
                            </p>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              copiarCuenta(
                                cuenta
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-800"
                          >
                            {cuentaCopiada ===
                            cuenta.id
                              ? (
                                <Check
                                  size={18}
                                />
                              )
                              : (
                                <Copy
                                  size={18}
                                />
                              )}
                          </button>

                        </div>


                        <div className="mt-4 border-t border-zinc-200 pt-4 text-sm dark:border-white/10">

                          <div className="flex justify-between gap-4">

                            <span className="text-zinc-500">
                              Titular
                            </span>

                            <span className="text-right font-semibold">
                              {cuenta.titular}
                            </span>

                          </div>


                          <div className="mt-2 flex justify-between gap-4">

                            <span className="text-zinc-500">
                              Identificación
                            </span>

                            <span className="text-right font-semibold">
                              {cuenta.identificacion}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>


              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex gap-3">

                  <ShieldCheck
                    size={20}
                    className="shrink-0 text-amber-600"
                  />

                  <p className="text-sm leading-5 text-amber-800">
                    {transferencia
                      ?.aviso_comprobante}
                  </p>

                </div>

              </div>


              {urlComprobante && (

                <a
                  href={
                    urlComprobante
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-black text-white"
                >
                  <MessageCircle
                    size={19}
                  />

                  Enviar comprobante por WhatsApp
                </a>

              )}

            </div>
          </>

        )}


        {pantalla ===
          'tarjeta' && (

          <>
            <Cabecera
              titulo="Pago con tarjeta"
              onClose={
                cerrar
              }
              onBack={() =>
                setPantalla(
                  'pagos'
                )
              }
            />


            <div className="mak-view-enter p-5 pb-8 sm:p-6">

              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {metodosPago
                  ?.tarjeta
                  ?.mensaje}
              </p>


              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex gap-3">

                  <AlertTriangle
                    size={20}
                    className="shrink-0 text-amber-600"
                  />

                  <div>

                    <p className="font-bold text-amber-900">
                      Importante
                    </p>

                    <p className="mt-1 text-sm leading-5 text-amber-800">
                      {metodosPago
                        ?.tarjeta
                        ?.recargo_mensaje}
                    </p>

                  </div>

                </div>

              </div>


              {urlTarjeta && (

                <a
                  href={
                    urlTarjeta
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 text-sm font-black text-white"
                >
                  <MessageCircle
                    size={19}
                  />

                  Solicitar link de pago
                </a>

              )}

            </div>
          </>

        )}

      </Modal>

    </>
  )
}
