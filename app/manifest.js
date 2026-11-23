// App instalable (PWA): "Agregar a pantalla de inicio" en Android/iOS
// y "Instalar app" en Chrome/Edge de escritorio.
export default function manifest() {
  return {
    name: 'MAK Clientes · MAK FITNESS',
    short_name: 'MAK Clientes',
    description: 'Tu rutina, tus entrenamientos y tu membresía de MAK FITNESS.',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0D1417',
    theme_color: '#0D1417',
    lang: 'es',
    categories: ['health', 'fitness', 'sports'],
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Mi rutina', url: '/inicio', icons: [{ src: '/icono-192.png', sizes: '192x192' }] },
      { name: 'Mi progreso', url: '/progreso', icons: [{ src: '/icono-192.png', sizes: '192x192' }] },
    ],
  }
}
