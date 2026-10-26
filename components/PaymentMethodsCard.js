'use client'

import {
  AlertTriangle,
  Banknote,
  Building2,
  Check,
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


function normalizarWhatsApp(
  numero
) {
  const limpio =
    String(
      numero || ''
    ).replace(
      /\D/g,
      ''
    )

  if (!limpio) {
    return ''
  }

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
    limpio.length === 9 &&
    limpio.startsWith('9')
  ) {
    return `593${limpio}`
  }

  return limpio
}


function crearWhatsAppUrl(
  numero,
  mensaje
) {
  const telefono =
    normalizarWhatsApp(
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


function BancoMarca({
  codigo,
  nombre,
}) {
  if (
    codigo === 'pichincha'
  ) {
    return (
      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-xl font-black text-slate-900 shadow-sm">
          P
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
            Banco
          </p>

          <p className="font-black text-zinc-950 dark:text-white">
            Pichincha
          </p>
        </div>

      </div>
    )
  }


  if (
    codigo === 'guayaquil'
  ) {
    return (
      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-600 text-xl font-black text-white shadow-sm">
          G
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
            Banco
          </p>

          <p className="font-black text-zinc-950 dark:text-white">
            Guayaquil
          </p>
        </div>

      </div>
    )
  }


  return (
    <div className="flex items-center gap-3">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
        <Building2
          size={22}
        />
      </div>

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
          Banco
        </p>

        <p className="font-black text-zinc-950 dark:text-white">
          {nombre}
        </p>

      </div>

    </div>
  )
}


function BottomSheet({
  abierto,
  titulo,
  subtitulo,
  icono,
  onClose,
  children,
}) {
  useEffect(
    () => {
      if (!abierto) {
        return
      }

      const overflowAnterior =
        document.body.style.overflow

      document.body.style.overflow =
        'hidden'


      function teclaEscape(
        evento
      ) {
        if (
          evento.key === 'Escape'
        ) {
          onClose()
        }
      }


      window.addEventListener(
        'keydown',
        teclaEscape
      )


      return () => {
        document.body.style.overflow =
          overflowAnterior

        window.removeEventListener(
          'keydown',
          teclaEscape
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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-5"
      onClick={
        onClose
      }
    >

      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-zinc-900 sm:max-w-xl sm:rounded-[2rem]"
        onClick={(evento) =>
          evento.stopPropagation()
        }
      >

        <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 sm:px-6">

          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />


          <div className="flex items-start justify-between gap-4">

            <div className="flex min-w-0 items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                {icono}
              </div>


              <div className="min-w-0">

                <h3 className="text-lg font-black text-zinc-950 dark:text-white">
                  {titulo}
                </h3>

                {subtitulo && (
                  <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                    {subtitulo}
                  </p>
                )}

              </div>

            </div>


            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Cerrar"
            >
              <X size={19} />
            </button>

          </div>

        </div>


        <div className="p-5 pb-8 sm:p-6">
          {children}
        </div>

      </div>

    </div>
  )
}


export default function PaymentMethodsCard({
  metodos,
  nombreSocio,
  codigoSocio,
}) {
  const [
    metodoAbierto,
    setMetodoAbierto,
  ] = useState(null)

  const [
    cuentaCopiada,
    setCuentaCopiada,
  ] = useState(null)


  if (!metodos) {
    return null
  }


  const efectivo =
    metodos.efectivo

  const transferencia =
    metodos.transferencia

  const tarjeta =
    metodos.tarjeta

  const cuentas =
    Array.isArray(
      transferencia?.cuentas
    )
      ? transferencia.cuentas
      : []

  const whatsappGym =
    metodos.whatsapp_gym || ''


  const nombre =
    String(
      nombreSocio ||
      'Socio MAK'
    ).trim()

  const codigo =
    String(
      codigoSocio || ''
    ).trim()


  const hayMetodos =
    efectivo?.activo ||
    transferencia?.activo ||
    tarjeta?.activo


  if (!hayMetodos) {
    return null
  }


  const mensajeTransferencia =
    [
      `Hola, soy ${nombre}${codigo ? `, mi código es ${codigo}` : ''}.`,
      '',
      'Realicé una transferencia o depósito para renovar mi membresía.',
      'Adjunto mi comprobante de pago para su validación.',
    ].join('\n')


  const mensajeTarjeta =
    [
      `Hola, soy ${nombre}${codigo ? `, mi código es ${codigo}` : ''}.`,
      '',
      tarjeta?.solicitud_mensaje ||
        'Quiero renovar mi membresía y pagar con tarjeta. Por favor envíame el link de pago.',
    ].join('\n')


  const urlComprobante =
    crearWhatsAppUrl(
      whatsappGym,
      mensajeTransferencia
    )


  const urlTarjeta =
    crearWhatsAppUrl(
      whatsappGym,
      mensajeTarjeta
    )


  async function copiarCuenta(
    cuenta
  ) {
    const numero =
      cuenta?.numero_cuenta

    if (!numero) {
      return
    }

    try {
      await navigator
        .clipboard
        .writeText(
          numero
        )

      setCuentaCopiada(
        cuenta.id
      )

      window.setTimeout(
        () => {
          setCuentaCopiada(
            null
          )
        },
        1800
      )

    } catch {
      window.alert(
        'No fue posible copiar el número de cuenta.'
      )
    }
  }


  function cerrarMetodo() {
    setMetodoAbierto(null)
  }


  return (
    <>
      <section className="mt-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">

        <div className="p-5 sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.17em] text-cyan-600 dark:text-cyan-400">
                Pagos
              </p>

              <h2 className="mt-2 text-xl font-black text-zinc-950 dark:text-white">
                Renovar membresía
              </h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Elige cómo deseas realizar tu pago.
              </p>

            </div>


            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <WalletCards
                size={22}
              />
            </div>

          </div>


          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10">

            {efectivo?.activo && (

              <button
                type="button"
                onClick={() =>
                  setMetodoAbierto(
                    'efectivo'
                  )
                }
                className="flex w-full items-center gap-3 border-b border-zinc-100 p-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Banknote
                    size={20}
                  />
                </div>


                <div className="min-w-0 flex-1">

                  <p className="font-bold text-zinc-950 dark:text-white">
                    Efectivo
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pago directamente en recepción
                  </p>

                </div>


                <ChevronRight
                  size={20}
                  className="shrink-0 text-zinc-400"
                />

              </button>
            )}


            {transferencia?.activo && (

              <button
                type="button"
                onClick={() =>
                  setMetodoAbierto(
                    'transferencia'
                  )
                }
                className="flex w-full items-center gap-3 border-b border-zinc-100 p-4 text-left transition last:border-b-0 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <Building2
                    size={20}
                  />
                </div>


                <div className="min-w-0 flex-1">

                  <p className="font-bold text-zinc-950 dark:text-white">
                    Transferencia / depósito
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    {cuentas.length === 1
                      ? '1 cuenta disponible'
                      : `${cuentas.length} cuentas disponibles`}
                  </p>

                </div>


                <ChevronRight
                  size={20}
                  className="shrink-0 text-zinc-400"
                />

              </button>
            )}


            {tarjeta?.activo && (

              <button
                type="button"
                onClick={() =>
                  setMetodoAbierto(
                    'tarjeta'
                  )
                }
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <CreditCard
                    size={20}
                  />
                </div>


                <div className="min-w-0 flex-1">

                  <p className="font-bold text-zinc-950 dark:text-white">
                    Tarjeta débito o crédito
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Solicita tu link de pago
                  </p>

                </div>


                <ChevronRight
                  size={20}
                  className="shrink-0 text-zinc-400"
                />

              </button>
            )}

          </div>

        </div>

      </section>


      <BottomSheet
        abierto={
          metodoAbierto ===
          'efectivo'
        }
        titulo="Pago en efectivo"
        subtitulo="Realiza tu renovación directamente en MAK FITNESS."
        icono={
          <Banknote size={22} />
        }
        onClose={
          cerrarMetodo
        }
      >

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

          <div className="flex gap-3">

            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <div>

              <p className="font-bold text-emerald-900 dark:text-emerald-200">
                Paga en recepción
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200/80">
                {efectivo?.mensaje ||
                  'Realiza tu pago directamente en recepción de MAK FITNESS.'}
              </p>

            </div>

          </div>

        </div>


        <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Tu nueva vigencia aparecerá en MAK Socios una vez que el pago sea registrado por el personal del gimnasio.
        </p>

      </BottomSheet>


      <BottomSheet
        abierto={
          metodoAbierto ===
          'transferencia'
        }
        titulo="Transferencia / depósito"
        subtitulo="Elige la cuenta bancaria que prefieras."
        icono={
          <Building2 size={22} />
        }
        onClose={
          cerrarMetodo
        }
      >

        <div className="space-y-3">

          {cuentas.map(
            (cuenta) => (

              <div
                key={
                  cuenta.id
                }
                className="rounded-3xl border border-zinc-200 p-4 dark:border-white/10"
              >

                <BancoMarca
                  codigo={
                    cuenta.banco_codigo
                  }
                  nombre={
                    cuenta.nombre_banco
                  }
                />


                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-white/[0.04]">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-xs font-semibold text-zinc-500">
                        Cuenta{' '}
                        <span className="capitalize">
                          {cuenta.tipo_cuenta}
                        </span>
                      </p>

                      <p className="mt-1 break-all text-xl font-black tracking-wide text-zinc-950 dark:text-white">
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      aria-label="Copiar número de cuenta"
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


                  <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-white/10">

                    <div className="flex justify-between gap-4">

                      <span className="text-zinc-500">
                        Titular
                      </span>

                      <span className="text-right font-semibold text-zinc-900 dark:text-white">
                        {cuenta.titular}
                      </span>

                    </div>


                    <div className="flex justify-between gap-4">

                      <span className="text-zinc-500">
                        Identificación
                      </span>

                      <span className="text-right font-semibold text-zinc-900 dark:text-white">
                        {cuenta.identificacion}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            )
          )}

        </div>


        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">

          <div className="flex gap-3">

            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div>

              <p className="font-bold text-amber-900 dark:text-amber-200">
                Conserva tu comprobante
              </p>

              <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-200/80">
                {transferencia?.aviso_comprobante ||
                  'Por seguridad, conserva tu comprobante de pago.'}
              </p>

            </div>

          </div>

        </div>


        {urlComprobante && (

          <a
            href={
              urlComprobante
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-emerald-600"
          >
            <MessageCircle
              size={19}
            />

            Enviar comprobante por WhatsApp
          </a>

        )}


        <p className="mt-2 text-center text-xs leading-5 text-zinc-400">
          WhatsApp abrirá el chat de MAK FITNESS. Adjunta allí la foto del comprobante.
        </p>

      </BottomSheet>


      <BottomSheet
        abierto={
          metodoAbierto ===
          'tarjeta'
        }
        titulo="Pago con tarjeta"
        subtitulo="Solicita un link de pago personalizado."
        icono={
          <CreditCard size={22} />
        }
        onClose={
          cerrarMetodo
        }
      >

        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {tarjeta?.mensaje ||
            'Solicita tu link de pago para tarjeta de débito o crédito.'}
        </p>


        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">

          <div className="flex gap-3">

            <AlertTriangle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div>

              <p className="font-bold text-amber-900 dark:text-amber-200">
                Importante antes de pagar
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200/80">
                {tarjeta?.recargo_mensaje ||
                  'Los pagos con tarjeta pueden generar un recargo adicional aplicado por la entidad bancaria o procesador de pagos.'}
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-cyan-600 dark:bg-cyan-400 dark:text-zinc-950 dark:hover:bg-cyan-300"
          >
            <MessageCircle
              size={19}
            />

            Solicitar link de pago
          </a>

        )}


        <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
          Te enviaremos por WhatsApp el link correspondiente a tu renovación.
        </p>

      </BottomSheet>

    </>
  )
}
