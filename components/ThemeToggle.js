'use client'

import {
  useEffect,
  useState,
} from 'react'

import {
  Moon,
  Sun,
} from 'lucide-react'


const STORAGE_KEY =
  'mak-socios-theme'


function aplicarTema(
  tema
) {
  const esOscuro =
    tema === 'dark'

  document.documentElement
    .classList
    .toggle(
      'dark',
      esOscuro
    )

  document.documentElement.style.colorScheme =
    esOscuro
      ? 'dark'
      : 'light'
}


export default function ThemeToggle({
  compacto = false,
}) {
  const [
    tema,
    setTema,
  ] = useState('light')


  useEffect(() => {
    const guardado =
      window.localStorage.getItem(
        STORAGE_KEY
      )

    const inicial =
      guardado === 'dark'
        ? 'dark'
        : 'light'

    setTema(
      inicial
    )

    aplicarTema(
      inicial
    )
  }, [])


  function cambiarTema() {
    const nuevoTema =
      tema === 'dark'
        ? 'light'
        : 'dark'

    setTema(
      nuevoTema
    )

    window.localStorage.setItem(
      STORAGE_KEY,
      nuevoTema
    )

    aplicarTema(
      nuevoTema
    )
  }


  const esOscuro =
    tema === 'dark'


  return (
    <button
      type="button"
      onClick={
        cambiarTema
      }
      aria-label={
        esOscuro
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro'
      }
      title={
        esOscuro
          ? 'Modo oscuro'
          : 'Modo claro'
      }
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {esOscuro
        ? (
          <Moon
            size={18}
          />
        )
        : (
          <Sun
            size={18}
          />
        )}

      {!compacto && (
        <span>
          {esOscuro
            ? 'Oscuro'
            : 'Claro'}
        </span>
      )}
    </button>
  )
}
