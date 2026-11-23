import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import MaikAssistant from '@/components/MaikAssistant'

export const metadata = {
  title:
    'MAK Clientes | MAK FITNESS',

  description:
    'Membresía, entrenamiento y progreso para clientes MAK FITNESS.',
}


const fuenteTexto = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-texto',
  display: 'swap',
})

const fuenteDisplay = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const viewport = {
  themeColor: '#0D1417',
}

const scriptTema = `
(function () {
  try {
    var tema =
      localStorage.getItem(
        'mak-socios-theme'
      );

    if (tema === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (error) {}
})();
`


export default function RootLayout({
  children,
}) {
  return (
    <html
      lang="es"
      className={`${fuenteTexto.variable} ${fuenteDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              scriptTema,
          }}
        />
      </head>

      <body>
        {children}
        <MaikAssistant />
      </body>
    </html>
  )
}
