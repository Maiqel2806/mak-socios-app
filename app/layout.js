import './globals.css'

export const metadata = {
  title:
    'MAK Socios | MAK FITNESS',

  description:
    'Membresía, entrenamiento y progreso para socios MAK FITNESS.',
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
      </body>
    </html>
  )
}
